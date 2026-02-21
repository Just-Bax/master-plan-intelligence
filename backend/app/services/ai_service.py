"""AI chat using an OpenAI-compatible API (config: AI_BASE_URL, AI_API_KEY, AI_MODEL)."""

import json
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    ERROR_MESSAGE_AI_CHAT_NOT_CONFIGURED,
    ERROR_MESSAGE_AI_NOT_CONFIGURED,
    ERROR_MESSAGE_NO_RESPONSE_FROM_MODEL,
    MAX_OBJECTS_IN_AI_CONTEXT,
)
from app.constants.prompts import (
    CHAT_LOCALE_INSTRUCTION_TEMPLATE,
    CHAT_SYSTEM_PROMPT,
    REPORT_SYSTEM_MESSAGE,
)
from app.core.config import settings
from app.core.geography import first_coordinate_pair, geom_to_geojson
from app.models.object import Object
from app.schemas.ai import ChatRequest
from app.services import master_plan_service
from app.services import object_service
from app.utils.prompt_utils import (
    build_report_prompt,
    strip_json_from_completion,
    validate_report_top_level,
)


async def build_chat_context(
    db: AsyncSession,
    master_plan_id: int | None,
    object_ids: list[int] | None,
) -> str:
    """Load master plan(s) and object(s) per selection and return a compact context string."""
    plans_data: list[dict[str, Any]] = []
    objects_data: list[dict[str, Any]] = []

    object_id_set = set(object_ids) if object_ids else None

    if master_plan_id is not None:
        plan, plan_area = await master_plan_service.get_by_id(db, master_plan_id)
        plans_data = [
            {
                "id": plan.id,
                "name": plan.name,
                "area_m2": round(plan_area, 2) if plan_area is not None else None,
            }
        ]
        rows = await master_plan_service.list_objects_in_plan(db, master_plan_id)
        for obj, area_m2 in rows:
            if object_id_set is not None and obj.id not in object_id_set:
                continue
            objects_data.append(_object_to_context_dict(obj, area_m2))
    else:
        plan_rows = await master_plan_service.list_master_plans(db)
        plans_data = [
            {
                "id": p.id,
                "name": p.name,
                "area_m2": round(a, 2) if a is not None else None,
            }
            for p, a in plan_rows
        ]
        obj_rows = await object_service.list_objects(db, object_type_id=None)
        for obj, area_m2 in obj_rows:
            if object_id_set is not None and obj.id not in object_id_set:
                continue
            objects_data.append(_object_to_context_dict(obj, area_m2))

    if len(objects_data) > MAX_OBJECTS_IN_AI_CONTEXT:
        objects_data = objects_data[:MAX_OBJECTS_IN_AI_CONTEXT]
        objects_data.append(
            {
                "_truncated": True,
                "message": f"Only first {MAX_OBJECTS_IN_AI_CONTEXT} objects shown.",
            }
        )

    if not plans_data and not objects_data:
        return "No master plans or objects in the current scope."

    return json.dumps(
        {"master_plans": plans_data, "objects": objects_data},
        ensure_ascii=False,
        separators=(",", ":"),
    )


def _object_to_context_dict(obj: Object, area_m2: float | None) -> dict[str, Any]:
    """Build a compact dict for one object (no geometry)."""
    d: dict[str, Any] = {
        "id": obj.id,
        "name": obj.name,
        "object_type_code": obj.object_type.code if obj.object_type else None,
        "function_type_code": obj.function_type.code if obj.function_type else None,
        "area_m2": round(area_m2, 2) if area_m2 is not None else None,
        "district": obj.district,
        "address_full": obj.address_full,
        "capacity_people_max": obj.capacity_people_max,
        "student_capacity": obj.student_capacity,
        "bed_count": obj.bed_count,
        "unit_count": obj.unit_count,
        "power_connected": obj.power_connected,
        "water_connected": obj.water_connected,
        "sewer_connected": obj.sewer_connected,
    }
    return {k: v for k, v in d.items() if v is not None}


def _object_to_report_dict(obj: Object) -> dict[str, Any]:
    """Build dict for one object for the development report prompt (allowed fields only)."""
    geom = geom_to_geojson(obj.geometry)
    longitude, latitude = first_coordinate_pair(geom)
    d: dict[str, Any] = {
        "id": obj.id,
        "object_id": obj.object_id,
        "parcel_id": obj.parcel_id,
        "object_type": obj.object_type.code if obj.object_type else None,
        "function_type": obj.function_type.code if obj.function_type else None,
        "name_ru": obj.name,
        "latitude": latitude,
        "longitude": longitude,
        "administrative_region": obj.administrative_region,
        "district": obj.district,
        "mahalla": obj.mahalla,
        "address_full": obj.address_full,
        "capacity_people_max": obj.capacity_people_max,
        "student_capacity": obj.student_capacity,
        "bed_count": obj.bed_count,
        "unit_count": obj.unit_count,
        "distance_public_transport_m": obj.distance_public_transport_m,
        "distance_primary_road_m": obj.distance_primary_road_m,
        "parking_spaces_total": obj.parking_spaces_total,
        "protected_zone": obj.protected_zone,
        "heritage_zone": obj.heritage_zone,
        "flood_zone": obj.flood_zone,
        "environmental_risk_score": obj.environmental_risk_score,
        "power_connected": obj.power_connected,
        "available_power_capacity_kw": obj.available_power_capacity_kw,
        "water_connected": obj.water_connected,
        "sewer_connected": obj.sewer_connected,
    }
    return {k: v for k, v in d.items() if v is not None}


async def build_report_context(
    db: AsyncSession, master_plan_id: int
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Load master plan and objects in plan; return (plan_info, objects_list) for the report prompt."""
    plan, plan_area = await master_plan_service.get_by_id(db, master_plan_id)
    rows = await master_plan_service.list_objects_in_plan(db, master_plan_id)
    plan_info = {
        "id": plan.id,
        "name": plan.name,
        "area_m2": round(plan_area, 2) if plan_area is not None else None,
    }
    objects_list = [_object_to_report_dict(obj) for obj, _ in rows]
    return (plan_info, objects_list)


async def generate_development_report(
    db: AsyncSession, master_plan_id: int
) -> dict[str, Any]:
    """Build objects list, call LLM with analyst prompt, parse JSON, validate. Raises ValueError on parse/validation failure."""
    if not settings.AI_API_KEY:
        raise ValueError(ERROR_MESSAGE_AI_NOT_CONFIGURED)

    plan_info, objects_list = await build_report_context(db, master_plan_id)
    master_plan_context_str = json.dumps(
        plan_info, ensure_ascii=False, separators=(",", ": ")
    )
    list_of_objects_str = json.dumps(objects_list, ensure_ascii=False, indent=2)
    prompt = build_report_prompt(master_plan_context_str, list_of_objects_str)

    client = AsyncOpenAI(
        base_url=settings.AI_BASE_URL,
        api_key=settings.AI_API_KEY,
    )
    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_MESSAGE},
            {"role": "user", "content": prompt},
        ],
    )
    choice = response.choices[0] if response.choices else None
    if not choice or not choice.message or not choice.message.content:
        raise ValueError(ERROR_MESSAGE_NO_RESPONSE_FROM_MODEL)

    raw = strip_json_from_completion(choice.message.content)
    try:
        report = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model did not return valid JSON: {e}") from e

    validate_report_top_level(report)
    return report


async def chat(body: ChatRequest, context: str) -> str:
    if not settings.AI_API_KEY:
        return ERROR_MESSAGE_AI_CHAT_NOT_CONFIGURED

    client = AsyncOpenAI(
        base_url=settings.AI_BASE_URL,
        api_key=settings.AI_API_KEY,
    )

    system_parts = [CHAT_SYSTEM_PROMPT]
    if body.locale:
        system_parts.append(CHAT_LOCALE_INSTRUCTION_TEMPLATE.format(locale=body.locale))
    api_messages: list[dict[str, str]] = [
        {"role": "system", "content": " ".join(system_parts)}
    ]

    # Build messages: full history, with context prepended only to the first user message
    first_user_seen = False
    for msg in body.messages:
        role = "assistant" if msg.role == "ai" else msg.role
        content = msg.content
        if role == "user" and not first_user_seen:
            first_user_seen = True
            content = f"Context (master plans and objects):\n{context}\n\nUser message:\n{content}"
        api_messages.append({"role": role, "content": content})

    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=api_messages,
    )
    choice = response.choices[0] if response.choices else None
    if choice and choice.message and choice.message.content:
        return choice.message.content
    return ERROR_MESSAGE_NO_RESPONSE_FROM_MODEL

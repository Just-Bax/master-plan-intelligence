"""AI chat using an OpenAI-compatible API (config: AI_BASE_URL, AI_API_KEY, AI_MODEL)."""

import json
import re
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.geo import geom_to_geojson
from app.models.object import Object
from app.schemas.ai import ChatRequest
from app.services import master_plan_service
from app.services import object_service

# Max objects to include in context to avoid token overflow
CONTEXT_OBJECTS_CAP = 500


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

    if len(objects_data) > CONTEXT_OBJECTS_CAP:
        objects_data = objects_data[:CONTEXT_OBJECTS_CAP]
        objects_data.append(
            {
                "_truncated": True,
                "message": f"Only first {CONTEXT_OBJECTS_CAP} objects shown.",
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


def _first_coordinate_pair(geom: dict[str, Any] | None) -> tuple[float | None, float | None]:
    """Extract (longitude, latitude) from GeoJSON: Point, or first vertex of Polygon/LineString/MultiPoint."""
    if not isinstance(geom, dict):
        return (None, None)
    coords = geom.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 1:
        return (None, None)
    # Point: coordinates = [lon, lat]
    if isinstance(coords[0], (int, float)) and len(coords) >= 2 and isinstance(coords[1], (int, float)):
        return (float(coords[0]), float(coords[1]))
    # LineString / MultiPoint: coordinates = [[lon,lat],...]
    first = coords[0]
    if isinstance(first, (list, tuple)) and len(first) >= 2:
        if isinstance(first[0], (int, float)) and isinstance(first[1], (int, float)):
            return (float(first[0]), float(first[1]))
        # Polygon: coordinates = [[[lon,lat],...]] — first is a ring
        if isinstance(first[0], (list, tuple)) and len(first[0]) >= 2:
            p = first[0]
            if isinstance(p[0], (int, float)) and isinstance(p[1], (int, float)):
                return (float(p[0]), float(p[1]))
    return (None, None)


def _object_to_report_dict(obj: Object) -> dict[str, Any]:
    """Build dict for one object for the development report prompt (allowed fields only)."""
    geom = geom_to_geojson(obj.geometry)
    longitude, latitude = _first_coordinate_pair(geom)
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


# Analyst prompt template: {master_plan_context} and {list_of_objects} are replaced.
DEVELOPMENT_REPORT_PROMPT = """РОЛЬ
Ты — аналитик градостроительного программирования. Формируешь 15-летнюю программу развития территории: что нужно построить/расширить, в каких фазах и на каких объектах.

ВХОД
Тебе дают два параметра:

Мастер план (контекст — id, название, площадь в м²; используй только объекты из этого плана):

{master_plan_context}

и

Лист Объектов (все объекты, попадающие в границы этого мастер-плана):

{list_of_objects}

Далее в тексте называй их просто "название мастерплана" и "входной список объектов", не повторяя плейсхолдеры.

ОГРАНИЧЕНИЯ
- Не создавай новые объекты и не изменяй координаты. Используй только входной список объектов.
- Если каких-то данных не хватает, используй допущения (assumptions) и явно отмечай, что это допущения.
- Все количественные выводы (сколько проектов) должны объясняться формулой/логикой и исходными полями.

ПОЛЯ ОБЪЕКТОВ, КОТОРЫЕ МОЖНО ИСПОЛЬЗОВАТЬ
Используй только эти поля (если они есть у объекта):
- Идентичность: object_id, parcel_id, object_type, function_type, name_ru
- Локация: latitude, longitude, administrative_region, district, mahalla, address_full
- Мощности/сервис: capacity_people_max, student_capacity, bed_count, unit_count
- Мобильность: distance_public_transport_m, distance_primary_road_m, parking_spaces_total
- Ограничения: protected_zone, heritage_zone, flood_zone, environmental_risk_score
- Сети: power_connected, available_power_capacity_kw, water_connected, sewer_connected

УПРОЩЁННАЯ БИЗНЕС-ЛОГИКА

1) Инвентаризация (baseline)
- Посчитай:
  - objects_total = количество всех объектов
  - housing_units_total = сумма unit_count по объектам жилья. Жильё: function_type начинается с "residential" или "housing" или содержит "residential"/"housing"; или object_type = "building" с функцией жилья. unit_count без значения считай 0.
  - school_seats_total = сумма student_capacity по education_* (школы/лицеи/колледжи/университеты — отдельно можно выделить, но минимум: sum(student_capacity))
  - kindergarten_seats_total = сумма student_capacity по education_kindergarten
  - hospital_beds_total = сумма bed_count по health_hospital
  - clinic_capacity_total = сумма capacity_people_max по health_clinic (если пусто — считать 0)
  - parking_spaces_total = сумма parking_spaces_total по всем объектам
  - green_objects_total = количество объектов с object_type=green_space (если нет площадей, используем count)

2) Оценка населения (обязательно заполни population_estimated для расчёта потребностей)
- Если housing_units_total > 0: pop_est = housing_units_total * avg_household_size (источник: жильё).
- Иначе используй ОЦЕНКУ ПО МОЩНОСТЯМ (чтобы не оставлять needs и phases пустыми):
  - если school_seats_total > 0: pop_est = round(school_seats_total / school_age_share) (оценка по школам);
  - иначе если kindergarten_seats_total > 0: pop_est = round(kindergarten_seats_total / (kindergarten_age_share * kindergarten_coverage));
  - иначе если clinic_capacity_total > 0: грубая оценка pop_est по клинике (например 2–3× clinic_capacity_total), укажи в questions;
  - иначе pop_est = null и в questions обязательно попроси уточнить население или жилые единицы.
- avg_household_size — допущение (по умолчанию 3.6).
- В questions укажи, что население оценено по школам/детсадам/клинике, если не по жилью.

3) Расчёт потребностей (needs) через допущения (если пользователь не дал нормы)
Используй базовые допущения (их можно менять в assumptions):
- school_age_share = 0.14  (доля школьного возраста от населения)
- kindergarten_age_share = 0.07 (доля дошкольников)
- kindergarten_coverage = 0.60 (целевое покрытие детсадом)
- school_unit_capacity = 900 мест (типовой объект)
- kindergarten_unit_capacity = 240 мест
- parking_spaces_per_unit = 0.35 мест на 1 квартиру
- parking_multilevel_capacity = 300 мест
- env_risk_max = 0.60 (порог "желательно" для BUILD_NOW)
- park_rule_people_per_green_object = 12000 (1 зелёный объект на N жителей, раз нет м²)

Тогда (если pop_est != null — всегда считай required и gaps):
- required_school_seats = pop_est * school_age_share
- required_kindergarten_seats = pop_est * kindergarten_age_share * kindergarten_coverage
- required_parking_spaces = housing_units_total * parking_spaces_per_unit (если housing_units_total = 0, используй pop_est/avg_household_size как оценку числа квартир для парковок)
- required_green_objects = ceil(pop_est / park_rule_people_per_green_object)

4) Дефициты (gap)
- school_seats_gap = max(0, required_school_seats - school_seats_total)
- kindergarten_seats_gap = max(0, required_kindergarten_seats - kindergarten_seats_total)
- parking_spaces_gap = max(0, required_parking_spaces - parking_spaces_total)
- green_objects_gap = max(0, required_green_objects - green_objects_total)

5) Перевод дефицитов в количество проектов и ОБЯЗАТЕЛЬНОЕ заполнение phases
- new_schools = ceil(school_seats_gap / school_unit_capacity)
- new_kindergartens = ceil(kindergarten_seats_gap / kindergarten_unit_capacity)
- new_parking_multilevel = ceil(parking_spaces_gap / parking_multilevel_capacity)
- new_green_spaces = green_objects_gap  (так как считаем по объектам)
- КРИТИЧНО: если какой-либо gap > 0 или есть потребность в клинике (см. ниже), ты ОБЯЗАН заполнить phases.projects конкретными проектами: у каждого проекта укажи project_id (PRJ-001, PRJ-002, ...), service_type, action, target_object_id (id из входного списка объектов), backup_object_ids, eligibility, why_this_object, required_interventions. Не оставляй phases с пустыми projects при наличии дефицитов.

Про клинику (упрощённо):
- Если clinic_capacity_total == 0 и pop_est != null и pop_est > 15000 → предложи 1 "амбулатория/поликлиника"
- Если clinic_capacity_total > 0 → оставь 0, но можешь предложить "расширение" при высоком pop_est (как CONDITIONAL), если не хватает данных — добавь вопрос

6) Выбор target_object_id (привязка проектов к объектам)
Для каждого проекта выбери:
- target_object_id (1 основной) + backup_object_ids (1–2)
Правила пригодности:
- REJECT для капитальных объектов (школа/детсад/клиника/парковка), если:
  protected_zone=Да OR heritage_zone=Да OR flood_zone=Да
- BUILD_NOW если:
  power_connected=Да AND water_connected=Да AND sewer_connected=Да
  AND environmental_risk_score <= env_risk_max (если задан)
  AND distance_public_transport_m и distance_primary_road_m — предпочтительно минимальные среди кандидатов
- CONDITIONAL если объект лучший по доступности, но:
  - power/water/sewer = Нет (нужно подключение)
  - available_power_capacity_kw очень низкий/пустой (нужно усиление)
  - environmental_risk_score выше порога (нужны меры/перенос)
В "required_interventions" перечисли, что надо сделать.

7) Фазирование
- Фаза 1 (1–3): "быстрые и критичные" (парковка, 1 детсад при большом дефиците, улучшения доступа)
- Фаза 2 (4–7): "тяжёлые" (школа, поликлиника)
- Фаза 3 (8–15): дополнительные объекты/расширения, если дефицит остаётся

ФОРМАТ ВЫХОДА (СТРОГО)
Верни только JSON (без markdown и без пояснений вокруг), по схеме:

{
  "masterplan_name": "...",
  "generated_at": "YYYY-MM-DD",
  "assumptions": {
    "avg_household_size": 3.6,
    "school_age_share": 0.14,
    "kindergarten_age_share": 0.07,
    "kindergarten_coverage": 0.60,
    "school_unit_capacity": 900,
    "kindergarten_unit_capacity": 240,
    "parking_spaces_per_unit": 0.35,
    "parking_multilevel_capacity": 300,
    "env_risk_max": 0.60,
    "park_rule_people_per_green_object": 12000
  },
  "baseline": {
    "objects_total": 0,
    "housing_units_total": 0,
    "population_estimated": null,
    "capacities": {
      "school_seats_total": 0,
      "kindergarten_seats_total": 0,
      "hospital_beds_total": 0,
      "clinic_capacity_total": 0,
      "parking_spaces_total": 0,
      "green_objects_total": 0
    }
  },
  "needs_15y": {
    "required": {
      "school_seats": null,
      "kindergarten_seats": null,
      "parking_spaces": null,
      "green_objects": null
    },
    "gaps": {
      "school_seats_gap": 0,
      "kindergarten_seats_gap": 0,
      "parking_spaces_gap": 0,
      "green_objects_gap": 0
    },
    "projects_summary": [
      {"service_type":"school","new_projects":0,"capacity_added":{"seats":0}},
      {"service_type":"kindergarten","new_projects":0,"capacity_added":{"seats":0}},
      {"service_type":"clinic","new_projects":0,"capacity_added":{"capacity_people_max":0}},
      {"service_type":"parking_multilevel","new_projects":0,"capacity_added":{"spaces":0}},
      {"service_type":"green_space","new_projects":0,"capacity_added":{"objects":0}}
    ]
  },
  "phases": [
    {
      "phase": "1-3",
      "projects": [
        {
          "project_id": "PRJ-001",
          "service_type": "school|kindergarten|clinic|parking_multilevel|green_space",
          "action": "NEW_BUILD|EXPAND|UPGRADE|CONVERT",
          "capacity_added": {"seats":0,"spaces":0,"capacity_people_max":0,"objects":0},
          "target_object_id": "...",
          "backup_object_ids": ["..."],
          "eligibility": "BUILD_NOW|CONDITIONAL|REJECT",
          "why_this_object": ["коротко по полям: сети/риски/ОТ/дорога/парковка"],
          "required_interventions": ["если CONDITIONAL — что нужно сделать"]
        }
      ]
    },
    {"phase":"4-7","projects":[]},
    {"phase":"8-15","projects":[]}
  ],
  "questions": ["короткие вопросы, если pop_est=null или нормы нужно уточнить"]
}
"""

_REPORT_TOP_LEVEL_KEYS = frozenset(
    {
        "masterplan_name",
        "generated_at",
        "assumptions",
        "baseline",
        "needs_15y",
        "phases",
        "questions",
    }
)


def _strip_json_from_completion(text: str) -> str:
    """Remove markdown code fences around JSON if present."""
    text = text.strip()
    # ```json ... ``` or ``` ... ```
    m = re.search(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    return text


async def generate_development_report(
    db: AsyncSession, master_plan_id: int
) -> dict[str, Any]:
    """Build objects list, call LLM with analyst prompt, parse JSON, validate. Raises ValueError on parse/validation failure."""
    if not settings.AI_API_KEY:
        raise ValueError("AI is not configured. Set AI_API_KEY in .env to enable.")

    plan_info, objects_list = await build_report_context(db, master_plan_id)
    master_plan_context_str = json.dumps(
        plan_info, ensure_ascii=False, separators=(",", ": ")
    )
    list_of_objects_str = json.dumps(objects_list, ensure_ascii=False, indent=2)
    prompt = DEVELOPMENT_REPORT_PROMPT.replace(
        "{master_plan_context}", master_plan_context_str
    ).replace("{list_of_objects}", list_of_objects_str)

    client = AsyncOpenAI(
        base_url=settings.AI_BASE_URL,
        api_key=settings.AI_API_KEY,
    )
    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "Ты возвращаешь только валидный JSON по заданной схеме. Без markdown и без текста до или после JSON.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    choice = response.choices[0] if response.choices else None
    if not choice or not choice.message or not choice.message.content:
        raise ValueError("No response from the model.")

    raw = _strip_json_from_completion(choice.message.content)
    try:
        report = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model did not return valid JSON: {e}") from e

    if not isinstance(report, dict):
        raise ValueError("Report must be a JSON object.")
    missing = _REPORT_TOP_LEVEL_KEYS - set(report.keys())
    if missing:
        raise ValueError(f"Report missing required keys: {sorted(missing)}")

    return report


async def chat(body: ChatRequest, context: str) -> str:
    if not settings.AI_API_KEY:
        return "AI chat is not configured. Set AI_API_KEY in .env to enable."

    client = AsyncOpenAI(
        base_url=settings.AI_BASE_URL,
        api_key=settings.AI_API_KEY,
    )

    # System prompt: role and response locale
    system_parts = [
        "You are an expert assistant for a master planning and project development application. "
        "You help users analyze master plans, objects (facilities, transport, POIs), and related data. "
        "Answer concisely and use the provided context when relevant.",
    ]
    if body.locale:
        locale_instruction = (
            f"Always respond in the user's preferred language: locale code '{body.locale}' "
            "(e.g. English for 'en', Russian for 'ru', Uzbek for 'uz')."
        )
        system_parts.append(locale_instruction)
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
    return "No response from the model."

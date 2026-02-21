from typing import Any

from geoalchemy2.functions import ST_Area, ST_Within
from geoalchemy2.types import Geography
from sqlalchemy import cast, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.core.geo import geojson_to_wkb, geom_to_geojson
from app.models.master_plan import MasterPlan
from app.models.object import Object
from app.models.user import User
from app.schemas.master_plan import (
    MasterPlanCreate,
    MasterPlanResponse,
    MasterPlanUpdate,
)
from app.services.object_service import _AREA_M2 as _OBJECT_AREA_M2

_PLAN_AREA_M2 = ST_Area(cast(MasterPlan.geometry, Geography(srid=4326))).label(
    "area_m2"
)

# Default boundary polygon for new master plans (slightly larger square near Tashkent)
DEFAULT_PLAN_GEOMETRY: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [
            [69.275, 41.305],
            [69.288, 41.305],
            [69.288, 41.318],
            [69.275, 41.318],
            [69.275, 41.305],
        ]
    ],
}


def plan_to_response(
    plan: MasterPlan, area_m2: float | None = None
) -> MasterPlanResponse:
    rounded_area = round(area_m2, 2) if area_m2 is not None else None
    return MasterPlanResponse.model_validate(
        {
            "id": plan.id,
            "name": plan.name,
            "geometry": geom_to_geojson(plan.geometry),
            "created_at": plan.created_at,
            "created_by": plan.created_by,
            "updated_at": plan.updated_at,
            "updated_by": plan.updated_by,
            "area_m2": rounded_area,
            "ai_development_report": plan.ai_development_report,
        }
    )


async def list_master_plans(
    db: AsyncSession,
) -> list[tuple[MasterPlan, float | None]]:
    result = await db.execute(
        select(MasterPlan, _PLAN_AREA_M2).order_by(MasterPlan.updated_at.desc())
    )
    return [(row[0], row[1]) for row in result.all()]


async def get_by_id(
    db: AsyncSession, master_plan_id: int
) -> tuple[MasterPlan, float | None]:
    result = await db.execute(
        select(MasterPlan, _PLAN_AREA_M2).where(MasterPlan.id == master_plan_id)
    )
    row = result.one_or_none()
    if row is None:
        raise NotFoundError("Master plan not found")
    return (row[0], row[1])


async def create_master_plan(
    db: AsyncSession,
    body: MasterPlanCreate,
    current_user: User | None = None,
) -> tuple[MasterPlan, float | None]:
    geometry = body.geometry if body.geometry is not None else DEFAULT_PLAN_GEOMETRY
    user_id = current_user.id if current_user else None
    plan = MasterPlan(
        name=body.name,
        geometry=geojson_to_wkb(geometry),
        created_by=user_id,
        updated_by=user_id,
    )
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    result = await db.execute(select(_PLAN_AREA_M2).where(MasterPlan.id == plan.id))
    row = result.one_or_none()
    return (plan, row[0] if row else None)


async def list_objects_in_plan(
    db: AsyncSession,
    master_plan_id: int,
) -> list[tuple[Object, float | None]]:
    await get_by_id(db, master_plan_id)  # ensure plan exists
    plan_geom_subq = (
        select(MasterPlan.geometry)
        .where(MasterPlan.id == master_plan_id)
        .scalar_subquery()
    )
    q = (
        select(Object, _OBJECT_AREA_M2)
        .where(
            Object.geometry.isnot(None),
            ST_Within(Object.geometry, plan_geom_subq),
        )
        .options(
            selectinload(Object.object_type),
            selectinload(Object.function_type),
        )
        .order_by(Object.updated_at.desc())
    )
    result = await db.execute(q)
    return [(row[0], row[1]) for row in result.unique().all()]


async def update_master_plan(
    db: AsyncSession,
    master_plan_id: int,
    body: MasterPlanUpdate,
    current_user: User | None = None,
) -> tuple[MasterPlan, float | None]:
    plan, _ = await get_by_id(db, master_plan_id)
    if body.name is not None:
        plan.name = body.name
    if body.geometry is not None:
        plan.geometry = geojson_to_wkb(body.geometry)
    if current_user is not None:
        plan.updated_by = current_user.id
    await db.flush()
    await db.refresh(plan)
    result = await db.execute(select(_PLAN_AREA_M2).where(MasterPlan.id == plan.id))
    row = result.one_or_none()
    return (plan, row[0] if row else None)


async def delete_master_plan(
    db: AsyncSession,
    master_plan_id: int,
) -> None:
    plan, _ = await get_by_id(db, master_plan_id)
    await db.delete(plan)


async def update_ai_development_report(
    db: AsyncSession,
    master_plan_id: int,
    report: dict[str, Any],
) -> MasterPlan:
    """Update master plan ai_development_report and return the plan."""
    plan, _ = await get_by_id(db, master_plan_id)
    plan.ai_development_report = report
    await db.flush()
    await db.refresh(plan)
    return plan

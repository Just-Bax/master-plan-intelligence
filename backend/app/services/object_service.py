from typing import Any

from geoalchemy2.functions import ST_Area
from geoalchemy2.types import Geography
from sqlalchemy import cast, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.constants import ERROR_MESSAGE_OBJECT_NOT_FOUND
from app.core.exceptions import NotFoundError
from app.core.geography import (
    geojson_to_wkb,
    geom_to_geojson,
    require_point_geojson,
)
from app.models.object import Object
from app.models.user import User
from app.schemas.object import ObjectCreate, ObjectResponse, ObjectUpdate

_AREA_M2 = ST_Area(cast(Object.geometry, Geography(srid=4326))).label("area_m2")

# Default point near Tashkent (lng, lat) for new objects without geometry
DEFAULT_GEOMETRY: dict[str, Any] = {
    "type": "Point",
    "coordinates": [69.279, 41.308],
}


def object_to_response(obj: Object, area_m2: float | None = None) -> ObjectResponse:
    rounded_area = round(area_m2, 2) if area_m2 is not None else None
    return ObjectResponse.model_validate(
        {
            "id": obj.id,
            "object_type_id": obj.object_type_id,
            "object_type_code": obj.object_type.code if obj.object_type else None,
            "function_type_id": obj.function_type_id,
            "function_type_code": obj.function_type.code if obj.function_type else None,
            "parent_id": obj.parent_id,
            "object_id": obj.object_id,
            "parcel_id": obj.parcel_id,
            "name": obj.name,
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
            "data_source_reference": obj.data_source_reference,
            "created_by": obj.created_by,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "updated_by": obj.updated_by,
            "geometry": geom_to_geojson(obj.geometry),
            "area_m2": rounded_area,
        }
    )


async def list_objects(
    db: AsyncSession,
    object_type_id: int | None = None,
) -> list[tuple[Object, float | None]]:
    q = (
        select(Object, _AREA_M2)
        .options(
            selectinload(Object.object_type),
            selectinload(Object.function_type),
        )
        .order_by(Object.updated_at.desc())
    )
    if object_type_id is not None:
        q = q.where(Object.object_type_id == object_type_id)
    result = await db.execute(q)
    return [(row[0], row[1]) for row in result.all()]


async def get_by_id(db: AsyncSession, object_id: int) -> tuple[Object, float | None]:
    result = await db.execute(
        select(Object, _AREA_M2)
        .where(Object.id == object_id)
        .options(
            selectinload(Object.object_type),
            selectinload(Object.function_type),
        )
    )
    row = result.one_or_none()
    if row is None:
        raise NotFoundError(ERROR_MESSAGE_OBJECT_NOT_FOUND)
    return (row[0], row[1])


def _apply_object_create(obj: Object, body: ObjectCreate) -> None:
    data = body.model_dump(exclude={"geometry"})
    for key, value in data.items():
        setattr(obj, key, value)


async def create_object(
    db: AsyncSession,
    body: ObjectCreate,
    current_user: User,
) -> tuple[Object, float | None]:
    geometry = body.geometry if body.geometry is not None else DEFAULT_GEOMETRY
    require_point_geojson(geometry)
    obj = Object(
        geometry=geojson_to_wkb(geometry),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    _apply_object_create(obj, body)
    db.add(obj)
    await db.flush()
    result = await db.execute(
        select(Object, _AREA_M2)
        .where(Object.id == obj.id)
        .options(
            selectinload(Object.object_type),
            selectinload(Object.function_type),
        )
    )
    row = result.one()
    return (row[0], row[1])


def _apply_object_update(obj: Object, body: ObjectUpdate) -> None:
    data = body.model_dump(exclude_unset=True, exclude={"geometry"})
    for key, value in data.items():
        setattr(obj, key, value)
    if body.geometry is not None:
        require_point_geojson(body.geometry)
        obj.geometry = geojson_to_wkb(body.geometry)


async def update_object(
    db: AsyncSession,
    object_id: int,
    body: ObjectUpdate,
    current_user: User,
) -> tuple[Object, float | None]:
    obj, _ = await get_by_id(db, object_id)
    obj.updated_by = current_user.id
    _apply_object_update(obj, body)
    await db.flush()
    await db.refresh(obj)
    result = await db.execute(
        select(Object, _AREA_M2)
        .where(Object.id == obj.id)
        .options(
            selectinload(Object.object_type),
            selectinload(Object.function_type),
        )
    )
    row = result.one()
    return (row[0], row[1])


async def delete_object(
    db: AsyncSession,
    object_id: int,
    current_user: User,
) -> None:
    result = await db.execute(select(Object).where(Object.id == object_id))
    obj = result.scalar_one_or_none()
    if obj is None:
        raise NotFoundError(ERROR_MESSAGE_OBJECT_NOT_FOUND)
    await db.delete(obj)

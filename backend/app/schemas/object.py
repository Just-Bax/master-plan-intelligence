from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

from app.schemas.geo import GeoJSONGeometry


def _validate_point_geometry(v: dict[str, Any] | None) -> dict[str, Any] | None:
    """Object geometry must be Point with coordinates [lng, lat]."""
    if v is None:
        return v
    if v.get("type") != "Point":
        raise ValueError("Object geometry must be type 'Point'")
    coords = v.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 2:
        raise ValueError("Point geometry must have coordinates [lng, lat]")
    return v


class ObjectBase(BaseModel):
    object_type_id: int
    function_type_id: int | None = None
    parent_id: int | None = None
    object_id: str | None = None
    parcel_id: str | None = None
    name: str | None = None
    administrative_region: str | None = None
    district: str | None = None
    mahalla: str | None = None
    address_full: str | None = None
    capacity_people_max: int | None = None
    student_capacity: int | None = None
    bed_count: int | None = None
    unit_count: int | None = None
    distance_public_transport_m: int | None = None
    distance_primary_road_m: int | None = None
    parking_spaces_total: int | None = None
    protected_zone: bool | None = None
    heritage_zone: bool | None = None
    flood_zone: bool | None = None
    environmental_risk_score: float | None = None
    power_connected: bool | None = None
    available_power_capacity_kw: int | None = None
    water_connected: bool | None = None
    sewer_connected: bool | None = None
    data_source_reference: str | None = None


class ObjectCreate(ObjectBase):
    geometry: GeoJSONGeometry | None = None

    @field_validator("geometry")
    @classmethod
    def geometry_point(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        return _validate_point_geometry(v)


class ObjectUpdate(BaseModel):
    object_type_id: int | None = None
    function_type_id: int | None = None
    parent_id: int | None = None
    object_id: str | None = None
    parcel_id: str | None = None
    name: str | None = None
    administrative_region: str | None = None
    district: str | None = None
    mahalla: str | None = None
    address_full: str | None = None
    capacity_people_max: int | None = None
    student_capacity: int | None = None
    bed_count: int | None = None
    unit_count: int | None = None
    distance_public_transport_m: int | None = None
    distance_primary_road_m: int | None = None
    parking_spaces_total: int | None = None
    protected_zone: bool | None = None
    heritage_zone: bool | None = None
    flood_zone: bool | None = None
    environmental_risk_score: float | None = None
    power_connected: bool | None = None
    available_power_capacity_kw: int | None = None
    water_connected: bool | None = None
    sewer_connected: bool | None = None
    data_source_reference: str | None = None
    geometry: GeoJSONGeometry | None = None

    @field_validator("geometry")
    @classmethod
    def geometry_point(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        return _validate_point_geometry(v)


class ObjectResponse(ObjectBase):
    id: int
    object_type_id: int
    object_type_code: str | None = None
    function_type_id: int | None = None
    function_type_code: str | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime
    updated_by: int | None = None
    geometry: GeoJSONGeometry | None = None
    area_m2: float | None = None

    model_config = {"from_attributes": True}

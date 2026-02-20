from datetime import datetime

from pydantic import BaseModel

from app.schemas.geo import GeoJSONGeometry


class MasterPlanBase(BaseModel):
    name: str


class MasterPlanCreate(MasterPlanBase):
    geometry: GeoJSONGeometry | None = None


class MasterPlanUpdate(BaseModel):
    name: str | None = None
    geometry: GeoJSONGeometry | None = None


class MasterPlanResponse(MasterPlanBase):
    id: int
    created_at: datetime
    created_by: int | None = None
    updated_at: datetime
    updated_by: int | None = None
    geometry: GeoJSONGeometry | None = None
    area_m2: float | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}

from datetime import datetime
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.function_type import FunctionType
    from app.models.object_type import ObjectType
    from app.models.user import User


class Object(Base):
    __tablename__ = "object"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    object_type_id: Mapped[int] = mapped_column(
        ForeignKey("object_type.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    function_type_id: Mapped[int | None] = mapped_column(
        ForeignKey("function_type.id", ondelete="SET NULL"), nullable=True, index=True
    )
    geometry: Mapped[Any] = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("object.id", ondelete="SET NULL"), nullable=True, index=True
    )
    object_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    parcel_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    administrative_region: Mapped[str | None] = mapped_column(
        String(256), nullable=True
    )
    district: Mapped[str | None] = mapped_column(String(256), nullable=True)
    mahalla: Mapped[str | None] = mapped_column(String(256), nullable=True)
    address_full: Mapped[str | None] = mapped_column(Text, nullable=True)
    capacity_people_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    student_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bed_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_public_transport_m: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    distance_primary_road_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    parking_spaces_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protected_zone: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    heritage_zone: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    flood_zone: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    environmental_risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    power_connected: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    available_power_capacity_kw: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    water_connected: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    sewer_connected: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    data_source_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True
    )

    object_type: Mapped["ObjectType"] = relationship("ObjectType")
    function_type: Mapped["FunctionType | None"] = relationship("FunctionType")
    created_by_user: Mapped["User | None"] = relationship(
        "User", back_populates="created_objects", foreign_keys=[created_by]
    )

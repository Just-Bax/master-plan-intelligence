"""Seed object types, function types, and objects from JSON. No master plans. No new users except ensure admin.

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:01

"""

import json
from pathlib import Path
from typing import Any, Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SEED_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "seed_data"

_SEED_FILES = [
    ("001_object_type.json", "object_types"),
    ("002_function_type.json", "function_types"),
    ("003_object.json", "object_geometries"),
]

_SEED_USER_EMAILS = ("admin@example.com",)

meta = sa.MetaData()

user_table = sa.Table(
    "user",
    meta,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("email", sa.String(255), nullable=False),
    sa.Column("hashed_password", sa.String(255), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("created_by", sa.Integer, nullable=True),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("updated_by", sa.Integer, nullable=True),
)

object_type_table = sa.Table(
    "object_type",
    meta,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("code", sa.String(64), nullable=False),
    sa.Column("name", sa.String(256), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("created_by", sa.Integer, nullable=True),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("updated_by", sa.Integer, nullable=True),
)

function_type_table = sa.Table(
    "function_type",
    meta,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("code", sa.String(128), nullable=False),
    sa.Column("name", sa.String(256), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("created_by", sa.Integer, nullable=True),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    sa.Column("updated_by", sa.Integer, nullable=True),
)


def _load_seed_data() -> dict[str, Any] | None:
    if not _SEED_DATA_DIR.is_dir():
        return None
    result: dict[str, Any] = {}
    try:
        for filename, key in _SEED_FILES:
            path = _SEED_DATA_DIR / filename
            if not path.is_file():
                return None
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            result[key] = data if isinstance(data, list) else data
        return result
    except (json.JSONDecodeError, OSError):
        return None


def ensure_user(
    conn: sa.Connection,
    email: str,
    plain_password: str,
) -> int:
    from app.core.security import get_password_hash

    row = conn.execute(
        sa.select(user_table.c.id).where(user_table.c.email == email)
    ).first()
    if row is not None:
        return row[0]
    hashed = get_password_hash(plain_password)
    conn.execute(
        user_table.insert().values(
            email=email,
            hashed_password=hashed,
        )
    )
    row = conn.execute(
        sa.select(user_table.c.id).where(user_table.c.email == email)
    ).scalar_one()
    return row


def seed_object_types_from_data(
    conn: sa.Connection, data: dict[str, Any], created_by: int | None
) -> dict[str, int]:
    rows = data.get("object_types") or []
    code_to_id: dict[str, int] = {}
    for item in rows:
        code = (item.get("code") or "").strip()
        name = item.get("name")
        if not code:
            continue
        existing = conn.execute(
            sa.select(object_type_table.c.id).where(object_type_table.c.code == code)
        ).first()
        if existing is not None:
            code_to_id[code] = existing[0]
            continue
        conn.execute(
            object_type_table.insert().values(
                code=code, name=name, created_by=created_by, updated_by=created_by
            )
        )
        r = conn.execute(
            sa.select(object_type_table.c.id).where(object_type_table.c.code == code)
        ).scalar_one()
        code_to_id[code] = r
    return code_to_id


def seed_function_types_from_data(
    conn: sa.Connection, data: dict[str, Any], created_by: int | None
) -> dict[str, int]:
    rows = data.get("function_types") or []
    code_to_id: dict[str, int] = {}
    for item in rows:
        code = (item.get("code") or "").strip()
        name = item.get("name")
        if not code:
            continue
        existing = conn.execute(
            sa.select(function_type_table.c.id).where(
                function_type_table.c.code == code
            )
        ).first()
        if existing is not None:
            code_to_id[code] = existing[0]
            continue
        conn.execute(
            function_type_table.insert().values(
                code=code, name=name, created_by=created_by, updated_by=created_by
            )
        )
        r = conn.execute(
            sa.select(function_type_table.c.id).where(
                function_type_table.c.code == code
            )
        ).scalar_one()
        code_to_id[code] = r
    return code_to_id


def _nullable_int(val: Any) -> int | None:
    if val is None:
        return None
    if isinstance(val, int):
        return val
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _nullable_float(val: Any) -> float | None:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _nullable_bool(val: Any) -> bool | None:
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        s = val.strip().lower()
        if s in ("да", "yes", "true", "1"):
            return True
        if s in ("нет", "no", "false", "0"):
            return False
    return None


def seed_objects_from_data(
    conn: sa.Connection,
    data: dict[str, Any],
    type_ids: dict[str, int],
    function_type_ids: dict[str, int],
    created_by: int | None,
) -> None:
    (cnt,) = conn.execute(sa.text('SELECT COUNT(*) FROM "object"')).fetchone()
    if cnt > 0:
        return
    objects_data = data.get("object_geometries") or []
    for obj in objects_data:
        code = obj.get("object_type_code") or "other"
        otid = type_ids.get(code) or type_ids.get("other")
        if not otid:
            continue
        ft_code = (obj.get("function_type_code") or "").strip() or None
        ftid = function_type_ids.get(ft_code) if ft_code else None
        geom = obj.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue
        name = (obj.get("name") or "").strip() or "Object"
        conn.execute(
            sa.text(
                """
                INSERT INTO "object" (
                    object_type_id, function_type_id, geometry,
                    object_id, parcel_id, name, administrative_region, district, mahalla,
                    address_full, capacity_people_max, student_capacity, bed_count, unit_count,
                    distance_public_transport_m, distance_primary_road_m, parking_spaces_total,
                    protected_zone, heritage_zone, flood_zone, environmental_risk_score,
                    power_connected, available_power_capacity_kw, water_connected, sewer_connected,
                    data_source_reference,
                    created_by, updated_by
                )
                VALUES (
                    :otid, :ftid, ST_GeomFromGeoJSON(:geom),
                    :object_id, :parcel_id, :name, :administrative_region, :district, :mahalla,
                    :address_full, :capacity_people_max, :student_capacity, :bed_count, :unit_count,
                    :distance_public_transport_m, :distance_primary_road_m, :parking_spaces_total,
                    :protected_zone, :heritage_zone, :flood_zone, :environmental_risk_score,
                    :power_connected, :available_power_capacity_kw, :water_connected, :sewer_connected,
                    :data_source_reference,
                    :created_by, :updated_by
                )
                """
            ),
            {
                "otid": otid,
                "ftid": ftid,
                "geom": json.dumps(geom),
                "object_id": (obj.get("object_id") or "").strip() or None,
                "parcel_id": (obj.get("parcel_id") or "").strip() or None,
                "name": name,
                "administrative_region": (
                    obj.get("administrative_region") or ""
                ).strip()
                or None,
                "district": (obj.get("district") or "").strip() or None,
                "mahalla": (obj.get("mahalla") or "").strip() or None,
                "address_full": (obj.get("address_full") or "").strip() or None,
                "capacity_people_max": _nullable_int(obj.get("capacity_people_max")),
                "student_capacity": _nullable_int(obj.get("student_capacity")),
                "bed_count": _nullable_int(obj.get("bed_count")),
                "unit_count": _nullable_int(obj.get("unit_count")),
                "distance_public_transport_m": _nullable_int(
                    obj.get("distance_public_transport_m")
                ),
                "distance_primary_road_m": _nullable_int(
                    obj.get("distance_primary_road_m")
                ),
                "parking_spaces_total": _nullable_int(obj.get("parking_spaces_total")),
                "protected_zone": _nullable_bool(obj.get("protected_zone")),
                "heritage_zone": _nullable_bool(obj.get("heritage_zone")),
                "flood_zone": _nullable_bool(obj.get("flood_zone")),
                "environmental_risk_score": _nullable_float(
                    obj.get("environmental_risk_score")
                ),
                "power_connected": _nullable_bool(obj.get("power_connected")),
                "available_power_capacity_kw": _nullable_int(
                    obj.get("available_power_capacity_kw")
                ),
                "water_connected": _nullable_bool(obj.get("water_connected")),
                "sewer_connected": _nullable_bool(obj.get("sewer_connected")),
                "data_source_reference": (
                    obj.get("data_source_reference") or ""
                ).strip()
                or None,
                "created_by": created_by,
                "updated_by": created_by,
            },
        )


def unseed_objects_by_names(conn: sa.Connection, names: Sequence[str]) -> None:
    for name in names:
        conn.execute(
            sa.text('DELETE FROM "object" WHERE name = :name'),
            {"name": name},
        )


def unseed_function_types_by_codes(conn: sa.Connection, codes: Sequence[str]) -> None:
    for code in codes:
        conn.execute(
            sa.delete(function_type_table).where(function_type_table.c.code == code)
        )


def unseed_object_types_by_codes(conn: sa.Connection, codes: Sequence[str]) -> None:
    for code in codes:
        conn.execute(
            sa.delete(object_type_table).where(object_type_table.c.code == code)
        )


def unseed_users(conn: sa.Connection) -> None:
    conn.execute(sa.delete(user_table).where(user_table.c.email.in_(_SEED_USER_EMAILS)))


def upgrade() -> None:
    conn = op.get_bind()
    admin_id = ensure_user(conn, "admin@example.com", "admin123")
    data = _load_seed_data()
    if not data:
        return
    type_ids = seed_object_types_from_data(conn, data, admin_id)
    function_type_ids = seed_function_types_from_data(conn, data, admin_id)
    seed_objects_from_data(conn, data, type_ids, function_type_ids, admin_id)


def downgrade() -> None:
    conn = op.get_bind()
    data = _load_seed_data()
    if data:
        unseed_objects_by_names(
            conn,
            [
                o.get("name")
                for o in (data.get("object_geometries") or [])
                if o.get("name")
            ],
        )
        unseed_function_types_by_codes(
            conn,
            [
                t.get("code")
                for t in (data.get("function_types") or [])
                if t.get("code")
            ],
        )
        unseed_object_types_by_codes(
            conn,
            [t.get("code") for t in (data.get("object_types") or []) if t.get("code")],
        )
    unseed_users(conn)

"""Initial schema with PostGIS

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(op.f("ix_user_created_by"), "user", ["created_by"], unique=False)
    op.create_index(op.f("ix_user_updated_by"), "user", ["updated_by"], unique=False)
    op.execute(
        'ALTER TABLE "user" ADD CONSTRAINT user_created_by_fk '
        'FOREIGN KEY (created_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        'ALTER TABLE "user" ADD CONSTRAINT user_updated_by_fk '
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )

    op.create_table(
        "master_plan",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column(
            "geometry",
            Geometry(geometry_type="GEOMETRY", srid=4326),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_master_plan_created_by"), "master_plan", ["created_by"], unique=False
    )
    op.create_index(
        op.f("ix_master_plan_updated_by"), "master_plan", ["updated_by"], unique=False
    )
    op.execute(
        "ALTER TABLE master_plan ADD CONSTRAINT master_plan_created_by_fk "
        'FOREIGN KEY (created_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        "ALTER TABLE master_plan ADD CONSTRAINT master_plan_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )

    op.create_table(
        "file",
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("filename", sa.String(512), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("file_id"),
    )
    op.create_index(op.f("ix_file_created_by"), "file", ["created_by"], unique=False)
    op.create_index(op.f("ix_file_updated_by"), "file", ["updated_by"], unique=False)
    op.execute(
        "ALTER TABLE file ADD CONSTRAINT file_created_by_fk "
        'FOREIGN KEY (created_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        "ALTER TABLE file ADD CONSTRAINT file_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )

    op.create_table(
        "object_type",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_object_type_code"), "object_type", ["code"], unique=True)
    op.create_index(
        op.f("ix_object_type_created_by"), "object_type", ["created_by"], unique=False
    )
    op.create_index(
        op.f("ix_object_type_updated_by"), "object_type", ["updated_by"], unique=False
    )
    op.execute(
        "ALTER TABLE object_type ADD CONSTRAINT object_type_created_by_fk "
        'FOREIGN KEY (created_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        "ALTER TABLE object_type ADD CONSTRAINT object_type_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )

    op.create_table(
        "function_type",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(128), nullable=False),
        sa.Column("name", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_function_type_code"), "function_type", ["code"], unique=True
    )
    op.create_index(
        op.f("ix_function_type_created_by"),
        "function_type",
        ["created_by"],
        unique=False,
    )
    op.create_index(
        op.f("ix_function_type_updated_by"),
        "function_type",
        ["updated_by"],
        unique=False,
    )
    op.execute(
        "ALTER TABLE function_type ADD CONSTRAINT function_type_created_by_fk "
        'FOREIGN KEY (created_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        "ALTER TABLE function_type ADD CONSTRAINT function_type_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )

    op.create_table(
        "project",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("master_plan_id", sa.Integer(), nullable=True),
        sa.Column(
            "geometry",
            Geometry(geometry_type="GEOMETRY", srid=4326),
            nullable=True,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["master_plan_id"], ["master_plan.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_project_master_plan_id"), "project", ["master_plan_id"], unique=False
    )
    op.create_index(
        op.f("ix_project_created_by"), "project", ["created_by"], unique=False
    )
    op.create_index(
        op.f("ix_project_updated_by"), "project", ["updated_by"], unique=False
    )
    op.execute(
        "ALTER TABLE project ADD CONSTRAINT project_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute("CREATE INDEX ix_project_geometry ON project USING GIST (geometry)")

    op.create_table(
        "object",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("object_type_id", sa.Integer(), nullable=False),
        sa.Column("function_type_id", sa.Integer(), nullable=True),
        sa.Column(
            "geometry", Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True
        ),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("object_id", sa.String(64), nullable=True),
        sa.Column("parcel_id", sa.String(64), nullable=True),
        sa.Column("name", sa.String(512), nullable=True),
        sa.Column("administrative_region", sa.String(256), nullable=True),
        sa.Column("district", sa.String(256), nullable=True),
        sa.Column("mahalla", sa.String(256), nullable=True),
        sa.Column("address_full", sa.Text(), nullable=True),
        sa.Column("capacity_people_max", sa.Integer(), nullable=True),
        sa.Column("student_capacity", sa.Integer(), nullable=True),
        sa.Column("bed_count", sa.Integer(), nullable=True),
        sa.Column("unit_count", sa.Integer(), nullable=True),
        sa.Column("distance_public_transport_m", sa.Integer(), nullable=True),
        sa.Column("distance_primary_road_m", sa.Integer(), nullable=True),
        sa.Column("parking_spaces_total", sa.Integer(), nullable=True),
        sa.Column("protected_zone", sa.Boolean(), nullable=True),
        sa.Column("heritage_zone", sa.Boolean(), nullable=True),
        sa.Column("flood_zone", sa.Boolean(), nullable=True),
        sa.Column("environmental_risk_score", sa.Float(), nullable=True),
        sa.Column("power_connected", sa.Boolean(), nullable=True),
        sa.Column("available_power_capacity_kw", sa.Integer(), nullable=True),
        sa.Column("water_connected", sa.Boolean(), nullable=True),
        sa.Column("sewer_connected", sa.Boolean(), nullable=True),
        sa.Column("data_source_reference", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["object_type_id"], ["object_type.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["function_type_id"], ["function_type.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["parent_id"], ["object.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_object_object_type_id"), "object", ["object_type_id"], unique=False
    )
    op.create_index(
        op.f("ix_object_function_type_id"), "object", ["function_type_id"], unique=False
    )
    op.create_index(
        op.f("ix_object_created_by"), "object", ["created_by"], unique=False
    )
    op.create_index(
        op.f("ix_object_updated_by"), "object", ["updated_by"], unique=False
    )
    op.create_index(op.f("ix_object_parent_id"), "object", ["parent_id"], unique=False)
    op.execute("CREATE INDEX ix_object_geometry ON object USING GIST (geometry)")
    op.execute(
        "ALTER TABLE object ADD CONSTRAINT object_updated_by_fk "
        'FOREIGN KEY (updated_by) REFERENCES "user" (id) ON DELETE SET NULL'
    )
    op.execute(
        "ALTER TABLE object ADD CONSTRAINT chk_object_point "
        "CHECK (geometry IS NULL OR ST_GeometryType(geometry) = 'ST_Point')"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE object DROP CONSTRAINT IF EXISTS chk_object_point")
    op.execute("ALTER TABLE object DROP CONSTRAINT IF EXISTS object_updated_by_fk")
    op.drop_table("object")
    op.execute("DROP INDEX IF EXISTS ix_project_geometry")
    op.execute("ALTER TABLE project DROP CONSTRAINT IF EXISTS project_updated_by_fk")
    op.drop_table("project")
    op.execute(
        "ALTER TABLE object_type DROP CONSTRAINT IF EXISTS object_type_created_by_fk"
    )
    op.execute(
        "ALTER TABLE object_type DROP CONSTRAINT IF EXISTS object_type_updated_by_fk"
    )
    op.drop_table("object_type")
    op.execute(
        "ALTER TABLE function_type DROP CONSTRAINT IF EXISTS function_type_created_by_fk"
    )
    op.execute(
        "ALTER TABLE function_type DROP CONSTRAINT IF EXISTS function_type_updated_by_fk"
    )
    op.drop_table("function_type")
    op.execute("ALTER TABLE file DROP CONSTRAINT IF EXISTS file_created_by_fk")
    op.execute("ALTER TABLE file DROP CONSTRAINT IF EXISTS file_updated_by_fk")
    op.drop_table("file")
    op.execute(
        "ALTER TABLE master_plan DROP CONSTRAINT IF EXISTS master_plan_created_by_fk"
    )
    op.execute(
        "ALTER TABLE master_plan DROP CONSTRAINT IF EXISTS master_plan_updated_by_fk"
    )
    op.drop_table("master_plan")
    op.execute('ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_created_by_fk')
    op.execute('ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_updated_by_fk')
    op.drop_table("user")
    op.execute("DROP EXTENSION IF EXISTS postgis")

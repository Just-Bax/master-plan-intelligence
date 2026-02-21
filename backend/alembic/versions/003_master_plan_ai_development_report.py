"""Add ai_development_report JSONB to master_plan.

Revision ID: 003
Revises: 002
Create Date: 2025-02-21

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "master_plan",
        sa.Column("ai_development_report", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("master_plan", "ai_development_report")

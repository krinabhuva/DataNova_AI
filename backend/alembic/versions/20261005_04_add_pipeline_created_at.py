"""Add an explicit creation timestamp to ETL run metadata."""

from alembic import op
import sqlalchemy as sa

revision = "20261005_04"
down_revision = "20261005_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pipeline_runs",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_column("pipeline_runs", "created_at")

"""Create ETL pipeline run history."""

from alembic import op
import sqlalchemy as sa

revision = "20261005_02"
down_revision = "20261005_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pipeline_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dataset_id", sa.Integer(), nullable=False),
        sa.Column("dataset_filename", sa.String(length=255), nullable=False),
        sa.Column("destination_table", sa.String(length=63), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("total_rows", sa.Integer(), nullable=False),
        sa.Column("valid_rows", sa.Integer(), nullable=False),
        sa.Column("rejected_rows", sa.Integer(), nullable=False),
        sa.Column("duplicates", sa.Integer(), nullable=False),
        sa.Column("missing_values", sa.Integer(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("errors", sa.JSON(), nullable=False),
    )
    op.create_index("ix_pipeline_runs_dataset_id", "pipeline_runs", ["dataset_id"])
    op.create_index("ix_pipeline_runs_status", "pipeline_runs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_pipeline_runs_status", table_name="pipeline_runs")
    op.drop_index("ix_pipeline_runs_dataset_id", table_name="pipeline_runs")
    op.drop_table("pipeline_runs")

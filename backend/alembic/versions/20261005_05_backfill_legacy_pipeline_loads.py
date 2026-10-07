"""Backfill load metrics for pipeline runs created before structured storage."""

from alembic import op
import sqlalchemy as sa

revision = "20261005_05"
down_revision = "20261005_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE pipeline_runs
            SET rows_loaded = CASE WHEN status = 'SUCCESS' THEN valid_rows ELSE 0 END,
                load_status = CASE
                    WHEN status = 'SUCCESS' THEN 'SUCCESS'
                    WHEN status = 'FAILED' THEN 'FAILED'
                    ELSE 'PENDING'
                END
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE pipeline_runs
            SET rows_loaded = 0,
                load_status = 'PENDING'
            """
        )
    )

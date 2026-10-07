"""Add persisted machine learning model metadata."""

from alembic import op
import sqlalchemy as sa

revision = "20261007_01"
down_revision = "20261006_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ml_models",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("model_key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("version", sa.String(length=32), nullable=False),
        sa.Column("algorithm", sa.String(length=160), nullable=False),
        sa.Column("dataset", sa.String(length=160), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("model_key", name="uq_ml_models_model_key"),
    )


def downgrade() -> None:
    op.drop_table("ml_models")
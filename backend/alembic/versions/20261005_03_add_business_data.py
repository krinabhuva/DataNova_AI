"""Add structured business data storage and ETL load metrics."""

from alembic import op
import sqlalchemy as sa

revision = "20261005_03"
down_revision = "20261005_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pipeline_runs",
        sa.Column("rows_loaded", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "pipeline_runs",
        sa.Column("load_status", sa.String(length=16), nullable=False, server_default="PENDING"),
    )
    op.add_column(
        "pipeline_runs",
        sa.Column("load_error", sa.String(length=1000), nullable=True),
    )
    op.create_foreign_key(
        "fk_pipeline_runs_dataset_id_datasets",
        "pipeline_runs",
        "datasets",
        ["dataset_id"],
        ["id"],
        ondelete="RESTRICT",
        postgresql_not_valid=True,
    )

    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("region", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("customer_code", name="uq_customers_customer_code"),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("price", sa.Numeric(14, 2), nullable=False),
        sa.Column("cost", sa.Numeric(14, 2), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("product_code", name="uq_products_product_code"),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_code", sa.String(length=64), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("order_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], name="fk_orders_customer_id_customers", ondelete="RESTRICT"),
        sa.UniqueConstraint("order_code", name="uq_orders_order_code"),
    )
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_table(
        "sales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(14, 2), nullable=False),
        sa.Column("revenue", sa.Numeric(14, 2), nullable=False),
        sa.Column("cost", sa.Numeric(14, 2), nullable=False),
        sa.Column("profit", sa.Numeric(14, 2), nullable=False),
        sa.Column("profit_margin", sa.Numeric(9, 4), nullable=False),
        sa.Column("order_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name="fk_sales_order_id_orders", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], name="fk_sales_customer_id_customers", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_sales_product_id_products", ondelete="RESTRICT"),
        sa.UniqueConstraint("order_id", "product_id", name="uq_sales_order_product"),
    )
    op.create_index("ix_sales_order_id", "sales", ["order_id"])
    op.create_index("ix_sales_customer_id", "sales", ["customer_id"])
    op.create_index("ix_sales_product_id", "sales", ["product_id"])
    op.create_index("ix_sales_order_date", "sales", ["order_date"])
    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reorder_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("inventory_value", sa.Numeric(14, 2), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("quantity >= 0", name="ck_inventory_quantity_nonnegative"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_inventory_product_id_products", ondelete="RESTRICT"),
        sa.UniqueConstraint("product_id", name="uq_inventory_product_id"),
    )


def downgrade() -> None:
    op.drop_table("inventory")
    op.drop_index("ix_sales_order_date", table_name="sales")
    op.drop_index("ix_sales_product_id", table_name="sales")
    op.drop_index("ix_sales_customer_id", table_name="sales")
    op.drop_index("ix_sales_order_id", table_name="sales")
    op.drop_table("sales")
    op.drop_index("ix_orders_customer_id", table_name="orders")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("customers")
    op.drop_constraint("fk_pipeline_runs_dataset_id_datasets", "pipeline_runs", type_="foreignkey")
    op.drop_column("pipeline_runs", "load_error")
    op.drop_column("pipeline_runs", "load_status")
    op.drop_column("pipeline_runs", "rows_loaded")

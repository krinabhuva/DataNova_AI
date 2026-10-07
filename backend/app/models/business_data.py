from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(32))
    region: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120))
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        UniqueConstraint("order_id", "product_id", name="uq_sales_order_product"),
        Index("ix_sales_order_date", "order_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    revenue: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    profit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    profit_margin: Mapped[Decimal] = mapped_column(Numeric(9, 4), nullable=False)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    region: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (CheckConstraint("quantity >= 0", name="ck_inventory_quantity_nonnegative"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    quantity: Mapped[int] = mapped_column(nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(nullable=False, default=0)
    inventory_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC), onupdate=func.now()
    )


__all__ = ["Customer", "Inventory", "Order", "Product", "Sale"]

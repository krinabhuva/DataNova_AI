from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BusinessRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int


class CustomerResponse(BusinessRecord):
    customer_code: str
    name: str
    email: str | None
    phone: str | None
    region: str | None
    city: str | None
    created_at: datetime


class ProductResponse(BusinessRecord):
    product_code: str
    name: str
    category: str | None
    price: Decimal
    cost: Decimal
    stock_quantity: int
    created_at: datetime


class OrderResponse(BusinessRecord):
    order_code: str
    customer_id: int
    order_date: datetime
    status: str
    total_amount: Decimal
    created_at: datetime


class SaleResponse(BusinessRecord):
    order_id: int
    customer_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    revenue: Decimal
    cost: Decimal
    profit: Decimal
    profit_margin: Decimal
    order_date: datetime
    region: str | None
    created_at: datetime


class InventoryResponse(BusinessRecord):
    product_id: int
    quantity: int
    reorder_level: int
    inventory_value: Decimal
    updated_at: datetime

from pydantic import BaseModel, EmailStr
from typing import Optional


# ---------- Auth ----------
class SignupIn(BaseModel):
    name: str
    login_id: Optional[str] = None   # auto-generated from name if omitted
    email: EmailStr
    password: str
    role: str = "Normal User"
    position: str = ""
    department: str = ""


class UserCreate(BaseModel):
    name: str
    login_id: str
    email: EmailStr
    password: str
    role: str = "Normal User"
    position: str = ""
    department: str = ""
    mobile: str = ""
    address: str = ""


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    photo: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    mobile: Optional[str] = None
    photo: Optional[str] = None
    position: Optional[str] = None  # admin-only enforced in router


# ---------- Partners ----------
class CustomerIn(BaseModel):
    name: str
    address: str = ""


class VendorIn(BaseModel):
    name: str
    address: str = ""
    lead_time_days: int = 7


# ---------- Product ----------
class ProductIn(BaseModel):
    name: str
    sales_price: float = 0
    cost_price: float = 0
    on_hand_qty: float = 0
    unit: str = "Units"
    procure_on_demand: bool = False
    procurement_type: str = ""
    vendor_id: Optional[int] = None
    bom_id: Optional[int] = None


# ---------- BoM ----------
class BomComponentIn(BaseModel):
    component_id: int
    quantity: float = 1


class BomOperationIn(BaseModel):
    name: str
    work_center_id: Optional[int] = None
    duration_minutes: int = 0


class BomIn(BaseModel):
    finished_product_id: int
    quantity: float = 1
    components: list[BomComponentIn] = []
    operations: list[BomOperationIn] = []


# ---------- Sales ----------
class SOLineIn(BaseModel):
    product_id: int
    ordered_qty: float = 1
    sales_price: Optional[float] = None


class SalesOrderIn(BaseModel):
    customer_id: int
    customer_address: str = ""
    salesperson_id: Optional[int] = None
    lines: list[SOLineIn] = []


class DeliverIn(BaseModel):
    deliveries: dict[int, float] = {}


# ---------- Purchase ----------
class POLineIn(BaseModel):
    product_id: int
    ordered_qty: float = 1
    cost_price: Optional[float] = None


class PurchaseOrderIn(BaseModel):
    vendor_id: int
    vendor_address: str = ""
    responsible_id: Optional[int] = None
    lines: list[POLineIn] = []


class ReceiveIn(BaseModel):
    receipts: dict[int, float] = {}


# ---------- Manufacturing ----------
class MOComponentIn(BaseModel):
    component_id: int
    to_consume_qty: float = 0
    consumed_qty: float = 0


class MOWorkOrderIn(BaseModel):
    operation: str
    work_center_id: Optional[int] = None
    expected_duration: int = 0
    real_duration: int = 0


class ManufacturingOrderIn(BaseModel):
    finished_product_id: int
    bom_id: Optional[int] = None
    quantity: float = 1
    assignee_id: Optional[int] = None
    components: Optional[list[MOComponentIn]] = None
    work_orders: Optional[list[MOWorkOrderIn]] = None


class WorkCenterIn(BaseModel):
    name: str
    capacity_per_hour: float = 1

import enum


class SOStatus(str, enum.Enum):
    pending = "PENDING"
    confirmed = "CONFIRMED"
    pending_procurement = "PENDING_PROCUREMENT"
    backorder = "BACKORDER"
    out_of_stock = "OUT_OF_STOCK"
    dispatched = "DISPATCHED"
    delivered = "DELIVERED"
    cancelled = "CANCELLED"


class POStatus(str, enum.Enum):
    draft = "Draft"
    confirmed = "Confirmed"
    partially_received = "Partially Received"
    fully_received = "Fully Received"
    cancelled = "Cancelled"


class MOStatus(str, enum.Enum):
    draft = "Draft"
    confirmed = "Confirmed"
    in_progress = "In-Progress"
    done = "Done"
    cancelled = "Cancelled"


class ProcurementType(str, enum.Enum):
    purchase = "Purchase"
    manufacturing = "Manufacturing"


class Role(str, enum.Enum):
    admin = "Admin"
    sales = "Sales"
    purchase = "Purchase"
    manufacturing = "Manufacturing"
    inventory = "Inventory"
    owner = "Owner"

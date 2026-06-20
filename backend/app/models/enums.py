import enum


class SOStatus(str, enum.Enum):
    draft = "Draft"
    confirmed = "Confirmed"
    partially_delivered = "Partially Delivered"
    fully_delivered = "Fully Delivered"
    cancelled = "Cancelled"


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

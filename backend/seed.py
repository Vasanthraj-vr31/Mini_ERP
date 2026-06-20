"""Seed a rich, demo-ready dataset for Shiv Furniture Works.

Run:  python seed.py
Creates users, products, BoMs, vendors, customers, work centers, and a few
historical orders so the AI/forecasting/vendor-scoring has real data to chew on.
"""
from datetime import datetime, timezone, timedelta
from app.core.database import Base, engine, SessionLocal
import app.models  # noqa
from app.models.user import User
from app.models.partners import Customer, Vendor
from app.models.product import Product
from app.models.bom import WorkCenter, BillOfMaterial, BomComponent, BomOperation
from app.models.enums import ProcurementType
from app.models.rbac import Role, Permission, RolePermission
from app.core.security import hash_password
from app.services import sequence, inventory
from app.services import sales as sales_svc, purchase as po_svc, manufacturing as mo_svc
from app.models.sales import SalesOrder, SaleOrderLine
from app.models.purchase import PurchaseOrder, PurchaseOrderLine
from app.models.stock import StockLedger


def reset():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def run():
    reset()
    db = SessionLocal()

    # ---- RBAC foundation -------------------------------------------------
    MODULES = ["Sales", "Purchase", "Manufacturing", "Product", "Inventory", "Reports", "Analytics", "AuditLogs"]
    ACTIONS = ["view", "create", "edit", "delete", "approve"]

    role_sysadmin   = Role(name="System Administrator",           description="Full system access")
    role_sales_adm  = Role(name="Sales Administrator",            description="Sales operations — full")
    role_purch_adm  = Role(name="Purchase Administrator",         description="Purchase operations — full")
    role_mfg_adm    = Role(name="Manufacturing Administrator",    description="Manufacturing operations — full")
    role_inv_mgr    = Role(name="Inventory Manager",              description="Inventory & stock management")
    role_owner      = Role(name="Business Owner",                 description="Read-only view across all modules + analytics")
    role_normal     = Role(name="Normal User",                    description="Basic access — sales & purchase view only")
    db.add_all([role_sysadmin, role_sales_adm, role_purch_adm, role_mfg_adm,
                role_inv_mgr, role_owner, role_normal])
    db.flush()

    all_perms = []
    for mod in MODULES:
        for act in ACTIONS:
            p = Permission(module=mod, action=act)
            db.add(p)
            all_perms.append(p)
    db.flush()

    perm_map = {f"{p.module}:{p.action}": p for p in all_perms}

    def grant(role, *keys):
        for key in keys:
            if key in perm_map:
                db.add(RolePermission(role_id=role.id, permission_id=perm_map[key].id))

    # System Administrator — everything
    for p in all_perms:
        db.add(RolePermission(role_id=role_sysadmin.id, permission_id=p.id))

    # Sales Administrator — full Sales + view others
    grant(role_sales_adm,
          "Sales:view","Sales:create","Sales:edit","Sales:delete","Sales:approve",
          "Product:view","Purchase:view","Manufacturing:view","Inventory:view",
          "Reports:view","Analytics:view","AuditLogs:view")

    # Purchase Administrator — full Purchase + view others
    grant(role_purch_adm,
          "Purchase:view","Purchase:create","Purchase:edit","Purchase:delete","Purchase:approve",
          "Product:view","Sales:view","Manufacturing:view","Inventory:view",
          "Reports:view","Analytics:view")

    # Manufacturing Administrator — full Manufacturing + view others
    grant(role_mfg_adm,
          "Manufacturing:view","Manufacturing:create","Manufacturing:edit","Manufacturing:delete","Manufacturing:approve",
          "Product:view","Product:create","Product:edit",
          "Inventory:view","Inventory:create","Inventory:edit",
          "Sales:view","Purchase:view","Reports:view","Analytics:view")

    # Inventory Manager — inventory full + view/create on purchase/manufacturing
    grant(role_inv_mgr,
          "Inventory:view","Inventory:create","Inventory:edit","Inventory:delete","Inventory:approve",
          "Product:view","Product:create","Product:edit",
          "Purchase:view","Purchase:create","Manufacturing:view","Reports:view","Analytics:view")

    # Business Owner — view-only across all modules + analytics
    grant(role_owner,
          "Sales:view","Purchase:view","Manufacturing:view","Product:view",
          "Inventory:view","Reports:view","Analytics:view","AuditLogs:view")

    # Normal User — limited view
    grant(role_normal,
          "Sales:view","Purchase:view","Manufacturing:view","Product:view","Inventory:view")

    db.flush()
    # -----------------------------------------------------------------------

    # Users (roles per spec)
    users = [
        User(name="Mahesh Gupta", login_id="adminuser", email="admin@shiv.com",
             password_hash=hash_password("Admin@123"), role="System Administrator",
             position="System Administrator", department="IT",
             address="Colaba, Mumbai, 400001", mobile="+91 9800000000", status="Active"),
        User(name="Ravi Jadeja", login_id="salesuser", email="sales@shiv.com",
             password_hash=hash_password("Sales@123"), role="Sales Administrator",
             position="Sales Manager", department="Sales", status="Active"),
        User(name="Vijay Sharma", login_id="purchaseuser", email="purchase@shiv.com",
             password_hash=hash_password("Buyer@123"), role="Purchase Administrator",
             position="Purchase Manager", department="Procurement", status="Active"),
        User(name="Nisarg Verma", login_id="mfguser01", email="mfg@shiv.com",
             password_hash=hash_password("Mfg@1234"), role="Manufacturing Administrator",
             position="Production Lead", department="Manufacturing", status="Active"),
        User(name="Priya Sinha", login_id="invmgr01", email="inventory@shiv.com",
             password_hash=hash_password("Inv@12345"), role="Inventory Manager",
             position="Inventory Manager", department="Warehouse", status="Active"),
        User(name="Shiv Kumar", login_id="owner01", email="owner@shiv.com",
             password_hash=hash_password("Owner@123"), role="Business Owner",
             position="Managing Director", department="Executive", status="Active"),
        User(name="Aryan Kapoor", login_id="normaluser", email="user@shiv.com",
             password_hash=hash_password("User@1234"), role="Normal User",
             position="Staff", department="Operations", status="Active"),
    ]
    db.add_all(users); db.flush()
    admin = users[0]

    # Work centers
    wc_assembly = WorkCenter(name="Assembly Line", capacity_per_hour=2)
    wc_paint = WorkCenter(name="Paint Floor", capacity_per_hour=3)
    wc_pack = WorkCenter(name="Packaging Unit", capacity_per_hour=5)
    db.add_all([wc_assembly, wc_paint, wc_pack]); db.flush()

    # Vendors
    v_timber = Vendor(name="Timber Traders", address="Andheri, Mumbai", lead_time_days=5)
    v_hardware = Vendor(name="ORR Metals", address="Pune", lead_time_days=10)
    v_premium = Vendor(name="Plastofact IN", address="Surat", lead_time_days=3)
    db.add_all([v_timber, v_hardware, v_premium]); db.flush()

    # Customers
    c1 = Customer(name="Suzuki India", address="Gurugram, Haryana")
    c2 = Customer(name="MRF Ltd.", address="Chennai, Tamil Nadu")
    db.add_all([c1, c2]); db.flush()

    def product(name, sp, cp, qty, **kw):
        p = Product(reference=sequence.next_ref(db, Product, "PROD"), name=name,
                    sales_price=sp, cost_price=cp, on_hand_qty=qty, **kw)
        db.add(p); db.flush()
        if qty:
            db.add(StockLedger(product_id=p.id, qty_delta=qty, balance_after=qty,
                               source_type="opening", note="Opening stock"))
        return p

    # Components (raw)
    legs = product("Wooden Legs", 120, 80, 200)
    top = product("Wooden Top", 600, 420, 40)
    screws = product("Screws (pack)", 30, 18, 60)
    frame = product("Lighting Frame", 0, 0, 12)

    # Finished goods
    table = product("Dining Table", 8500, 5200, 5,
                    procure_on_demand=True, procurement_type=ProcurementType.manufacturing.value)
    chair = product("Office Chair", 4200, 2600, 100,
                    procure_on_demand=True, procurement_type=ProcurementType.purchase.value,
                    vendor_id=v_premium.id)
    door = product("Door Frames", 3000, 1900, 8)

    # BoM for Dining Table (qty=1 yields 1 table)
    bom = BillOfMaterial(reference=sequence.next_ref(db, BillOfMaterial, "BOM"),
                         finished_product_id=table.id, quantity=1)
    bom.components += [
        BomComponent(component_id=legs.id, quantity=4),
        BomComponent(component_id=top.id, quantity=1),
        BomComponent(component_id=screws.id, quantity=1),
    ]
    bom.operations += [
        BomOperation(name="Assembly", work_center_id=wc_assembly.id, duration_minutes=60),
        BomOperation(name="Painting", work_center_id=wc_paint.id, duration_minutes=30),
        BomOperation(name="Packing", work_center_id=wc_pack.id, duration_minutes=20),
    ]
    db.add(bom); db.flush()
    table.bom_id = bom.id  # finished good points at its BoM for MTO manufacturing

    # Door BoM too
    dbom = BillOfMaterial(reference=sequence.next_ref(db, BillOfMaterial, "BOM"),
                          finished_product_id=door.id, quantity=1)
    dbom.components += [BomComponent(component_id=legs.id, quantity=2),
                        BomComponent(component_id=screws.id, quantity=1)]
    dbom.operations += [BomOperation(name="Assembly", work_center_id=wc_assembly.id, duration_minutes=40)]
    db.add(dbom); db.flush()

    db.commit()

    # ---- Historical activity so AI has signal ----
    # A received PO (builds vendor history + stock inflow)
    po = PurchaseOrder(reference=sequence.next_ref(db, PurchaseOrder, "PO"),
                       vendor_id=v_timber.id, vendor_address=v_timber.address,
                       responsible_id=users[2].id, status="Draft")
    po.lines.append(PurchaseOrderLine(product_id=legs.id, ordered_qty=100, cost_price=78))
    db.add(po); db.flush()
    po_svc.confirm(db, po, user=admin); db.commit()
    po_svc.receive(db, po, user=admin); db.commit()

    # A delivered SO for chairs (sales history + outflow velocity)
    so = SalesOrder(reference=sequence.next_ref(db, SalesOrder, "SO"),
                    customer_id=c1.id, customer_address=c1.address,
                    salesperson_id=users[1].id, status="Draft")
    so.lines.append(SaleOrderLine(product_id=chair.id, ordered_qty=30, sales_price=4200))
    db.add(so); db.flush()
    sales_svc.confirm(db, so, user=admin); db.commit()
    sales_svc.deliver(db, so, user=admin); db.commit()

    # backdate some chair outflow ledger rows to fuel runout forecasting
    rows = db.query(StockLedger).filter(StockLedger.product_id == chair.id,
                                        StockLedger.qty_delta < 0).all()
    for i, r in enumerate(rows):
        r.created_at = datetime.now(timezone.utc) - timedelta(days=3 + i)
    # add a few synthetic past deliveries
    bal = chair.on_hand_qty
    for d in range(5, 20, 3):
        bal -= 6
        db.add(StockLedger(product_id=chair.id, qty_delta=-6, balance_after=bal,
                           source_type="SO", note="historical demand",
                           created_at=datetime.now(timezone.utc) - timedelta(days=d)))
    db.commit()

    # Build initial AI insights
    from app.ai import engine as ai_engine
    ai_engine.regenerate(db)

    # Refresh in-memory permission cache so the running app (if hot-reloaded) sees new roles
    from app.core.permissions import build_permission_cache
    build_permission_cache(db)

    print("Seed complete.")
    print("Login:  adminuser   / Admin@123  (System Administrator)")
    print("        salesuser   / Sales@123  (Sales Administrator)")
    print("        purchaseuser/ Buyer@123  (Purchase Administrator)")
    print("        mfguser01   / Mfg@1234  (Manufacturing Administrator)")
    print("        invmgr01    / Inv@12345 (Inventory Manager)")
    print("        owner01     / Owner@123 (Business Owner)")
    print("        normaluser  / User@1234 (Normal User)")
    print()
    print("RBAC:   System Administrator -> all 40 permissions")
    db.close()


if __name__ == "__main__":
    run()

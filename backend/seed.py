"""Seed a rich, demo-ready dataset for Shiv Furniture Works ERP.

Run:  python seed.py   (or  .\.venv\Scripts\python.exe seed.py  on Windows)
Creates users, products with images, BoMs, vendors, customers, work centers,
and a rich history of orders so every dashboard metric is non-zero.
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

# ── Unsplash image URLs (reliable CDN, specific photo IDs) ──────────────────
IMG = {
    # Finished furniture
    "dining_table":  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=480&auto=format&fit=crop&q=80",
    "office_chair":  "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=480&auto=format&fit=crop&q=80",
    "wardrobe":      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=480&auto=format&fit=crop&q=80",
    "bed":           "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=480&auto=format&fit=crop&q=80",
    "sofa":          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=480&auto=format&fit=crop&q=80",
    "coffee_table":  "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=480&auto=format&fit=crop&q=80",
    "bookshelf":     "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=480&auto=format&fit=crop&q=80",
    "tv_unit":       "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=480&auto=format&fit=crop&q=80",
    "study_desk":    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=480&auto=format&fit=crop&q=80",
    "cabinet":       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&auto=format&fit=crop&q=80",
    # Raw materials
    "wood_plank":    "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=480&auto=format&fit=crop&q=80",
    "sheesham":      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=480&auto=format&fit=crop&q=80",
    "steel_frame":   "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=480&auto=format&fit=crop&q=80",
    "screws":        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=480&auto=format&fit=crop&q=80",
    "lacquer":       "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=480&auto=format&fit=crop&q=80",
    "foam":          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=480&auto=format&fit=crop&q=80",
}


def reset():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def run():
    reset()
    db = SessionLocal()

    # ── RBAC ────────────────────────────────────────────────────────────────
    MODULES = ["Sales", "Purchase", "Manufacturing", "Product", "Inventory", "Reports", "Analytics", "AuditLogs"]
    ACTIONS = ["view", "create", "edit", "delete", "approve"]

    role_sysadmin  = Role(name="System Administrator",        description="Full system access")
    role_sales_adm = Role(name="Sales Administrator",         description="Sales operations")
    role_purch_adm = Role(name="Purchase Administrator",      description="Purchase operations")
    role_mfg_adm   = Role(name="Manufacturing Administrator", description="Manufacturing operations")
    role_inv_mgr   = Role(name="Inventory Manager",           description="Inventory & stock management")
    role_owner     = Role(name="Business Owner",              description="Read-only + analytics")
    role_normal    = Role(name="Normal User",                 description="Basic view access")
    db.add_all([role_sysadmin, role_sales_adm, role_purch_adm, role_mfg_adm,
                role_inv_mgr, role_owner, role_normal])
    db.flush()

    all_perms = []
    for mod in MODULES:
        for act in ACTIONS:
            p = Permission(module=mod, action=act)
            db.add(p); all_perms.append(p)
    db.flush()
    perm_map = {f"{p.module}:{p.action}": p for p in all_perms}

    def grant(role, *keys):
        for key in keys:
            if key in perm_map:
                db.add(RolePermission(role_id=role.id, permission_id=perm_map[key].id))

    for p in all_perms:
        db.add(RolePermission(role_id=role_sysadmin.id, permission_id=p.id))
    grant(role_sales_adm, "Sales:view","Sales:create","Sales:edit","Sales:delete","Sales:approve",
          "Product:view","Purchase:view","Manufacturing:view","Inventory:view",
          "Reports:view","Analytics:view","AuditLogs:view")
    grant(role_purch_adm, "Purchase:view","Purchase:create","Purchase:edit","Purchase:delete","Purchase:approve",
          "Product:view","Sales:view","Manufacturing:view","Inventory:view","Reports:view","Analytics:view")
    grant(role_mfg_adm, "Manufacturing:view","Manufacturing:create","Manufacturing:edit","Manufacturing:delete","Manufacturing:approve",
          "Product:view","Product:create","Product:edit","Inventory:view","Inventory:create","Inventory:edit",
          "Sales:view","Purchase:view","Reports:view","Analytics:view")
    grant(role_inv_mgr, "Inventory:view","Inventory:create","Inventory:edit","Inventory:delete","Inventory:approve",
          "Product:view","Product:create","Product:edit","Purchase:view","Purchase:create","Manufacturing:view",
          "Reports:view","Analytics:view")
    grant(role_owner, "Sales:view","Purchase:view","Manufacturing:view","Product:view",
          "Inventory:view","Reports:view","Analytics:view","AuditLogs:view")
    grant(role_normal, "Sales:view","Purchase:view","Manufacturing:view","Product:view","Inventory:view")
    db.flush()

    # ── Users ────────────────────────────────────────────────────────────────
    users = [
        User(name="Mahesh Gupta",   login_id="adminuser",    email="admin@shiv.com",
             password_hash=hash_password("Admin@123"),    role="System Administrator",
             position="System Administrator", department="IT",
             address="Colaba, Mumbai, 400001",  mobile="+91 9800000000", status="Active"),
        User(name="Ravi Jadeja",    login_id="salesuser",    email="sales@shiv.com",
             password_hash=hash_password("Sales@123"),    role="Sales Administrator",
             position="Sales Manager",         department="Sales",         status="Active"),
        User(name="Vijay Sharma",   login_id="purchaseuser", email="purchase@shiv.com",
             password_hash=hash_password("Buyer@123"),    role="Purchase Administrator",
             position="Purchase Manager",      department="Procurement",    status="Active"),
        User(name="Nisarg Verma",   login_id="mfguser01",   email="mfg@shiv.com",
             password_hash=hash_password("Mfg@1234"),     role="Manufacturing Administrator",
             position="Production Lead",       department="Manufacturing",  status="Active"),
        User(name="Priya Sinha",    login_id="invmgr01",    email="inventory@shiv.com",
             password_hash=hash_password("Inv@12345"),    role="Inventory Manager",
             position="Inventory Manager",     department="Warehouse",      status="Active"),
        User(name="Shiv Kumar",     login_id="owner01",     email="owner@shiv.com",
             password_hash=hash_password("Owner@123"),    role="Business Owner",
             position="Managing Director",     department="Executive",      status="Active"),
        User(name="Aryan Kapoor",   login_id="normaluser",  email="user@shiv.com",
             password_hash=hash_password("User@1234"),    role="Normal User",
             position="Staff",                department="Operations",     status="Active"),
    ]
    db.add_all(users); db.flush()
    admin = users[0]

    # ── Work Centers ────────────────────────────────────────────────────────
    wc_assembly = WorkCenter(name="Assembly Line",    capacity_per_hour=2)
    wc_carving  = WorkCenter(name="Carving Station", capacity_per_hour=1)
    wc_paint    = WorkCenter(name="Paint Floor",     capacity_per_hour=3)
    wc_upholst  = WorkCenter(name="Upholstery Bay",  capacity_per_hour=2)
    wc_pack     = WorkCenter(name="Packaging Unit",  capacity_per_hour=5)
    db.add_all([wc_assembly, wc_carving, wc_paint, wc_upholst, wc_pack]); db.flush()

    # ── Vendors ────────────────────────────────────────────────────────────
    v_timber   = Vendor(name="Timber Traders Pvt Ltd",  address="Andheri East, Mumbai",     lead_time_days=5)
    v_sheesham = Vendor(name="Sheesham Wood Co.",        address="Jodhpur, Rajasthan",        lead_time_days=7)
    v_hardware = Vendor(name="ORR Metals & Hardware",    address="Pune, Maharashtra",         lead_time_days=10)
    v_premium  = Vendor(name="Plastofact Industries IN", address="Surat, Gujarat",            lead_time_days=3)
    v_foam     = Vendor(name="ComfortFoam Supplies",     address="Bhiwandi, Maharashtra",     lead_time_days=4)
    db.add_all([v_timber, v_sheesham, v_hardware, v_premium, v_foam]); db.flush()

    # ── Customers ──────────────────────────────────────────────────────────
    c1 = Customer(name="Suzuki India Ltd.",       address="Gurugram, Haryana 122001")
    c2 = Customer(name="MRF Ltd.",                address="Anna Salai, Chennai 600002")
    c3 = Customer(name="Taj Hotels & Resorts",    address="Apollo Bunder, Mumbai 400001")
    c4 = Customer(name="WeWork India",            address="BKC, Mumbai 400051")
    c5 = Customer(name="Godrej Properties",       address="Vikhroli, Mumbai 400079")
    c6 = Customer(name="IndiaMart Intermesh",     address="Noida, UP 201301")
    db.add_all([c1, c2, c3, c4, c5, c6]); db.flush()

    def product(name, sp, cp, qty, photo=None, **kw):
        p = Product(reference=sequence.next_ref(db, Product, "PROD"),
                    name=name, sales_price=sp, cost_price=cp, on_hand_qty=qty,
                    photo=photo, **kw)
        db.add(p); db.flush()
        if qty:
            db.add(StockLedger(product_id=p.id, qty_delta=qty, balance_after=qty,
                               source_type="opening", note="Opening stock"))
        return p

    # ── Raw Materials ──────────────────────────────────────────────────────
    teak_plank   = product("Teakwood Plank (6ft)",     120,  80,  200, photo=IMG["wood_plank"])
    sheesham_plk = product("Sheesham Wood Plank",      150,  95,  180, photo=IMG["sheesham"])
    steel_frame  = product("Steel Frame Components",    85,  52,   60, photo=IMG["steel_frame"])
    screws       = product("Wood Screws (100pc pack)",  30,  18,  400, photo=IMG["screws"])
    lacquer      = product("Lacquer Paint (1L)",        220, 140,   80, photo=IMG["lacquer"])
    foam_pad     = product("Foam Padding (per sqft)",   180, 110,  120, photo=IMG["foam"])

    # ── Finished Goods ─────────────────────────────────────────────────────
    dining_table = product("Royal Teak Dining Table (6-Seater)", 18500, 11200, 8,
                           photo=IMG["dining_table"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    office_chair = product("Ergonomic Executive Chair",           7200,  4400, 45,
                           photo=IMG["office_chair"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.purchase.value,
                           vendor_id=v_premium.id)

    wardrobe     = product("Sheesham 3-Door Wardrobe",           24000, 14800,  6,
                           photo=IMG["wardrobe"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    king_bed     = product("King Size Platform Bed",             32000, 19500,  4,
                           photo=IMG["bed"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    sofa_set     = product("Luxury Sofa Set (3+1+1)",            55000, 33000,  3,
                           photo=IMG["sofa"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    coffee_table = product("Teak Coffee Table (Oval)",            8800,  5300, 12,
                           photo=IMG["coffee_table"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    bookshelf    = product("Sheesham Solid Wood Bookshelf",       9500,  5800, 10,
                           photo=IMG["bookshelf"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    tv_unit      = product("Engineered Wood TV Unit (60-inch)",   12000,  7200,  7,
                           photo=IMG["tv_unit"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    study_desk   = product("Study Desk with Drawer & Shelf",       6500,  3900, 15,
                           photo=IMG["study_desk"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    cabinet      = product("Solid Wood Storage Cabinet",          14500,  8800,  5,
                           photo=IMG["cabinet"],
                           procure_on_demand=True,
                           procurement_type=ProcurementType.manufacturing.value)

    db.commit()

    # ── Bills of Materials ─────────────────────────────────────────────────
    def make_bom(product_obj, qty, components, operations):
        b = BillOfMaterial(reference=sequence.next_ref(db, BillOfMaterial, "BOM"),
                           finished_product_id=product_obj.id, quantity=qty)
        b.components = [BomComponent(component_id=c, quantity=q) for c, q in components]
        b.operations = [BomOperation(name=n, work_center_id=w, duration_minutes=d)
                        for n, w, d in operations]
        db.add(b); db.flush()
        product_obj.bom_id = b.id
        return b

    make_bom(dining_table, 1,
             [(teak_plank.id, 8), (screws.id, 2), (lacquer.id, 1)],
             [("Wood Cutting", wc_carving.id, 90), ("Assembly", wc_assembly.id, 120),
              ("Polishing & Lacquer", wc_paint.id, 60), ("Quality Check & Pack", wc_pack.id, 30)])

    make_bom(wardrobe, 1,
             [(sheesham_plk.id, 12), (steel_frame.id, 3), (screws.id, 3), (lacquer.id, 2)],
             [("Cutting & Sizing", wc_carving.id, 120), ("Frame Assembly", wc_assembly.id, 180),
              ("Door Fitting", wc_assembly.id, 60), ("Finish & Polish", wc_paint.id, 90),
              ("Packing", wc_pack.id, 30)])

    make_bom(king_bed, 1,
             [(teak_plank.id, 10), (sheesham_plk.id, 4), (screws.id, 4), (lacquer.id, 2)],
             [("Headboard Carving", wc_carving.id, 180), ("Frame Build", wc_assembly.id, 150),
              ("Sanding & Polish", wc_paint.id, 90), ("Packing", wc_pack.id, 45)])

    make_bom(sofa_set, 1,
             [(teak_plank.id, 6), (foam_pad.id, 20), (steel_frame.id, 4), (screws.id, 2)],
             [("Frame Construction", wc_assembly.id, 120), ("Upholstery", wc_upholst.id, 240),
              ("Quality Check", wc_pack.id, 30)])

    make_bom(coffee_table, 1,
             [(teak_plank.id, 3), (screws.id, 1), (lacquer.id, 1)],
             [("Shaping", wc_carving.id, 60), ("Assembly", wc_assembly.id, 45),
              ("Finish", wc_paint.id, 30), ("Pack", wc_pack.id, 15)])

    make_bom(bookshelf, 1,
             [(sheesham_plk.id, 6), (screws.id, 2), (lacquer.id, 1)],
             [("Panel Cutting", wc_carving.id, 60), ("Assembly", wc_assembly.id, 90),
              ("Polish", wc_paint.id, 45), ("Pack", wc_pack.id, 20)])

    make_bom(tv_unit, 1,
             [(sheesham_plk.id, 5), (steel_frame.id, 2), (screws.id, 2), (lacquer.id, 1)],
             [("Panel Work", wc_carving.id, 75), ("Assembly", wc_assembly.id, 90),
              ("Finish", wc_paint.id, 30), ("Pack", wc_pack.id, 20)])

    make_bom(study_desk, 1,
             [(teak_plank.id, 3), (steel_frame.id, 1), (screws.id, 1), (lacquer.id, 1)],
             [("Cutting", wc_carving.id, 45), ("Assembly", wc_assembly.id, 75),
              ("Finish", wc_paint.id, 30), ("Pack", wc_pack.id, 15)])

    make_bom(cabinet, 1,
             [(sheesham_plk.id, 8), (steel_frame.id, 2), (screws.id, 3), (lacquer.id, 2)],
             [("Panel Cut", wc_carving.id, 90), ("Assembly", wc_assembly.id, 120),
              ("Polish", wc_paint.id, 60), ("Pack", wc_pack.id, 25)])

    db.commit()

    # ── Historical Purchase Orders ────────────────────────────────────────
    def make_po(vendor, addr, lines, receive=True, responsible=None):
        po = PurchaseOrder(reference=sequence.next_ref(db, PurchaseOrder, "PO"),
                           vendor_id=vendor.id, vendor_address=addr or vendor.address,
                           responsible_id=(responsible or users[2]).id, status="Draft")
        for prod, qty, cost in lines:
            po.lines.append(PurchaseOrderLine(product_id=prod.id, ordered_qty=qty, cost_price=cost))
        db.add(po); db.flush()
        po_svc.confirm(db, po, user=admin); db.commit()
        if receive:
            po_svc.receive(db, po, user=admin); db.commit()
        return po

    make_po(v_timber,   None, [(teak_plank, 150, 78), (screws, 200, 17)])
    make_po(v_sheesham, None, [(sheesham_plk, 120, 92), (lacquer, 40, 135)])
    make_po(v_hardware, None, [(steel_frame, 50, 50)])
    make_po(v_foam,     None, [(foam_pad, 80, 108)])
    make_po(v_premium,  None, [(office_chair, 20, 4200)])
    # Pending PO
    make_po(v_timber, None, [(teak_plank, 80, 78)], receive=False)
    make_po(v_sheesham, None, [(sheesham_plk, 60, 93)], receive=False)

    # ── Historical Sales Orders ───────────────────────────────────────────
    def make_so(customer, lines, deliver=True, salesperson=None):
        so = SalesOrder(reference=sequence.next_ref(db, SalesOrder, "SO"),
                        customer_id=customer.id, customer_address=customer.address,
                        salesperson_id=(salesperson or users[1]).id, status="Draft")
        for prod, qty, price in lines:
            so.lines.append(SaleOrderLine(product_id=prod.id, ordered_qty=qty, sales_price=price))
        db.add(so); db.flush()
        sales_svc.confirm(db, so, user=admin); db.commit()
        if deliver:
            sales_svc.deliver(db, so, user=admin); db.commit()
        return so

    make_so(c1, [(office_chair, 10, 7200), (dining_table, 2, 18500)])
    make_so(c2, [(bookshelf, 4, 9500), (coffee_table, 3, 8800)])
    make_so(c3, [(sofa_set, 2, 55000), (tv_unit, 2, 12000), (coffee_table, 4, 8800)])
    make_so(c4, [(office_chair, 15, 7200), (study_desk, 8, 6500)])
    make_so(c5, [(wardrobe, 2, 24000), (king_bed, 2, 32000)])
    make_so(c6, [(dining_table, 3, 18500), (cabinet, 2, 14500)])
    # Pending SOs
    make_so(c1, [(sofa_set, 1, 55000), (coffee_table, 2, 8800)], deliver=False)
    make_so(c3, [(king_bed, 3, 32000), (wardrobe, 3, 24000)],    deliver=False)
    make_so(c4, [(study_desk, 5, 6500), (bookshelf, 3, 9500)],   deliver=False)

    # ── Historical Manufacturing Orders ───────────────────────────────────
    def make_mo(prod, qty, done=True, assignee=None):
        mo = mo_svc.build_mo_from_bom(db, finished_product=prod,
                                      bom_id=prod.bom_id, quantity=qty,
                                      assignee_id=(assignee or users[3]).id)
        db.add(mo); db.flush()
        from app.services import audit as audit_svc
        audit_svc.log(db, module="Manufacturing", record_type="ManufacturingOrder",
                      record_ref=mo.reference, action="Created", new=prod.name, user=admin)
        db.commit()
        mo_svc.confirm(db, mo, user=admin); db.commit()
        if done:
            mo_svc.start(db, mo, user=admin); db.commit()
            mo_svc.produce(db, mo, user=admin); db.commit()
        return mo

    make_mo(dining_table, 4)
    make_mo(wardrobe, 3)
    make_mo(king_bed, 2)
    make_mo(coffee_table, 6)
    make_mo(bookshelf, 5)
    make_mo(dining_table, 2, done=False)  # In progress
    make_mo(sofa_set, 2, done=False)      # Planned

    # ── Backdate ledger for AI velocity signal ────────────────────────────
    all_products = [office_chair, dining_table, wardrobe, king_bed, sofa_set,
                    coffee_table, bookshelf, tv_unit, study_desk, cabinet]
    for prod in all_products:
        bal = prod.on_hand_qty
        for d in range(5, 35, 5):
            delta = -2
            bal += delta
            db.add(StockLedger(product_id=prod.id, qty_delta=delta, balance_after=bal,
                               source_type="SO", note="historical demand",
                               created_at=datetime.now(timezone.utc) - timedelta(days=d)))
    db.commit()

    # ── Build AI insights ─────────────────────────────────────────────────
    from app.ai import engine as ai_engine
    ai_engine.regenerate(db)

    # ── Rebuild permission cache ──────────────────────────────────────────
    from app.core.permissions import build_permission_cache
    build_permission_cache(db)

    print("Seed complete - Shiv Furniture Works ERP")
    print()
    print("  adminuser    / Admin@123    -> System Administrator")
    print("  salesuser    / Sales@123    -> Sales Administrator")
    print("  purchaseuser / Buyer@123    -> Purchase Administrator")
    print("  mfguser01    / Mfg@1234    -> Manufacturing Administrator")
    print("  invmgr01     / Inv@12345   -> Inventory Manager")
    print("  owner01      / Owner@123   -> Business Owner")
    print("  normaluser   / User@1234   -> Normal User")
    print()
    print("  Products: 16  |  Customers: 6  |  Vendors: 5")
    print("  SOs: 9 (6 delivered, 3 pending)  |  POs: 7 (5 received, 2 pending)")
    print("  MOs: 7 (5 done, 2 in progress)")
    db.close()


if __name__ == "__main__":
    run()

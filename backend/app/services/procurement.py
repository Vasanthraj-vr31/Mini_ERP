"""ProcurementService — auto-create PO/MO on SO confirm when a product is
'procure on demand' and on-hand can't cover the order. Idempotent via source tag.
"""
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.sales import SalesOrder
from app.models.purchase import PurchaseOrder, PurchaseOrderLine
from app.models.manufacturing import ManufacturingOrder
from app.models.enums import POStatus, MOStatus, ProcurementType
from app.services import sequence
from app.services.manufacturing import build_mo_from_bom
from app.services import audit


def trigger_for_sales_order(db: Session, so: SalesOrder, user=None) -> list[dict]:
    """For each SO line: if product.procure_on_demand and on_hand < ordered,
    create a PO (Purchase) or MO (Manufacturing) for the shortfall. Returns created docs."""
    created = []
    for line in so.lines:
        product: Product = line.product
        if not product or not product.procure_on_demand:
            continue
        shortfall = round((line.ordered_qty or 0) - (product.on_hand_qty or 0), 4)
        if shortfall <= 0:
            continue

        tag = f"SO:{so.id}:L{line.id}"

        if product.procurement_type == ProcurementType.purchase.value and product.vendor_id:
            if db.query(PurchaseOrder).filter(PurchaseOrder.source == tag).first():
                continue
            po = PurchaseOrder(
                reference=sequence.next_ref(db, PurchaseOrder, "PO"),
                vendor_id=product.vendor_id,
                vendor_address=product.vendor.address if product.vendor else "",
                status=POStatus.draft.value,
                source=tag,
            )
            po.lines.append(PurchaseOrderLine(
                product_id=product.id, ordered_qty=shortfall, cost_price=product.cost_price,
            ))
            db.add(po)
            db.flush()
            audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
                      action="Created", field="auto-procurement",
                      new=f"{shortfall} {product.name} from SO {so.reference}", user=user)
            created.append({"type": "PO", "reference": po.reference, "qty": shortfall,
                            "product": product.name})

        elif product.procurement_type == ProcurementType.manufacturing.value and product.bom_id:
            if db.query(ManufacturingOrder).filter(ManufacturingOrder.source == tag).first():
                continue
            mo = build_mo_from_bom(db, finished_product=product, bom_id=product.bom_id,
                                   quantity=shortfall, source=tag)
            db.add(mo)
            db.flush()
            audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
                      record_ref=mo.reference, action="Created", field="auto-procurement",
                      new=f"{shortfall} {product.name} from SO {so.reference}", user=user)
            created.append({"type": "MO", "reference": mo.reference, "qty": shortfall,
                            "product": product.name})
    return created

"""AI Manufacturing Risk Detection — delayed work orders, missing components, bottlenecks."""
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.manufacturing import ManufacturingOrder, MoWorkOrder
from app.models.enums import MOStatus
from app.services import inventory


def detect(db: Session) -> dict:
    risks = []
    open_mos = (
        db.query(ManufacturingOrder)
        .filter(ManufacturingOrder.status.in_(
            [MOStatus.draft.value, MOStatus.confirmed.value, MOStatus.in_progress.value]))
        .all()
    )

    wc_load = defaultdict(int)
    for mo in open_mos:
        # missing components: free-to-use < to_consume
        for comp in mo.components:
            if comp.component:
                ftu = inventory.free_to_use(db, comp.component)
                if ftu < comp.to_consume_qty:
                    risks.append({
                        "mo": mo.reference, "type": "Missing Component",
                        "severity": "critical",
                        "detail": f"{comp.component.name}: need {comp.to_consume_qty}, only {ftu} free-to-use",
                    })
        # delayed work orders: real > expected
        for wo in mo.work_orders:
            wc_load[wo.work_center_id] += wo.expected_duration
            if wo.real_duration and wo.real_duration > wo.expected_duration:
                risks.append({
                    "mo": mo.reference, "type": "Delayed Work Order",
                    "severity": "warning",
                    "detail": f"{wo.operation}: {wo.real_duration}m vs expected {wo.expected_duration}m",
                })

    # bottleneck: work center with highest queued load
    bottlenecks = []
    if wc_load:
        from app.models.bom import WorkCenter
        top = sorted(wc_load.items(), key=lambda x: x[1], reverse=True)[:2]
        for wc_id, load in top:
            if wc_id and load > 0:
                wc = db.get(WorkCenter, wc_id)
                bottlenecks.append({
                    "work_center": wc.name if wc else f"WC#{wc_id}",
                    "queued_minutes": load,
                    "queued_hours": round(load / 60, 1),
                })

    return {
        "open_mos": len(open_mos),
        "risks": risks,
        "bottlenecks": bottlenecks,
        "risk_count": len(risks),
    }

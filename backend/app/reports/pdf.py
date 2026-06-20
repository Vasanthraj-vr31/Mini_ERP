"""Branded PDF reports (fpdf2, pure-Python). Burgundy editorial styling."""
from datetime import datetime, timezone
from io import BytesIO
from fpdf import FPDF
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.sales import SalesOrder, SaleOrderLine
from app.models.purchase import PurchaseOrder
from app.models.manufacturing import ManufacturingOrder
from app.models.enums import SOStatus, POStatus, MOStatus
from app.ai import forecasting, vendor, manufacturing_risk, health

BURGUNDY = (80, 27, 36)
ROSE = (217, 179, 186)
LIGHT = (234, 213, 216)
INK = (30, 17, 20)
PAPER = (247, 244, 240)


class Report(FPDF):
    title_text = "Report"

    def header(self):
        self.set_fill_color(*BURGUNDY)
        self.rect(0, 0, self.w, 28, "F")
        self.set_xy(12, 8)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 8, "Shiv Furniture Works", ln=1)
        self.set_xy(12, 16)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*ROSE)
        self.cell(0, 6, self.title_text, ln=1)
        self.set_text_color(*INK)
        self.set_y(34)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 130, 135)
        self.cell(0, 8, f"Generated {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC  ·  Page {self.page_no()}", align="C")

    def h2(self, text):
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*BURGUNDY)
        self.cell(0, 8, text, ln=1)
        self.set_text_color(*INK)

    def kpi_row(self, items):
        w = (self.w - 24) / len(items)
        x0 = self.get_x()
        y0 = self.get_y()
        for i, (label, value) in enumerate(items):
            x = 12 + i * w
            self.set_fill_color(*LIGHT)
            self.rect(x, y0, w - 4, 18, "F")
            self.set_xy(x + 3, y0 + 3)
            self.set_font("Helvetica", "B", 15)
            self.set_text_color(*BURGUNDY)
            self.cell(w - 8, 7, str(value), ln=2)
            self.set_x(x + 3)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*INK)
            self.cell(w - 8, 5, label)
        self.set_xy(x0, y0 + 22)

    def table(self, headers, rows, widths):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*BURGUNDY)
        self.set_text_color(255, 255, 255)
        for h, wd in zip(headers, widths):
            self.cell(wd, 8, h, border=0, fill=True)
        self.ln()
        self.set_text_color(*INK)
        self.set_font("Helvetica", "", 9)
        fill = False
        for row in rows:
            if self.get_y() > self.h - 24:
                self.add_page()
            self.set_fill_color(247, 244, 240) if fill else self.set_fill_color(255, 255, 255)
            for val, wd in zip(row, widths):
                self.cell(wd, 7, str(val), border=0, fill=True)
            self.ln()
            fill = not fill


def _bytes(pdf: Report) -> bytes:
    out = pdf.output()
    return bytes(out)


def executive_report(db: Session) -> bytes:
    pdf = Report(); pdf.title_text = "Monthly Executive Report"; pdf.add_page()
    revenue = sum(l.total for l in db.query(SaleOrderLine).join(SalesOrder)
                  .filter(SalesOrder.status.in_([SOStatus.fully_delivered.value,
                                                 SOStatus.partially_delivered.value])).all())
    h = health.compute(db)
    pdf.kpi_row([
        ("Revenue (INR)", f"{revenue:,.0f}"),
        ("Sales Orders", db.query(func.count(SalesOrder.id)).scalar()),
        ("Purchase Orders", db.query(func.count(PurchaseOrder.id)).scalar()),
        ("Health", f"{h['overall_score']} ({h['grade']})"),
    ])
    pdf.h2("Sales Summary")
    rows = [(s.value, db.query(func.count(SalesOrder.id)).filter(SalesOrder.status == s.value).scalar())
            for s in SOStatus]
    pdf.table(["Status", "Count"], rows, [80, 30])
    pdf.h2("Procurement Summary")
    rows = [(s.value, db.query(func.count(PurchaseOrder.id)).filter(PurchaseOrder.status == s.value).scalar())
            for s in POStatus]
    pdf.table(["Status", "Count"], rows, [80, 30])
    pdf.h2("Manufacturing Summary")
    rows = [(s.value, db.query(func.count(ManufacturingOrder.id)).filter(ManufacturingOrder.status == s.value).scalar())
            for s in MOStatus]
    pdf.table(["Status", "Count"], rows, [80, 30])
    pdf.h2("Business Health Breakdown")
    pdf.table(["Pillar", "Score"], [
        ("Inventory", h["inventory_score"]), ("Sales", h["sales_score"]),
        ("Procurement", h["procurement_score"]), ("Manufacturing", h["manufacturing_score"]),
        ("Overall", f"{h['overall_score']} ({h['grade']})"),
    ], [80, 30])
    return _bytes(pdf)


def inventory_health_report(db: Session) -> bytes:
    pdf = Report(); pdf.title_text = "Inventory Health Report"; pdf.add_page()
    fc = forecasting.forecast_all(db)
    critical = [f for f in fc if f["severity"] in ("critical", "warning")]
    pdf.kpi_row([
        ("Products", len(fc)),
        ("At Risk", len(critical)),
        ("Critical", len([f for f in fc if f["severity"] == "critical"])),
    ])
    pdf.h2("Critical Stock & AI Reorder Recommendations")
    rows = [(f["product"], f["on_hand_qty"], f["free_to_use_qty"],
             f["runout_days"] if f["runout_days"] is not None else "-",
             f["recommended_reorder_qty"]) for f in fc]
    pdf.table(["Product", "On Hand", "Free", "Runout (d)", "Reorder Qty"],
              rows, [60, 25, 25, 30, 35])
    return _bytes(pdf)


def manufacturing_report(db: Session) -> bytes:
    pdf = Report(); pdf.title_text = "Manufacturing Performance Report"; pdf.add_page()
    risk = manufacturing_risk.detect(db)
    done = db.query(func.count(ManufacturingOrder.id)).filter(ManufacturingOrder.status == MOStatus.done.value).scalar()
    pdf.kpi_row([("Open MOs", risk["open_mos"]), ("Completed", done),
                 ("Risks", risk["risk_count"])])
    pdf.h2("Production Risks")
    rows = [(r["mo"], r["type"], r["severity"], r["detail"][:60]) for r in risk["risks"]] or [("-", "No risks", "-", "-")]
    pdf.table(["MO", "Type", "Severity", "Detail"], rows, [25, 35, 25, 95])
    pdf.h2("Work Center Bottlenecks")
    rows = [(b["work_center"], f"{b['queued_hours']} h") for b in risk["bottlenecks"]] or [("-", "-")]
    pdf.table(["Work Center", "Queued Load"], rows, [80, 40])
    return _bytes(pdf)


def procurement_report(db: Session) -> bytes:
    pdf = Report(); pdf.title_text = "Procurement Intelligence Report"; pdf.add_page()
    scores = vendor.score_vendors(db)
    pdf.kpi_row([("Vendors", len(scores)),
                 ("Top Vendor", scores[0]["vendor_name"] if scores else "-"),
                 ("Purchase Orders", db.query(func.count(PurchaseOrder.id)).scalar())])
    pdf.h2("Vendor Performance Scorecard")
    rows = [(v["vendor_name"], f"{v['on_time_pct']}%", f"{v['fulfillment_pct']}%",
             v["price_index"], v["overall"]) for v in scores]
    pdf.table(["Vendor", "On-Time", "Fulfillment", "Price Idx", "Score"],
              rows, [55, 28, 32, 28, 27])
    return _bytes(pdf)


REPORTS = {
    "executive": ("Monthly_Executive_Report", executive_report),
    "inventory": ("Inventory_Health_Report", inventory_health_report),
    "manufacturing": ("Manufacturing_Performance_Report", manufacturing_report),
    "procurement": ("Procurement_Intelligence_Report", procurement_report),
}

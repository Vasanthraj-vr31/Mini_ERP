# Shiv Furniture Works — Mini ERP

An Odoo-grade Mini ERP: **From Demand to Delivery**. Sales, Purchase, Manufacturing,
Bill of Materials, Inventory intelligence, Procurement automation, AI insights and
branded PDF reporting — one connected system.

**Stack:** React + Vite + Tailwind (editorial burgundy design) · FastAPI + SQLAlchemy ·
PostgreSQL-ready (SQLite by default) · pure-Python AI (NumPy-free deterministic models) ·
fpdf2 reporting.

---

## Quick start

### 1. Backend (FastAPI · port 8077)
```bash
cd backend
uv venv -p 3.14 .venv           # or: python -m venv .venv
uv pip install -r requirements.txt
.venv/Scripts/python seed.py    # creates demo data (Windows path)
.venv/Scripts/python -m uvicorn app.main:app --port 8077
```

### 2. Frontend (Vite · port 5188)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5188**

### Demo logins
| Login | Password | Role |
|-------|----------|------|
| adminuser | Admin@123 | Admin |
| salesuser | Sales@123 | Sales |
| purchaseuser | Buyer@123 | Purchase |
| mfguser01 | Mfg@1234 | Manufacturing |

---

## Switching to PostgreSQL
The app is Postgres-ready via one env var. With a Postgres server running:
```bash
pip install "psycopg[binary]"          # or psycopg2-binary
# backend/.env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/shiv_erp
```
Then re-run `seed.py`.

---

## The 90-second demo
1. **Dashboard** — KPI hero, Business Health score, live AI insights.
2. **Sales → New SO** for 20 Dining Tables (stock = 5) → **Confirm**.
   → Availability warning + **auto-created Manufacturing Order for the 15-unit shortfall**
   (BoM exploded into components + work orders). This is the procurement engine.
3. **Manufacturing** — open the new MO → Confirm → Start → **Produce**
   → finished goods added, components consumed, stock ledger updated.
4. **Products** — watch On-Hand / Reserved / Free-to-Use recompute live.
5. **Audit Logs** — every tracked field change traced (old → new).
6. **AI Insights** — runout forecasting, vendor scorecard, manufacturing risk.
7. **Reports** — download a branded executive / inventory / manufacturing / procurement PDF.

---

## Architecture
- **Domain services** (`app/services`) hold all business logic — Inventory (ledger +
  reserved + free-to-use), Sales/Purchase/Manufacturing state machines, the
  Procurement auto-trigger, and the Audit logger. Controllers stay thin.
- **StockLedger** is the append-only source of truth for on-hand stock.
- **Free-to-Use = On-Hand − Reserved**, computed live (never stored stale).
- **AI** (`app/ai`) is deterministic and offline-safe — no external ML runtime.
- Built strictly to the canonical module field spec (SO/PO/MO/Product/Profile).

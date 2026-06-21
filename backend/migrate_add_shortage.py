"""Add shortage_qty, linked_po, linked_mo to sale_order_lines"""
import sqlite3

conn = sqlite3.connect('shiv_erp.db')
cur = conn.cursor()

# Add columns safely (ignore if already exists)
cols_to_add = [
    ("shortage_qty", "REAL DEFAULT 0.0"),
    ("linked_po", "TEXT"),
    ("linked_mo", "TEXT"),
]

existing = [row[1] for row in cur.execute("PRAGMA table_info(sale_order_lines)").fetchall()]

for col, typedef in cols_to_add:
    if col not in existing:
        cur.execute(f"ALTER TABLE sale_order_lines ADD COLUMN {col} {typedef}")
        print(f"Added column: {col}")
    else:
        print(f"Column already exists: {col}")

conn.commit()
conn.close()
print("Migration complete.")

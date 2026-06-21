import sqlite3

roles = {
    "adminuser": "System Administrator",
    "salesuser": "Sales Administrator",
    "purchaseuser": "Purchase Administrator",
    "mfguser01": "Manufacturing Administrator",
    "invmgr01": "Inventory Manager",
    "owner01": "Business Owner",
    "normaluser": "Normal User"
}

conn = sqlite3.connect('shiv_erp.db')
cur = conn.cursor()
for login_id, role in roles.items():
    cur.execute("UPDATE users SET role=? WHERE login_id=?", (role, login_id))
conn.commit()
print("Fixed roles successfully.")

import sqlite3
conn = sqlite3.connect('shiv_erp.db')
cur = conn.cursor()
cur.execute("UPDATE users SET role='System Administrator' WHERE login_id='nitinu'")
conn.commit()

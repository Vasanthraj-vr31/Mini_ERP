import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.rbac import Role, Permission, RolePermission

db = SessionLocal()

role = db.query(Role).filter(Role.name == 'Normal User').first()
if not role:
    print("Normal User role not found")
    sys.exit(1)

perms_to_add = [
    ("Purchase", "create"),
    ("Purchase", "edit"),
    ("Purchase", "approve"),
    ("Manufacturing", "create"),
    ("Manufacturing", "edit"),
    ("Manufacturing", "approve")
]

for module, action in perms_to_add:
    perm = db.query(Permission).filter(Permission.module == module, Permission.action == action).first()
    if perm:
        existing = db.query(RolePermission).filter(RolePermission.role_id == role.id, RolePermission.permission_id == perm.id).first()
        if not existing:
            db.add(RolePermission(role_id=role.id, permission_id=perm.id))
            print(f"Granted {module}:{action}")

db.commit()
print("Done")

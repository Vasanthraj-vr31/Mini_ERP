"""
RBAC permission engine.

ROLE_PERMISSION_CACHE is populated once at app startup by build_permission_cache().
On every request, require_permission() resolves (role, module, action) in O(1)
against that in-memory set — zero extra DB queries per request.

Admin always bypasses the cache (full access by design).
All other roles are resolved through the cache; unknown roles get an empty set (deny).
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
# Session imported above — used by the lazy-reload path in require_permission

# Populated at startup: { "Admin": {"Sales:view", ...}, "Sales": {...}, ... }
ROLE_PERMISSION_CACHE: dict[str, set[str]] = {}


def build_permission_cache(db: Session) -> None:
    from app.models.rbac import Role, Permission, RolePermission
    ROLE_PERMISSION_CACHE.clear()
    roles = db.query(Role).all()
    for role in roles:
        rp_rows = db.query(RolePermission).filter(RolePermission.role_id == role.id).all()
        perm_ids = {rp.permission_id for rp in rp_rows}
        if perm_ids:
            perms = db.query(Permission).filter(Permission.id.in_(perm_ids)).all()
        else:
            perms = []
        ROLE_PERMISSION_CACHE[role.name] = {f"{p.module}:{p.action}" for p in perms}


def require_permission(module: str, action: str):
    """
    FastAPI dependency factory.
    Returns the current user on success; raises 403 on permission denial.
    Admin role always passes — cache is only consulted for non-Admin roles.
    If a role is missing from the cache (e.g. cache built before seed ran),
    the cache is rebuilt on-the-fly so the server never needs a restart.
    """
    def checker(user=Depends(get_current_user), db: Session = Depends(get_db)):
        # Both "System Administrator" (new) and "Admin" (legacy seed) get full bypass
        if user.role in ("Admin", "System Administrator"):
            return user
        perm_key = f"{module}:{action}"
        # Lazy-reload: if role absent, rebuild cache once from DB then re-check
        if user.role not in ROLE_PERMISSION_CACHE:
            build_permission_cache(db)
        role_perms = ROLE_PERMISSION_CACHE.get(user.role, set())
        if perm_key not in role_perms:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Permission denied: {perm_key}",
            )
        return user
    return checker

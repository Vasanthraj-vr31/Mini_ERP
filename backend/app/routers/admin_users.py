"""Admin-only user management CRUD.

All routes require System Administrator role (same as old "Admin").
The permission check uses require_roles("System Administrator") as a simple
inline guard — no module/action needed since this is purely admin territory.
"""
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, hash_password
from app.models.user import User
from app.schemas import UserCreate, UserUpdate

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

VALID_ROLES = [
    "System Administrator", "Sales Administrator", "Purchase Administrator",
    "Manufacturing Administrator", "Inventory Manager", "Business Owner", "Normal User",
]


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("System Administrator", "Admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return current_user


def _pub(u: User) -> dict:
    return {
        "id": u.id, "name": u.name, "login_id": u.login_id, "email": u.email,
        "role": u.role, "position": u.position, "department": getattr(u, "department", ""),
        "mobile": u.mobile, "address": u.address, "photo": u.photo,
        "status": getattr(u, "status", "Active"),
        "last_login": u.last_login.isoformat() if getattr(u, "last_login", None) else None,
    }


def _auto_login_id(name: str, db: Session) -> str:
    slug = re.sub(r"[^a-z0-9]", "", name.lower())[:12]
    if len(slug) < 6:
        slug = (slug + "user00")[:6]
    base, n = slug, 1
    while db.query(User).filter(User.login_id == slug).first():
        slug = (base[:10] + str(n).zfill(2))[:12]
        n += 1
    return slug


@router.get("")
def list_users(_: User = Depends(_require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    return [_pub(u) for u in users]


@router.post("", status_code=201)
def create_user(body: UserCreate, _: User = Depends(_require_admin), db: Session = Depends(get_db)):
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role. Choose from: {', '.join(VALID_ROLES)}")
    login_id = body.login_id or _auto_login_id(body.name, db)
    if db.query(User).filter(User.login_id == login_id).first():
        raise HTTPException(400, "Login Id already exists")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already exists")
    u = User(
        name=body.name, login_id=login_id, email=body.email,
        password_hash=hash_password(body.password),
        role=body.role, position=body.position,
        department=getattr(body, "department", ""),
        mobile=body.mobile, address=body.address, status="Active",
    )
    db.add(u); db.commit(); db.refresh(u)
    return _pub(u)


@router.get("/{user_id}")
def get_user(user_id: int, _: User = Depends(_require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    return _pub(u)


@router.patch("/{user_id}")
def update_user(user_id: int, body: UserUpdate, _: User = Depends(_require_admin),
                db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    if body.role is not None and body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role. Choose from: {', '.join(VALID_ROLES)}")
    if body.email is not None:
        existing = db.query(User).filter(User.email == body.email, User.id != user_id).first()
        if existing:
            raise HTTPException(400, "Email already in use")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(u, field, val)
    db.commit(); db.refresh(u)
    return _pub(u)


@router.patch("/{user_id}/status")
def toggle_status(user_id: int, _: User = Depends(_require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.status = "Inactive" if u.status == "Active" else "Active"
    db.commit()
    return {"id": u.id, "status": u.status}


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, current: User = Depends(_require_admin), db: Session = Depends(get_db)):
    if user_id == current.id:
        raise HTTPException(400, "Cannot delete your own account")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    db.delete(u); db.commit()

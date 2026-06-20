import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (hash_password, verify_password, create_access_token,
                               get_current_user)
from app.models.user import User
from app.schemas import SignupIn, ProfileUpdate

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_public(u: User) -> dict:
    return {
        "id": u.id, "name": u.name, "login_id": u.login_id, "email": u.email,
        "role": u.role, "position": u.position, "department": getattr(u, "department", ""),
        "address": u.address, "mobile": u.mobile, "photo": u.photo,
        "status": getattr(u, "status", "Active"),
        "last_login": u.last_login.isoformat() if getattr(u, "last_login", None) else None,
    }


def _auto_login_id(name: str, db: Session) -> str:
    slug = re.sub(r"[^a-z0-9]", "", name.lower().replace(" ", ""))[:12]
    if len(slug) < 6:
        slug = (slug + "user00")[:6]
    # ensure uniqueness
    base, n = slug, 1
    while db.query(User).filter(User.login_id == slug).first():
        slug = (base[:10] + str(n).zfill(2))[:12]
        n += 1
    return slug


@router.post("/signup")
def signup(body: SignupIn, db: Session = Depends(get_db)):
    # Auto-generate login_id from name when not provided
    login_id = body.login_id if body.login_id else _auto_login_id(body.name, db)
    if not (6 <= len(login_id) <= 20):
        raise HTTPException(400, "Login Id must be 6-20 characters")
    if db.query(User).filter(User.login_id == login_id).first():
        raise HTTPException(400, "Login Id already exists")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already exists")
    pw = body.password
    if len(pw) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    u = User(name=body.name, login_id=login_id, email=body.email,
             password_hash=hash_password(pw), role="Normal User",
             position=body.position, department=getattr(body, "department", ""),
             status="Active")
    db.add(u); db.commit(); db.refresh(u)
    token = create_access_token(u.id, u.role)
    return {"access_token": token, "token_type": "bearer", "user": _user_public(u)}


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = (db.query(User).filter(User.login_id == form.username).first()
         or db.query(User).filter(User.email == form.username).first())
    if not u or not verify_password(form.password, u.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Login Id or Password")
    if getattr(u, "status", "Active") != "Active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive")
    u.last_login = datetime.now(timezone.utc)
    db.commit()
    token = create_access_token(u.id, u.role)
    return {"access_token": token, "token_type": "bearer", "user": _user_public(u)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return _user_public(user)


@router.put("/me")
def update_me(body: ProfileUpdate, user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    # Email never changes; Position only by Admin (spec: User login detail management)
    if body.name is not None: user.name = body.name
    if body.address is not None: user.address = body.address
    if body.mobile is not None: user.mobile = body.mobile
    if body.photo is not None: user.photo = body.photo
    if body.position is not None:
        if user.role != "Admin":
            raise HTTPException(403, "Position is read-only; only an administrator can change it")
        user.position = body.position
    db.commit(); db.refresh(user)
    return _user_public(user)

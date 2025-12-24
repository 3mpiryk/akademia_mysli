from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.enums import UserRole
from app.db.models import User


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, email: str, password: str, allowed_roles: Iterable[UserRole] | None = None) -> str:
        user = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if allowed_roles and user.role not in set(allowed_roles):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return create_access_token(subject=str(user.id), extra={"role": user.role.value})

    def register_guardian(self, email: str, password: str) -> str:
        existing = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.GUARDIAN,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        self.db.commit()
        return create_access_token(subject=str(user.id), extra={"role": user.role.value})

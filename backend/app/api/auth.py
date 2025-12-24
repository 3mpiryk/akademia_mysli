from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.enums import UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    token = service.login(payload.email, payload.password, allowed_roles=[UserRole.GUARDIAN])
    return TokenResponse(access_token=token)


@router.post("/staff-login", response_model=TokenResponse)
def staff_login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    token = service.login(
        payload.email,
        payload.password,
        allowed_roles=[
            UserRole.ADMIN,
            UserRole.REGISTRATION,
            UserRole.DOCTOR,
            UserRole.THERAPIST,
        ],
    )
    return TokenResponse(access_token=token)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    token = service.register_guardian(payload.email, payload.password)
    return TokenResponse(access_token=token)

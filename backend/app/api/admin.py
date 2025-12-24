from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin_user
from app.db.models import User
from app.utils.patient_code import PatientCode
from app.schemas.admin import (
    DoctorCreateRequest,
    DoctorCreateResponse,
    DoctorListItem,
    PasswordResetResponse,
    PatientCreateRequest,
    PatientCreateResponse,
    PatientListItem,
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/doctors", response_model=DoctorCreateResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> DoctorCreateResponse:
    service = AdminService(db)
    user, doctor, password = service.create_doctor(
        email=payload.email,
        specialization=payload.specialization,
        role=payload.role,
        phone=payload.phone,
        license_number=payload.license_number,
        buffer_minutes=payload.buffer_minutes,
        timezone=payload.timezone,
    )
    return DoctorCreateResponse(
        user_id=user.id,
        doctor_id=doctor.id,
        email=user.email,
        role=user.role.value,
        specialization=doctor.specialization,
        temporary_password=password,
    )


@router.get("/doctors", response_model=list[DoctorListItem])
def list_doctors(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> list[DoctorListItem]:
    service = AdminService(db)
    rows = service.list_doctors(limit=limit, offset=offset)
    return [
        DoctorListItem(
            user_id=user.id,
            doctor_id=doctor.id,
            email=user.email,
            phone=user.phone,
            role=user.role.value,
            specialization=doctor.specialization,
            is_active=doctor.is_active,
        )
        for user, doctor in rows
    ]


@router.post("/patients", response_model=PatientCreateResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> PatientCreateResponse:
    service = AdminService(db)
    user, guardian, child, password, record_code = service.create_guardian_with_child(
        guardian_full_name=payload.guardian_full_name,
        guardian_email=payload.guardian_email,
        guardian_phone=payload.guardian_phone,
        guardian_address_line=payload.guardian_address_line,
        guardian_city=payload.guardian_city,
        guardian_postal_code=payload.guardian_postal_code,
        guardian_preferred_contact_channel=payload.guardian_preferred_contact_channel,
        child_first_name=payload.child_first_name,
        child_last_name=payload.child_last_name,
        child_date_of_birth=payload.child_date_of_birth,
        child_gender=payload.child_gender,
        child_pesel=payload.child_pesel,
        child_address_line=payload.child_address_line,
        child_city=payload.child_city,
        child_postal_code=payload.child_postal_code,
        child_school_name=payload.child_school_name,
        child_class_name=payload.child_class_name,
        consent_rodo=payload.consent_rodo,
        consent_guardian=payload.consent_guardian,
    )
    return PatientCreateResponse(
        user_id=user.id,
        guardian_id=guardian.id,
        child_id=child.id,
        record_code=record_code,
        temporary_password=password,
    )


@router.get("/patients", response_model=list[PatientListItem])
def list_patients(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> list[PatientListItem]:
    service = AdminService(db)
    rows = service.list_patients(limit=limit, offset=offset)
    return [
        PatientListItem(
            user_id=guardian.user_id,
            guardian_id=guardian.id,
            child_id=child.id,
            record_code=PatientCode.format(child.mrn_number),
            child_name=f"{child.first_name} {child.last_name}".strip(),
            date_of_birth=child.date_of_birth,
            status=child.status.value,
            guardian_name=guardian.full_name,
            guardian_email=guardian.email,
            guardian_phone=guardian.phone,
        )
        for child, guardian in rows
    ]


@router.post("/users/{user_id}/reset-password", response_model=PasswordResetResponse)
def reset_user_password(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> PasswordResetResponse:
    service = AdminService(db)
    user, password = service.reset_user_password(user_id=user_id)
    return PasswordResetResponse(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        temporary_password=password,
    )

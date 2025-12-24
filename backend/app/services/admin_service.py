import datetime as dt
import uuid
import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.enums import ConsentType, ContactChannel, Gender, UserRole
from app.db.models import (
    ChildContact,
    ChildProfile,
    Consent,
    Doctor,
    GuardianContact,
    PatientProfile,
    User,
)
from app.utils.patient_code import PatientCode


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_doctor(
        self,
        *,
        email: str,
        specialization: str,
        role: UserRole,
        phone: str | None = None,
        license_number: str | None = None,
        buffer_minutes: int = 0,
        timezone: str = "Europe/Warsaw",
    ) -> tuple[User, Doctor, str]:
        if role not in {UserRole.DOCTOR, UserRole.THERAPIST}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        if buffer_minutes < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid buffer minutes")

        existing = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        password = self._generate_password()
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True,
            is_verified=True,
            phone=phone,
        )
        self.db.add(user)
        self.db.flush()

        doctor = Doctor(
            user_id=user.id,
            specialization=specialization,
            license_number=license_number,
            buffer_minutes=buffer_minutes,
            timezone=timezone,
            is_active=True,
        )
        self.db.add(doctor)
        self.db.commit()
        self.db.refresh(doctor)
        return user, doctor, password

    def _generate_password(self, length: int = 12) -> str:
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def create_guardian_with_child(
        self,
        *,
        guardian_full_name: str,
        guardian_email: str,
        guardian_phone: str | None,
        guardian_address_line: str | None,
        guardian_city: str | None,
        guardian_postal_code: str | None,
        guardian_preferred_contact_channel: ContactChannel | None,
        child_first_name: str,
        child_last_name: str,
        child_date_of_birth: dt.date,
        child_gender: Gender | None,
        child_pesel: str | None,
        child_address_line: str | None,
        child_city: str | None,
        child_postal_code: str | None,
        child_school_name: str | None,
        child_class_name: str | None,
        consent_rodo: bool,
        consent_guardian: bool,
    ) -> tuple[User, PatientProfile, ChildProfile, str, str]:
        existing = self.db.execute(select(User).where(User.email == guardian_email)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        password = self._generate_password()
        user = User(
            email=guardian_email,
            hashed_password=get_password_hash(password),
            role=UserRole.GUARDIAN,
            is_active=True,
            is_verified=True,
            phone=guardian_phone,
        )
        self.db.add(user)
        self.db.flush()

        guardian = PatientProfile(
            user_id=user.id,
            full_name=guardian_full_name,
            email=guardian_email,
            phone=guardian_phone,
            address_line=guardian_address_line,
            city=guardian_city,
            postal_code=guardian_postal_code,
            preferred_contact_channel=guardian_preferred_contact_channel,
        )
        self.db.add(guardian)
        self.db.flush()

        child = ChildProfile(
            guardian_id=guardian.id,
            first_name=child_first_name,
            last_name=child_last_name,
            date_of_birth=child_date_of_birth,
            gender=child_gender,
            pesel=child_pesel,
        )
        self.db.add(child)
        self.db.flush()

        if guardian_email:
            self.db.add(
                GuardianContact(
                    guardian_id=guardian.id,
                    channel=ContactChannel.EMAIL,
                    value=guardian_email,
                    is_primary=True,
                    is_verified=True,
                )
            )
        if guardian_phone:
            self.db.add(
                GuardianContact(
                    guardian_id=guardian.id,
                    channel=ContactChannel.PHONE,
                    value=guardian_phone,
                    is_primary=not bool(guardian_email),
                    is_verified=False,
                )
            )

        has_child_contact = any(
            [
                child_address_line,
                child_city,
                child_postal_code,
                child_school_name,
                child_class_name,
            ]
        )
        if has_child_contact:
            self.db.add(
                ChildContact(
                    child_id=child.id,
                    address_line=child_address_line,
                    city=child_city,
                    postal_code=child_postal_code,
                    school_name=child_school_name,
                    class_name=child_class_name,
                )
            )

        if consent_rodo:
            self.db.add(
                Consent(
                    guardian_id=guardian.id,
                    child_id=child.id,
                    consent_type=ConsentType.RODO,
                )
            )
        if consent_guardian:
            self.db.add(
                Consent(
                    guardian_id=guardian.id,
                    child_id=child.id,
                    consent_type=ConsentType.GUARDIAN,
                )
            )

        self.db.commit()
        record_code = PatientCode.format(child.mrn_number)
        return user, guardian, child, password, record_code

    def list_doctors(self, *, limit: int = 100, offset: int = 0) -> list[tuple[User, Doctor]]:
        stmt = (
            select(User, Doctor)
            .join(Doctor, Doctor.user_id == User.id)
            .where(User.role.in_([UserRole.DOCTOR, UserRole.THERAPIST]))
            .order_by(User.email.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).all())

    def list_patients(self, *, limit: int = 100, offset: int = 0) -> list[tuple[ChildProfile, PatientProfile]]:
        stmt = (
            select(ChildProfile, PatientProfile)
            .join(PatientProfile, PatientProfile.id == ChildProfile.guardian_id)
            .order_by(ChildProfile.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).all())

    def reset_user_password(self, *, user_id: uuid.UUID) -> tuple[User, str]:
        user = self.db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        password = self._generate_password()
        user.hashed_password = get_password_hash(password)
        self.db.commit()
        return user, password

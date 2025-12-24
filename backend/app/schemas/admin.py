import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.enums import ContactChannel, Gender, UserRole


class DoctorCreateRequest(BaseModel):
    email: str
    specialization: str
    role: UserRole = Field(default=UserRole.DOCTOR)
    phone: str | None = None
    license_number: str | None = None
    buffer_minutes: int = 0
    timezone: str = "Europe/Warsaw"


class DoctorCreateResponse(BaseModel):
    user_id: UUID
    doctor_id: UUID
    email: str
    role: str
    specialization: str
    temporary_password: str


class DoctorListItem(BaseModel):
    user_id: UUID
    doctor_id: UUID
    email: str
    phone: str | None = None
    role: str
    specialization: str
    is_active: bool


class PatientCreateRequest(BaseModel):
    guardian_full_name: str
    guardian_email: str
    guardian_phone: str | None = None
    guardian_address_line: str | None = None
    guardian_city: str | None = None
    guardian_postal_code: str | None = None
    guardian_preferred_contact_channel: ContactChannel | None = None
    child_first_name: str
    child_last_name: str
    child_date_of_birth: datetime.date
    child_gender: Gender | None = None
    child_pesel: str | None = None
    child_address_line: str | None = None
    child_city: str | None = None
    child_postal_code: str | None = None
    child_school_name: str | None = None
    child_class_name: str | None = None
    consent_rodo: bool = False
    consent_guardian: bool = False


class PatientCreateResponse(BaseModel):
    user_id: UUID
    guardian_id: UUID
    child_id: UUID
    record_code: str
    temporary_password: str


class PatientListItem(BaseModel):
    user_id: UUID
    guardian_id: UUID
    child_id: UUID
    record_code: str
    child_name: str
    date_of_birth: datetime.date
    status: str
    guardian_name: str
    guardian_email: str | None = None
    guardian_phone: str | None = None


class PasswordResetResponse(BaseModel):
    user_id: UUID
    email: str
    role: str
    temporary_password: str

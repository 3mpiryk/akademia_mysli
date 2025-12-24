import datetime as dt
from uuid import UUID

from pydantic import BaseModel

from app.db.enums import ContactChannel, Gender


class PatientOnboardingRequest(BaseModel):
    guardian_full_name: str
    guardian_phone: str | None = None
    guardian_address_line: str | None = None
    guardian_city: str | None = None
    guardian_postal_code: str | None = None
    guardian_preferred_contact_channel: ContactChannel | None = None
    child_first_name: str
    child_last_name: str
    child_date_of_birth: dt.date
    child_gender: Gender | None = None
    child_pesel: str | None = None
    child_address_line: str | None = None
    child_city: str | None = None
    child_postal_code: str | None = None
    child_school_name: str | None = None
    child_class_name: str | None = None
    consent_rodo: bool = False
    consent_guardian: bool = False


class PatientOnboardingResponse(BaseModel):
    child_id: UUID
    record_code: str

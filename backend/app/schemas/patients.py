import datetime as dt
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel


class GuardianSummary(BaseModel):
    id: UUID
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class PatientSummary(BaseModel):
    id: UUID
    full_name: str
    date_of_birth: dt.date
    age: int
    mrn: Optional[str] = None
    mrn_number: int
    record_code: str
    status: str
    tags: Optional[dict[str, Any]] = None
    guardian: GuardianSummary


class PatientLookupResponse(BaseModel):
    id: UUID
    full_name: str
    mrn_number: int
    record_code: str


class PatientSearchItem(BaseModel):
    id: UUID
    full_name: str
    date_of_birth: dt.date
    mrn_number: int
    record_code: str
    guardian_name: Optional[str] = None


class ChildContactDetails(BaseModel):
    address_line: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    school_name: Optional[str] = None
    class_name: Optional[str] = None
    registration_notes: Optional[str] = None


class EmergencyContactDetails(BaseModel):
    full_name: str
    relation: Optional[str] = None
    phone: str


class GuardianContactDetails(BaseModel):
    channel: str
    value: str
    is_primary: bool
    is_verified: bool


class ConsentDetails(BaseModel):
    consent_type: str
    granted_at: dt.datetime
    revoked_at: Optional[dt.datetime] = None
    notes: Optional[str] = None


class AuthorizedPersonDetails(BaseModel):
    full_name: str
    relation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    scope: Optional[str] = None
    is_active: bool


class PatientDetails(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    date_of_birth: dt.date
    gender: Optional[str] = None
    pesel: Optional[str] = None
    mrn: Optional[str] = None
    mrn_number: int
    record_code: str
    status: str
    child_version: int
    guardian_version: int
    guardian_address_line: Optional[str] = None
    guardian_city: Optional[str] = None
    guardian_postal_code: Optional[str] = None
    guardian_preferred_contact_channel: Optional[str] = None
    guardian: GuardianSummary
    child_contact: Optional[ChildContactDetails] = None
    guardian_contacts: List[GuardianContactDetails]
    emergency_contacts: List[EmergencyContactDetails]
    consents: List[ConsentDetails]
    authorized_people: List[AuthorizedPersonDetails]


class ChildUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[dt.date] = None
    gender: Optional[str] = None
    pesel: Optional[str] = None
    mrn: Optional[str] = None
    status: Optional[str] = None
    version: Optional[int] = None


class GuardianUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    preferred_contact_channel: Optional[str] = None
    version: Optional[int] = None


class ChildContactUpdate(BaseModel):
    address_line: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    school_name: Optional[str] = None
    class_name: Optional[str] = None
    registration_notes: Optional[str] = None


class PatientDetailsUpdate(BaseModel):
    child: Optional[ChildUpdate] = None
    guardian: Optional[GuardianUpdate] = None
    child_contact: Optional[ChildContactUpdate] = None


class AppointmentItem(BaseModel):
    id: UUID
    doctor_id: UUID
    service_id: UUID
    status: str
    start_at: dt.datetime
    end_at: dt.datetime


class EncounterItem(BaseModel):
    id: UUID
    appointment_id: Optional[UUID] = None
    doctor_id: UUID
    status: str
    started_at: Optional[dt.datetime] = None
    ended_at: Optional[dt.datetime] = None
    created_at: dt.datetime


class PrescriptionListItem(BaseModel):
    id: UUID
    appointment_id: Optional[UUID] = None
    doctor_id: UUID
    child_id: UUID
    code: str
    issued_at: dt.datetime
    expires_at: Optional[dt.datetime] = None


class InvoiceListItem(BaseModel):
    id: UUID
    appointment_id: Optional[UUID] = None
    guardian_id: UUID
    number: str
    status: str
    issued_at: dt.datetime
    due_at: Optional[dt.datetime] = None
    paid_at: Optional[dt.datetime] = None
    total_amount: float
    currency: str


class AttachmentItem(BaseModel):
    id: UUID
    child_id: Optional[UUID] = None
    encounter_id: Optional[UUID] = None
    note_id: Optional[UUID] = None
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: dt.datetime


class EncounterDetails(BaseModel):
    id: UUID
    appointment_id: Optional[UUID] = None
    doctor_id: UUID
    guardian_id: UUID
    child_id: UUID
    status: str
    started_at: Optional[dt.datetime] = None
    ended_at: Optional[dt.datetime] = None
    created_at: dt.datetime
    updated_at: dt.datetime


class AppointmentDetails(BaseModel):
    id: UUID
    doctor_id: UUID
    service_id: UUID
    guardian_id: UUID
    child_id: UUID
    status: str
    start_at: dt.datetime
    end_at: dt.datetime
    buffer_minutes: int
    price_amount: float
    currency: str
    notes: Optional[str] = None
    cancelled_at: Optional[dt.datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime


class DoctorAppointmentItem(BaseModel):
    id: UUID
    child_id: UUID
    child_name: str
    record_code: str
    service_id: UUID
    service_name: str
    status: str
    start_at: dt.datetime
    end_at: dt.datetime


class NoteContent(BaseModel):
    history_text: Optional[str] = None
    diagnosis_text: Optional[str] = None
    recommendations_text: Optional[str] = None
    therapy_plan_text: Optional[str] = None
    guardian_summary_text: Optional[str] = None


class NoteCreate(NoteContent):
    author_user_id: Optional[UUID] = None
    is_visible_to_guardian: bool = False


class NoteUpdate(NoteContent):
    updated_by_user_id: Optional[UUID] = None
    is_visible_to_guardian: Optional[bool] = None


class NoteAddendum(NoteContent):
    created_by_user_id: Optional[UUID] = None


class NoteSign(BaseModel):
    signed_by_user_id: Optional[UUID] = None


class NoteVersionDetails(BaseModel):
    id: UUID
    version_number: int
    is_addendum: bool
    history_text: Optional[str] = None
    diagnosis_text: Optional[str] = None
    recommendations_text: Optional[str] = None
    therapy_plan_text: Optional[str] = None
    guardian_summary_text: Optional[str] = None
    created_by_user_id: UUID
    created_at: dt.datetime


class NoteDetails(BaseModel):
    id: UUID
    encounter_id: UUID
    author_user_id: UUID
    status: str
    is_visible_to_guardian: bool
    version: int
    signed_at: Optional[dt.datetime] = None
    signed_by_user_id: Optional[UUID] = None
    created_at: dt.datetime
    updated_at: dt.datetime
    current_version: NoteVersionDetails

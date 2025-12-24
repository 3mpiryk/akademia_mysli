import datetime as dt
import uuid
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_staff_user
from app.db.enums import AppointmentStatus, ContactChannel, Gender, NoteStatus, PatientStatus, UserRole
from app.db.models import (
    Appointment,
    AuthorizedPerson,
    ChildContact,
    ChildProfile,
    ClinicalNote,
    Consent,
    Doctor,
    EmergencyContact,
    Encounter,
    GuardianContact,
    Invoice,
    NoteVersion,
    PatientProfile,
    Prescription,
    Service,
    Attachment,
    User,
)
from app.schemas.patients import (
    AttachmentItem,
    AppointmentItem,
    AppointmentDetails,
    AuthorizedPersonDetails,
    ChildContactDetails,
    ConsentDetails,
    EmergencyContactDetails,
    EncounterDetails,
    EncounterItem,
    DoctorAppointmentItem,
    GuardianContactDetails,
    GuardianSummary,
    NoteAddendum,
    NoteCreate,
    NoteDetails,
    NoteSign,
    NoteUpdate,
    NoteVersionDetails,
    PatientDetails,
    PatientDetailsUpdate,
    PatientLookupResponse,
    PatientSearchItem,
    PatientSummary,
    PrescriptionListItem,
    InvoiceListItem,
)
from app.utils.patient_code import PatientCode
from app.utils.storage import resolve_storage_path, save_upload

router = APIRouter(prefix="/med", tags=["med"])


def calculate_age(date_of_birth: dt.date) -> int:
    today = dt.date.today()
    years = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return max(years, 0)


def _ensure_clinical_access(current_user: User) -> None:
    if current_user.role not in {UserRole.ADMIN, UserRole.DOCTOR, UserRole.THERAPIST}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _get_doctor_for_user(db: Session, current_user: User) -> Doctor:
    doctor = db.execute(select(Doctor).where(Doctor.user_id == current_user.id)).scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor profile not found")
    return doctor


def _ensure_patient_access(db: Session, current_user: User, child_id: UUID) -> Doctor | None:
    if current_user.role in {UserRole.ADMIN, UserRole.REGISTRATION}:
        return None
    if current_user.role in {UserRole.DOCTOR, UserRole.THERAPIST}:
        doctor = _get_doctor_for_user(db, current_user)
        appointment_exists = db.execute(
            select(Appointment.id)
            .where(Appointment.child_id == child_id, Appointment.doctor_id == doctor.id)
            .limit(1)
        ).scalar_one_or_none()
        if appointment_exists:
            return doctor
        encounter_exists = db.execute(
            select(Encounter.id)
            .where(Encounter.child_id == child_id, Encounter.doctor_id == doctor.id)
            .limit(1)
        ).scalar_one_or_none()
        if encounter_exists:
            return doctor
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to patient")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _ensure_appointment_access(db: Session, current_user: User, appointment: Appointment) -> None:
    if current_user.role in {UserRole.ADMIN, UserRole.REGISTRATION}:
        return
    if current_user.role in {UserRole.DOCTOR, UserRole.THERAPIST}:
        doctor = _get_doctor_for_user(db, current_user)
        if appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to appointment")
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _ensure_encounter_access(db: Session, current_user: User, encounter: Encounter) -> None:
    if current_user.role in {UserRole.ADMIN, UserRole.REGISTRATION}:
        return
    if current_user.role in {UserRole.DOCTOR, UserRole.THERAPIST}:
        doctor = _get_doctor_for_user(db, current_user)
        if encounter.doctor_id != doctor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to encounter")
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _note_status_value(note: ClinicalNote) -> str:
    return note.status.value if hasattr(note.status, "value") else str(note.status)


def _resolve_attachment_child_id(db: Session, attachment: Attachment) -> UUID | None:
    if attachment.child_id:
        return attachment.child_id
    if attachment.encounter_id:
        return db.execute(
            select(Encounter.child_id).where(Encounter.id == attachment.encounter_id)
        ).scalar_one_or_none()
    if attachment.note_id:
        encounter_id = db.execute(
            select(ClinicalNote.encounter_id).where(ClinicalNote.id == attachment.note_id)
        ).scalar_one_or_none()
        if not encounter_id:
            return None
        return db.execute(
            select(Encounter.child_id).where(Encounter.id == encounter_id)
        ).scalar_one_or_none()
    return None


def _note_to_details(note: ClinicalNote, version: NoteVersion) -> NoteDetails:
    return NoteDetails(
        id=note.id,
        encounter_id=note.encounter_id,
        author_user_id=note.author_user_id,
        status=_note_status_value(note),
        is_visible_to_guardian=note.is_visible_to_guardian,
        version=note.version,
        signed_at=note.signed_at,
        signed_by_user_id=note.signed_by_user_id,
        created_at=note.created_at,
        updated_at=note.updated_at,
        current_version=NoteVersionDetails(
            id=version.id,
            version_number=version.version_number,
            is_addendum=version.is_addendum,
            history_text=version.history_text,
            diagnosis_text=version.diagnosis_text,
            recommendations_text=version.recommendations_text,
            therapy_plan_text=version.therapy_plan_text,
            guardian_summary_text=version.guardian_summary_text,
            created_by_user_id=version.created_by_user_id,
            created_at=version.created_at,
        ),
    )


@router.get("/patients/{patient_id}/summary", response_model=PatientSummary)
def get_patient_summary(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> PatientSummary:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    guardian = db.execute(
        select(PatientProfile).where(PatientProfile.id == child.guardian_id)
    ).scalar_one_or_none()
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")

    full_name = f"{child.first_name} {child.last_name}".strip()
    return PatientSummary(
        id=child.id,
        full_name=full_name,
        date_of_birth=child.date_of_birth,
        age=calculate_age(child.date_of_birth),
        mrn=child.mrn,
        mrn_number=child.mrn_number,
        record_code=PatientCode.format(child.mrn_number),
        status=child.status.value,
        tags=child.tags,
        guardian=GuardianSummary(
            id=guardian.id,
            full_name=guardian.full_name,
            email=guardian.email,
            phone=guardian.phone,
        ),
    )


@router.get("/patients/lookup", response_model=PatientLookupResponse)
def lookup_patient(
    code: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> PatientLookupResponse:
    try:
        number = PatientCode.parse(code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid patient code") from exc

    child = db.execute(
        select(ChildProfile).where(ChildProfile.mrn_number == number)
    ).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    full_name = f"{child.first_name} {child.last_name}".strip()
    return PatientLookupResponse(
        id=child.id,
        full_name=full_name,
        mrn_number=child.mrn_number,
        record_code=PatientCode.format(child.mrn_number),
    )


@router.get("/patients/{patient_id}/details", response_model=PatientDetails)
def get_patient_details(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> PatientDetails:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    guardian = db.execute(
        select(PatientProfile).where(PatientProfile.id == child.guardian_id)
    ).scalar_one_or_none()
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")

    child_contact = db.execute(
        select(ChildContact).where(ChildContact.child_id == child.id)
    ).scalar_one_or_none()

    guardian_contacts = db.execute(
        select(GuardianContact).where(GuardianContact.guardian_id == guardian.id)
    ).scalars().all()

    emergency_contacts = db.execute(
        select(EmergencyContact).where(EmergencyContact.child_id == child.id)
    ).scalars().all()

    consents = db.execute(
        select(Consent).where(Consent.child_id == child.id)
    ).scalars().all()

    authorized_people = db.execute(
        select(AuthorizedPerson).where(AuthorizedPerson.child_id == child.id)
    ).scalars().all()

    return PatientDetails(
        id=child.id,
        first_name=child.first_name,
        last_name=child.last_name,
        date_of_birth=child.date_of_birth,
        gender=child.gender.value if child.gender else None,
        pesel=child.pesel,
        mrn=child.mrn,
        mrn_number=child.mrn_number,
        record_code=PatientCode.format(child.mrn_number),
        status=child.status.value,
        child_version=child.version,
        guardian_version=guardian.version,
        guardian_address_line=guardian.address_line,
        guardian_city=guardian.city,
        guardian_postal_code=guardian.postal_code,
        guardian_preferred_contact_channel=guardian.preferred_contact_channel.value if guardian.preferred_contact_channel else None,
        guardian=GuardianSummary(
            id=guardian.id,
            full_name=guardian.full_name,
            email=guardian.email,
            phone=guardian.phone,
        ),
        child_contact=ChildContactDetails(
            address_line=child_contact.address_line,
            city=child_contact.city,
            postal_code=child_contact.postal_code,
            school_name=child_contact.school_name,
            class_name=child_contact.class_name,
            registration_notes=child_contact.registration_notes,
        ) if child_contact else None,
        guardian_contacts=[
            GuardianContactDetails(
                channel=contact.channel.value,
                value=contact.value,
                is_primary=contact.is_primary,
                is_verified=contact.is_verified,
            )
            for contact in guardian_contacts
        ],
        emergency_contacts=[
            EmergencyContactDetails(
                full_name=contact.full_name,
                relation=contact.relation,
                phone=contact.phone,
            )
            for contact in emergency_contacts
        ],
        consents=[
            ConsentDetails(
                consent_type=consent.consent_type.value,
                granted_at=consent.granted_at,
                revoked_at=consent.revoked_at,
                notes=consent.notes,
            )
            for consent in consents
        ],
        authorized_people=[
            AuthorizedPersonDetails(
                full_name=person.full_name,
                relation=person.relation,
                phone=person.phone,
                email=person.email,
                scope=person.scope,
                is_active=person.is_active,
            )
            for person in authorized_people
        ],
    )


@router.get("/patients/search", response_model=List[PatientSearchItem])
def search_patients(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=25),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[PatientSearchItem]:
    cleaned = query.strip()
    if not cleaned:
        return []

    doctor = None
    if current_user.role in {UserRole.DOCTOR, UserRole.THERAPIST}:
        doctor = _get_doctor_for_user(db, current_user)

    stmt = (
        select(ChildProfile, PatientProfile.full_name)
        .join(PatientProfile, PatientProfile.id == ChildProfile.guardian_id)
    )
    if doctor:
        stmt = (
            stmt.join(Appointment, Appointment.child_id == ChildProfile.id)
            .where(Appointment.doctor_id == doctor.id)
        )

    try:
        number = PatientCode.parse(cleaned)
    except ValueError:
        number = None

    if number is not None:
        stmt = stmt.where(ChildProfile.mrn_number == number)
    else:
        pattern = f"%{cleaned}%"
        stmt = stmt.where(
            or_(
                ChildProfile.first_name.ilike(pattern),
                ChildProfile.last_name.ilike(pattern),
                PatientProfile.full_name.ilike(pattern),
            )
        )

    rows = db.execute(stmt.distinct().limit(limit)).all()
    return [
        PatientSearchItem(
            id=child.id,
            full_name=f"{child.first_name} {child.last_name}".strip(),
            date_of_birth=child.date_of_birth,
            mrn_number=child.mrn_number,
            record_code=PatientCode.format(child.mrn_number),
            guardian_name=guardian_name,
        )
        for child, guardian_name in rows
    ]


@router.patch("/patients/{patient_id}/details", response_model=PatientDetails)
def update_patient_details(
    patient_id: UUID,
    payload: PatientDetailsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> PatientDetails:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    guardian = db.execute(
        select(PatientProfile).where(PatientProfile.id == child.guardian_id)
    ).scalar_one_or_none()
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")

    now = dt.datetime.now(dt.timezone.utc)

    if payload.child:
        if payload.child.version is not None and child.version != payload.child.version:
            raise HTTPException(status_code=409, detail="Child profile version conflict")
        if payload.child.first_name is not None:
            child.first_name = payload.child.first_name
        if payload.child.last_name is not None:
            child.last_name = payload.child.last_name
        if payload.child.date_of_birth is not None:
            child.date_of_birth = payload.child.date_of_birth
        if payload.child.gender is not None:
            try:
                child.gender = Gender(payload.child.gender)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Invalid gender") from exc
        if payload.child.pesel is not None:
            child.pesel = payload.child.pesel
        if payload.child.mrn is not None:
            child.mrn = payload.child.mrn
        if payload.child.status is not None:
            try:
                child.status = PatientStatus(payload.child.status)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Invalid status") from exc
        child.version = (child.version or 0) + 1
        child.updated_at = now

    if payload.guardian:
        if payload.guardian.version is not None and guardian.version != payload.guardian.version:
            raise HTTPException(status_code=409, detail="Guardian profile version conflict")
        if payload.guardian.full_name is not None:
            guardian.full_name = payload.guardian.full_name
        if payload.guardian.email is not None:
            guardian.email = payload.guardian.email
        if payload.guardian.phone is not None:
            guardian.phone = payload.guardian.phone
        if payload.guardian.address_line is not None:
            guardian.address_line = payload.guardian.address_line
        if payload.guardian.city is not None:
            guardian.city = payload.guardian.city
        if payload.guardian.postal_code is not None:
            guardian.postal_code = payload.guardian.postal_code
        if payload.guardian.preferred_contact_channel is not None:
            try:
                guardian.preferred_contact_channel = ContactChannel(payload.guardian.preferred_contact_channel)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Invalid contact channel") from exc
        guardian.version = (guardian.version or 0) + 1
        guardian.updated_at = now

    if payload.child_contact:
        child_contact = db.execute(
            select(ChildContact).where(ChildContact.child_id == child.id)
        ).scalar_one_or_none()
        if not child_contact:
            child_contact = ChildContact(child_id=child.id)
            db.add(child_contact)
        if payload.child_contact.address_line is not None:
            child_contact.address_line = payload.child_contact.address_line
        if payload.child_contact.city is not None:
            child_contact.city = payload.child_contact.city
        if payload.child_contact.postal_code is not None:
            child_contact.postal_code = payload.child_contact.postal_code
        if payload.child_contact.school_name is not None:
            child_contact.school_name = payload.child_contact.school_name
        if payload.child_contact.class_name is not None:
            child_contact.class_name = payload.child_contact.class_name
        if payload.child_contact.registration_notes is not None:
            child_contact.registration_notes = payload.child_contact.registration_notes
        child_contact.updated_at = now

    db.commit()
    return get_patient_details(patient_id=patient_id, db=db, current_user=current_user)


@router.get("/patients/{patient_id}/appointments", response_model=List[AppointmentItem])
def get_patient_appointments(
    patient_id: UUID,
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    doctor_id: Optional[UUID] = Query(default=None),
    status: Optional[AppointmentStatus] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[AppointmentItem]:
    doctor = _ensure_patient_access(db, current_user, patient_id)
    stmt = select(Appointment).where(Appointment.child_id == patient_id)
    if doctor:
        stmt = stmt.where(Appointment.doctor_id == doctor.id)
    if start_date:
        stmt = stmt.where(Appointment.start_at >= dt.datetime.combine(start_date, dt.time.min, tzinfo=dt.timezone.utc))
    if end_date:
        stmt = stmt.where(Appointment.start_at <= dt.datetime.combine(end_date, dt.time.max, tzinfo=dt.timezone.utc))
    if doctor_id:
        stmt = stmt.where(Appointment.doctor_id == doctor_id)
    if status:
        stmt = stmt.where(Appointment.status == status)

    appointments = db.execute(stmt.order_by(Appointment.start_at.desc())).scalars().all()
    return [
        AppointmentItem(
            id=appt.id,
            doctor_id=appt.doctor_id,
            service_id=appt.service_id,
            status=appt.status.value,
            start_at=appt.start_at,
            end_at=appt.end_at,
        )
        for appt in appointments
    ]


@router.get("/appointments/{appointment_id}", response_model=AppointmentDetails)
def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> AppointmentDetails:
    appointment = db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    ).scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    _ensure_appointment_access(db, current_user, appointment)

    return AppointmentDetails(
        id=appointment.id,
        doctor_id=appointment.doctor_id,
        service_id=appointment.service_id,
        guardian_id=appointment.guardian_id,
        child_id=appointment.child_id,
        status=appointment.status.value,
        start_at=appointment.start_at,
        end_at=appointment.end_at,
        buffer_minutes=appointment.buffer_minutes,
        price_amount=float(appointment.price_amount),
        currency=appointment.currency,
        notes=appointment.notes,
        cancelled_at=appointment.cancelled_at,
        cancellation_reason=appointment.cancellation_reason,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
    )


@router.get("/doctor/appointments", response_model=List[DoctorAppointmentItem])
def get_doctor_appointments(
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    status: Optional[AppointmentStatus] = Query(default=None),
    doctor_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[DoctorAppointmentItem]:
    resolved_doctor_id: UUID | None = None
    if current_user.role in {UserRole.DOCTOR, UserRole.THERAPIST}:
        resolved_doctor_id = _get_doctor_for_user(db, current_user).id
    elif doctor_id:
        resolved_doctor_id = doctor_id

    if not resolved_doctor_id:
        raise HTTPException(status_code=400, detail="Doctor id is required")

    stmt = (
        select(Appointment, ChildProfile, Service)
        .join(ChildProfile, ChildProfile.id == Appointment.child_id)
        .join(Service, Service.id == Appointment.service_id)
        .where(Appointment.doctor_id == resolved_doctor_id)
    )
    if start_date:
        stmt = stmt.where(Appointment.start_at >= dt.datetime.combine(start_date, dt.time.min, tzinfo=dt.timezone.utc))
    if end_date:
        stmt = stmt.where(Appointment.start_at <= dt.datetime.combine(end_date, dt.time.max, tzinfo=dt.timezone.utc))
    if status:
        stmt = stmt.where(Appointment.status == status)

    rows = db.execute(stmt.order_by(Appointment.start_at.asc()).limit(limit)).all()
    return [
        DoctorAppointmentItem(
            id=appointment.id,
            child_id=child.id,
            child_name=f"{child.first_name} {child.last_name}".strip(),
            record_code=PatientCode.format(child.mrn_number),
            service_id=service.id,
            service_name=service.name,
            status=appointment.status.value,
            start_at=appointment.start_at,
            end_at=appointment.end_at,
        )
        for appointment, child, service in rows
    ]


@router.get("/patients/{patient_id}/encounters", response_model=List[EncounterItem])
def get_patient_encounters(
    patient_id: UUID,
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    doctor_id: Optional[UUID] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[EncounterItem]:
    doctor = _ensure_patient_access(db, current_user, patient_id)
    stmt = select(Encounter).where(Encounter.child_id == patient_id)
    if doctor:
        stmt = stmt.where(Encounter.doctor_id == doctor.id)
    if start_date:
        stmt = stmt.where(Encounter.created_at >= dt.datetime.combine(start_date, dt.time.min, tzinfo=dt.timezone.utc))
    if end_date:
        stmt = stmt.where(Encounter.created_at <= dt.datetime.combine(end_date, dt.time.max, tzinfo=dt.timezone.utc))
    if doctor_id:
        stmt = stmt.where(Encounter.doctor_id == doctor_id)

    encounters = db.execute(stmt.order_by(Encounter.created_at.desc())).scalars().all()
    return [
        EncounterItem(
            id=encounter.id,
            appointment_id=encounter.appointment_id,
            doctor_id=encounter.doctor_id,
            status=encounter.status.value,
            started_at=encounter.started_at,
            ended_at=encounter.ended_at,
            created_at=encounter.created_at,
        )
        for encounter in encounters
    ]


@router.get("/encounters/{encounter_id}", response_model=EncounterDetails)
def get_encounter(
    encounter_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> EncounterDetails:
    encounter = db.execute(select(Encounter).where(Encounter.id == encounter_id)).scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    _ensure_encounter_access(db, current_user, encounter)

    return EncounterDetails(
        id=encounter.id,
        appointment_id=encounter.appointment_id,
        doctor_id=encounter.doctor_id,
        guardian_id=encounter.guardian_id,
        child_id=encounter.child_id,
        status=encounter.status.value,
        started_at=encounter.started_at,
        ended_at=encounter.ended_at,
        created_at=encounter.created_at,
        updated_at=encounter.updated_at,
    )


@router.get("/patients/{patient_id}/prescriptions", response_model=List[PrescriptionListItem])
def get_patient_prescriptions(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[PrescriptionListItem]:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    prescriptions = db.execute(
        select(Prescription)
        .where(Prescription.child_id == patient_id)
        .order_by(Prescription.issued_at.desc())
    ).scalars().all()

    return [
        PrescriptionListItem(
            id=prescription.id,
            appointment_id=prescription.appointment_id,
            doctor_id=prescription.doctor_id,
            child_id=prescription.child_id,
            code=prescription.code,
            issued_at=prescription.issued_at,
            expires_at=prescription.expires_at,
        )
        for prescription in prescriptions
    ]


@router.get("/patients/{patient_id}/invoices", response_model=List[InvoiceListItem])
def get_patient_invoices(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[InvoiceListItem]:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    invoices = db.execute(
        select(Invoice)
        .where(Invoice.guardian_id == child.guardian_id)
        .order_by(Invoice.issued_at.desc())
    ).scalars().all()

    return [
        InvoiceListItem(
            id=invoice.id,
            appointment_id=invoice.appointment_id,
            guardian_id=invoice.guardian_id,
            number=invoice.number,
            status=invoice.status.value,
            issued_at=invoice.issued_at,
            due_at=invoice.due_at,
            paid_at=invoice.paid_at,
            total_amount=float(invoice.total_amount),
            currency=invoice.currency,
        )
        for invoice in invoices
    ]


@router.get("/patients/{patient_id}/attachments", response_model=List[AttachmentItem])
def get_patient_attachments(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> List[AttachmentItem]:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    encounter_ids = select(Encounter.id).where(Encounter.child_id == patient_id)
    note_ids = select(ClinicalNote.id).where(ClinicalNote.encounter_id.in_(encounter_ids))

    attachments = db.execute(
        select(Attachment)
        .where(
            or_(
                Attachment.child_id == patient_id,
                Attachment.encounter_id.in_(encounter_ids),
                Attachment.note_id.in_(note_ids),
            )
        )
        .order_by(Attachment.created_at.desc())
    ).scalars().all()

    return [
        AttachmentItem(
            id=attachment.id,
            child_id=attachment.child_id,
            encounter_id=attachment.encounter_id,
            note_id=attachment.note_id,
            file_name=attachment.file_name,
            mime_type=attachment.mime_type,
            size_bytes=attachment.size_bytes,
            created_at=attachment.created_at,
        )
        for attachment in attachments
    ]


@router.post("/patients/{patient_id}/attachments", response_model=AttachmentItem, status_code=201)
def upload_patient_attachment(
    patient_id: UUID,
    file: UploadFile = File(...),
    encounter_id: UUID | None = Form(default=None),
    note_id: UUID | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> AttachmentItem:
    child = db.execute(select(ChildProfile).where(ChildProfile.id == patient_id)).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")

    _ensure_patient_access(db, current_user, child.id)

    if encounter_id:
        encounter = db.execute(
            select(Encounter).where(
                Encounter.id == encounter_id,
                Encounter.child_id == patient_id,
            )
        ).scalar_one_or_none()
        if not encounter:
            raise HTTPException(status_code=400, detail="Encounter not linked to patient")

    if note_id:
        note = db.execute(select(ClinicalNote).where(ClinicalNote.id == note_id)).scalar_one_or_none()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        note_encounter = db.execute(
            select(Encounter).where(
                Encounter.id == note.encounter_id,
                Encounter.child_id == patient_id,
            )
        ).scalar_one_or_none()
        if not note_encounter:
            raise HTTPException(status_code=400, detail="Note not linked to patient")
        if encounter_id and note.encounter_id != encounter_id:
            raise HTTPException(status_code=400, detail="Note does not match encounter")

    attachment_id = uuid.uuid4()
    storage_key, size_bytes = save_upload(file, attachment_id)
    attachment = Attachment(
        id=attachment_id,
        child_id=patient_id,
        encounter_id=encounter_id,
        note_id=note_id,
        uploaded_by_user_id=current_user.id,
        file_name=file.filename or "upload.bin",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        storage_key=storage_key,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return AttachmentItem(
        id=attachment.id,
        child_id=attachment.child_id,
        encounter_id=attachment.encounter_id,
        note_id=attachment.note_id,
        file_name=attachment.file_name,
        mime_type=attachment.mime_type,
        size_bytes=attachment.size_bytes,
        created_at=attachment.created_at,
    )


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> FileResponse:
    attachment = db.execute(
        select(Attachment).where(Attachment.id == attachment_id)
    ).scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    child_id = _resolve_attachment_child_id(db, attachment)
    if not child_id:
        raise HTTPException(status_code=404, detail="Attachment target not found")

    _ensure_patient_access(db, current_user, child_id)

    try:
        path = resolve_storage_path(attachment.storage_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid storage key") from exc

    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path, media_type=attachment.mime_type, filename=attachment.file_name)


@router.post("/encounters/{encounter_id}/notes", response_model=NoteDetails, status_code=201)
def create_note(
    encounter_id: UUID,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> NoteDetails:
    _ensure_clinical_access(current_user)
    encounter = db.execute(select(Encounter).where(Encounter.id == encounter_id)).scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    _ensure_encounter_access(db, current_user, encounter)

    existing_note = db.execute(
        select(ClinicalNote).where(ClinicalNote.encounter_id == encounter_id)
    ).scalar_one_or_none()
    if existing_note:
        raise HTTPException(status_code=409, detail="Note already exists")

    author_user_id = payload.author_user_id
    if author_user_id is None:
        doctor = db.execute(select(Doctor).where(Doctor.id == encounter.doctor_id)).scalar_one_or_none()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor not found for encounter")
        author_user_id = doctor.user_id

    note = ClinicalNote(
        encounter_id=encounter_id,
        author_user_id=author_user_id,
        is_visible_to_guardian=payload.is_visible_to_guardian,
        status="DRAFT",
        version=1,
    )
    db.add(note)
    db.flush()

    version = NoteVersion(
        note_id=note.id,
        version_number=1,
        is_addendum=False,
        history_text=payload.history_text,
        diagnosis_text=payload.diagnosis_text,
        recommendations_text=payload.recommendations_text,
        therapy_plan_text=payload.therapy_plan_text,
        guardian_summary_text=payload.guardian_summary_text,
        created_by_user_id=author_user_id,
    )
    db.add(version)
    db.commit()
    db.refresh(note)
    db.refresh(version)

    return _note_to_details(note, version)


@router.patch("/notes/{note_id}", response_model=NoteDetails)
def update_note(
    note_id: UUID,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> NoteDetails:
    _ensure_clinical_access(current_user)
    note = db.execute(select(ClinicalNote).where(ClinicalNote.id == note_id)).scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    encounter = db.execute(select(Encounter).where(Encounter.id == note.encounter_id)).scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    _ensure_encounter_access(db, current_user, encounter)

    if _note_status_value(note) != NoteStatus.DRAFT.value:
        raise HTTPException(status_code=409, detail="Note is signed")

    version_number = note.version + 1
    updated_by_user_id = payload.updated_by_user_id or note.author_user_id

    note.version = version_number
    if payload.is_visible_to_guardian is not None:
        note.is_visible_to_guardian = payload.is_visible_to_guardian
    note.updated_at = dt.datetime.now(dt.timezone.utc)

    version = NoteVersion(
        note_id=note.id,
        version_number=version_number,
        is_addendum=False,
        history_text=payload.history_text,
        diagnosis_text=payload.diagnosis_text,
        recommendations_text=payload.recommendations_text,
        therapy_plan_text=payload.therapy_plan_text,
        guardian_summary_text=payload.guardian_summary_text,
        created_by_user_id=updated_by_user_id,
    )
    db.add(version)
    db.commit()
    db.refresh(note)
    db.refresh(version)

    return _note_to_details(note, version)


@router.post("/notes/{note_id}/sign", response_model=NoteDetails)
def sign_note(
    note_id: UUID,
    payload: NoteSign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> NoteDetails:
    _ensure_clinical_access(current_user)
    note = db.execute(select(ClinicalNote).where(ClinicalNote.id == note_id)).scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    encounter = db.execute(select(Encounter).where(Encounter.id == note.encounter_id)).scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    _ensure_encounter_access(db, current_user, encounter)

    if _note_status_value(note) != NoteStatus.DRAFT.value:
        raise HTTPException(status_code=409, detail="Note already signed")

    note.status = NoteStatus.SIGNED
    note.signed_at = dt.datetime.now(dt.timezone.utc)
    note.signed_by_user_id = payload.signed_by_user_id or note.author_user_id
    note.updated_at = note.signed_at

    latest_version = db.execute(
        select(NoteVersion)
        .where(NoteVersion.note_id == note.id)
        .order_by(NoteVersion.version_number.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not latest_version:
        raise HTTPException(status_code=400, detail="Note version missing")

    db.commit()
    db.refresh(note)
    db.refresh(latest_version)

    return _note_to_details(note, latest_version)


@router.post("/notes/{note_id}/addendum", response_model=NoteDetails)
def add_note_addendum(
    note_id: UUID,
    payload: NoteAddendum,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_user),
) -> NoteDetails:
    _ensure_clinical_access(current_user)
    note = db.execute(select(ClinicalNote).where(ClinicalNote.id == note_id)).scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    encounter = db.execute(select(Encounter).where(Encounter.id == note.encounter_id)).scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    _ensure_encounter_access(db, current_user, encounter)

    if _note_status_value(note) != NoteStatus.SIGNED.value:
        raise HTTPException(status_code=409, detail="Note must be signed before addendum")

    version_number = note.version + 1
    created_by_user_id = payload.created_by_user_id or note.signed_by_user_id or note.author_user_id

    note.version = version_number
    note.updated_at = dt.datetime.now(dt.timezone.utc)

    version = NoteVersion(
        note_id=note.id,
        version_number=version_number,
        is_addendum=True,
        history_text=payload.history_text,
        diagnosis_text=payload.diagnosis_text,
        recommendations_text=payload.recommendations_text,
        therapy_plan_text=payload.therapy_plan_text,
        guardian_summary_text=payload.guardian_summary_text,
        created_by_user_id=created_by_user_id,
    )
    db.add(version)
    db.commit()
    db.refresh(note)
    db.refresh(version)

    return _note_to_details(note, version)

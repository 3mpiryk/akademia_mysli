import datetime as dt
import uuid
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_guardian_user
from app.db.enums import AppointmentStatus
from app.db.models import (
    Appointment,
    Attachment,
    AuthorizedPerson,
    ChildContact,
    ChildProfile,
    ClinicalNote,
    Consent,
    EmergencyContact,
    Encounter,
    GuardianContact,
    Invoice,
    PatientProfile,
    Prescription,
    User,
)
from app.schemas.patients import (
    AppointmentItem,
    AttachmentItem,
    AuthorizedPersonDetails,
    ChildContactDetails,
    ConsentDetails,
    EmergencyContactDetails,
    EncounterItem,
    GuardianContactDetails,
    GuardianSummary,
    InvoiceListItem,
    PatientDetails,
    PatientSummary,
    PrescriptionListItem,
)
from app.schemas.onboarding import PatientOnboardingRequest, PatientOnboardingResponse
from app.services.patient_onboarding_service import PatientOnboardingService
from app.utils.patient_code import PatientCode
from app.utils.storage import resolve_storage_path, save_upload

router = APIRouter(prefix="/patient", tags=["patient"])


def calculate_age(date_of_birth: dt.date) -> int:
    today = dt.date.today()
    years = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return max(years, 0)


def _get_guardian_profile(db: Session, current_user: User) -> PatientProfile:
    guardian = db.execute(
        select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    ).scalar_one_or_none()
    if not guardian:
        raise HTTPException(status_code=403, detail="Guardian profile not found")
    return guardian


def _get_child_for_guardian(db: Session, guardian_id: UUID, child_id: UUID) -> ChildProfile:
    child = db.execute(
        select(ChildProfile).where(
            ChildProfile.id == child_id,
            ChildProfile.guardian_id == guardian_id,
        )
    ).scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Patient not found")
    return child


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


@router.post("/onboarding", response_model=PatientOnboardingResponse, status_code=201)
def patient_onboarding(
    payload: PatientOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> PatientOnboardingResponse:
    service = PatientOnboardingService(db)
    child, record_code = service.create_guardian_with_child(user=current_user, payload=payload)
    return PatientOnboardingResponse(child_id=child.id, record_code=record_code)


@router.get("/children/{child_id}/summary", response_model=PatientSummary)
def get_child_summary(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> PatientSummary:
    guardian = _get_guardian_profile(db, current_user)
    child = _get_child_for_guardian(db, guardian.id, child_id)

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


@router.get("/children/{child_id}/details", response_model=PatientDetails)
def get_child_details(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> PatientDetails:
    guardian = _get_guardian_profile(db, current_user)
    child = _get_child_for_guardian(db, guardian.id, child_id)

    child_contact = db.execute(
        select(ChildContact).where(ChildContact.child_id == child.id)
    ).scalar_one_or_none()

    guardian_contacts = db.execute(
        select(GuardianContact).where(GuardianContact.guardian_id == guardian.id)
    ).scalars().all()

    emergency_contacts = db.execute(
        select(EmergencyContact).where(EmergencyContact.child_id == child.id)
    ).scalars().all()

    consents = db.execute(select(Consent).where(Consent.child_id == child.id)).scalars().all()

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
        )
        if child_contact
        else None,
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


@router.get("/children/{child_id}/appointments", response_model=List[AppointmentItem])
def get_child_appointments(
    child_id: UUID,
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    status: Optional[AppointmentStatus] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> List[AppointmentItem]:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    stmt = select(Appointment).where(
        Appointment.child_id == child_id,
        Appointment.guardian_id == guardian.id,
    )
    if start_date:
        stmt = stmt.where(
            Appointment.start_at >= dt.datetime.combine(start_date, dt.time.min, tzinfo=dt.timezone.utc)
        )
    if end_date:
        stmt = stmt.where(
            Appointment.start_at <= dt.datetime.combine(end_date, dt.time.max, tzinfo=dt.timezone.utc)
        )
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


@router.get("/children/{child_id}/encounters", response_model=List[EncounterItem])
def get_child_encounters(
    child_id: UUID,
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> List[EncounterItem]:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    stmt = select(Encounter).where(
        Encounter.child_id == child_id,
        Encounter.guardian_id == guardian.id,
    )
    if start_date:
        stmt = stmt.where(
            Encounter.created_at >= dt.datetime.combine(start_date, dt.time.min, tzinfo=dt.timezone.utc)
        )
    if end_date:
        stmt = stmt.where(
            Encounter.created_at <= dt.datetime.combine(end_date, dt.time.max, tzinfo=dt.timezone.utc)
        )

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


@router.get("/children/{child_id}/prescriptions", response_model=List[PrescriptionListItem])
def get_child_prescriptions(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> List[PrescriptionListItem]:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    prescriptions = db.execute(
        select(Prescription)
        .where(Prescription.child_id == child_id)
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


@router.get("/children/{child_id}/invoices", response_model=List[InvoiceListItem])
def get_child_invoices(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> List[InvoiceListItem]:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    invoices = db.execute(
        select(Invoice)
        .where(Invoice.guardian_id == guardian.id)
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


@router.get("/children/{child_id}/attachments", response_model=List[AttachmentItem])
def get_child_attachments(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> List[AttachmentItem]:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    encounter_ids = select(Encounter.id).where(Encounter.child_id == child_id)
    note_ids = select(ClinicalNote.id).where(ClinicalNote.encounter_id.in_(encounter_ids))

    attachments = db.execute(
        select(Attachment)
        .where(
            or_(
                Attachment.child_id == child_id,
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


@router.post("/children/{child_id}/attachments", response_model=AttachmentItem, status_code=201)
def upload_child_attachment(
    child_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> AttachmentItem:
    guardian = _get_guardian_profile(db, current_user)
    _get_child_for_guardian(db, guardian.id, child_id)

    attachment_id = uuid.uuid4()
    storage_key, size_bytes = save_upload(file, attachment_id)
    attachment = Attachment(
        id=attachment_id,
        child_id=child_id,
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
def download_child_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_guardian_user),
) -> FileResponse:
    guardian = _get_guardian_profile(db, current_user)
    attachment = db.execute(
        select(Attachment).where(Attachment.id == attachment_id)
    ).scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    child_id = _resolve_attachment_child_id(db, attachment)
    if not child_id:
        raise HTTPException(status_code=404, detail="Attachment target not found")

    _get_child_for_guardian(db, guardian.id, child_id)

    try:
        path = resolve_storage_path(attachment.storage_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid storage key") from exc

    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path, media_type=attachment.mime_type, filename=attachment.file_name)

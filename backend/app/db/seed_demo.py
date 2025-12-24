import datetime as dt
import os
from decimal import Decimal

from sqlalchemy import select

from .enums import (
    AppointmentSource,
    AppointmentStatus,
    ConsentType,
    ContactChannel,
    EncounterStatus,
    Gender,
    InvoiceStatus,
    UserRole,
)
from .models import (
    Appointment,
    Attachment,
    AuthorizedPerson,
    ChildContact,
    ChildProfile,
    Consent,
    Doctor,
    EmergencyContact,
    Encounter,
    GuardianContact,
    Invoice,
    InvoiceItem,
    PatientProfile,
    Prescription,
    PrescriptionItem,
    Service,
    User,
)
from .seed_services import seed_services
from .session import SessionLocal
from app.core.security import get_password_hash


def _get_or_create_user(
    session,
    email: str,
    role: UserRole,
    phone: str | None = None,
    password: str | None = None,
) -> User:
    resolved_password = password or "demo123"
    password_hash = get_password_hash(resolved_password)
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            hashed_password=password_hash,
            role=role,
            is_active=True,
            is_verified=True,
            phone=phone,
        )
        session.add(user)
        session.flush()
    else:
        user.hashed_password = password_hash
    return user


def seed_demo() -> None:
    session = SessionLocal()
    try:
        seed_services()

        service = session.execute(
            select(Service).where(Service.name == "Psychoterapia")
        ).scalar_one_or_none()
        if not service:
            service = session.execute(select(Service).order_by(Service.name)).scalar_one_or_none()
        if not service:
            raise RuntimeError("No services available; run seed_services first.")

        guardian_user = _get_or_create_user(
            session,
            "demo.opiekun@akademia-mysli.local",
            UserRole.GUARDIAN,
            phone="500600700",
        )
        doctor_user = _get_or_create_user(
            session,
            "demo.lekarz@akademia-mysli.local",
            UserRole.DOCTOR,
            phone="500600701",
        )
        admin_email = os.getenv("DEMO_ADMIN_EMAIL")
        admin_password = os.getenv("DEMO_ADMIN_PASSWORD")
        if admin_email and admin_password:
            _get_or_create_user(
                session,
                admin_email,
                UserRole.ADMIN,
                password=admin_password,
            )

        guardian = session.execute(
            select(PatientProfile).where(PatientProfile.user_id == guardian_user.id)
        ).scalar_one_or_none()
        if not guardian:
            guardian = PatientProfile(
                user_id=guardian_user.id,
                full_name="Jan Kowalski",
                email=guardian_user.email,
                phone=guardian_user.phone,
                city="Gdansk",
                address_line="ul. Testowa 1",
                postal_code="80-001",
            )
            session.add(guardian)
            session.flush()

        doctor = session.execute(
            select(Doctor).where(Doctor.user_id == doctor_user.id)
        ).scalar_one_or_none()
        if not doctor:
            doctor = Doctor(
                user_id=doctor_user.id,
                specialization="Psychiatria dzieci i mlodziezy",
            )
            session.add(doctor)
            session.flush()

        child = session.execute(
            select(ChildProfile).where(
                ChildProfile.guardian_id == guardian.id,
                ChildProfile.first_name == "Ola",
                ChildProfile.last_name == "Kowalska",
                ChildProfile.date_of_birth == dt.date(2015, 5, 10),
            )
        ).scalar_one_or_none()
        if not child:
            child = ChildProfile(
                guardian_id=guardian.id,
                first_name="Ola",
                last_name="Kowalska",
                date_of_birth=dt.date(2015, 5, 10),
                gender=Gender.FEMALE,
                mrn="AM-DEMO-0001",
            )
            session.add(child)
            session.flush()
        elif not child.mrn:
            child.mrn = "AM-DEMO-0001"

        child_contact = session.execute(
            select(ChildContact).where(ChildContact.child_id == child.id)
        ).scalar_one_or_none()
        if not child_contact:
            session.add(
                ChildContact(
                    child_id=child.id,
                    address_line="ul. Testowa 1",
                    city="Gdansk",
                    postal_code="80-001",
                    school_name="SP nr 1",
                    class_name="4A",
                    registration_notes="Profil demo",
                )
            )

        for channel, value, is_primary in [
            (ContactChannel.EMAIL, guardian.email or guardian_user.email, True),
            (ContactChannel.PHONE, guardian.phone or "500600700", False),
        ]:
            existing = session.execute(
                select(GuardianContact).where(
                    GuardianContact.guardian_id == guardian.id,
                    GuardianContact.channel == channel,
                    GuardianContact.value == value,
                )
            ).scalar_one_or_none()
            if not existing:
                session.add(
                    GuardianContact(
                        guardian_id=guardian.id,
                        channel=channel,
                        value=value,
                        is_primary=is_primary,
                        is_verified=True,
                    )
                )

        emergency = session.execute(
            select(EmergencyContact).where(
                EmergencyContact.child_id == child.id,
                EmergencyContact.phone == "600700800",
            )
        ).scalar_one_or_none()
        if not emergency:
            session.add(
                EmergencyContact(
                    child_id=child.id,
                    full_name="Anna Kowalska",
                    relation="Ciocia",
                    phone="600700800",
                )
            )

        for consent_type in [ConsentType.RODO, ConsentType.GUARDIAN]:
            existing = session.execute(
                select(Consent).where(
                    Consent.guardian_id == guardian.id,
                    Consent.child_id == child.id,
                    Consent.consent_type == consent_type,
                )
            ).scalar_one_or_none()
            if not existing:
                session.add(
                    Consent(
                        guardian_id=guardian.id,
                        child_id=child.id,
                        consent_type=consent_type,
                    )
                )

        authorized = session.execute(
            select(AuthorizedPerson).where(
                AuthorizedPerson.child_id == child.id,
                AuthorizedPerson.full_name == "Piotr Kowalski",
            )
        ).scalar_one_or_none()
        if not authorized:
            session.add(
                AuthorizedPerson(
                    child_id=child.id,
                    guardian_id=guardian.id,
                    full_name="Piotr Kowalski",
                    relation="Ojciec",
                    phone="700800900",
                    email="piotr.kowalski@example.com",
                    scope="Kontakt w sprawie wizyt",
                )
            )

        start_at = dt.datetime(2025, 6, 15, 9, 0, tzinfo=dt.timezone.utc)
        appointment = session.execute(
            select(Appointment).where(
                Appointment.child_id == child.id,
                Appointment.guardian_id == guardian.id,
                Appointment.start_at == start_at,
            )
        ).scalar_one_or_none()
        if not appointment:
            appointment = Appointment(
                doctor_id=doctor.id,
                service_id=service.id,
                guardian_id=guardian.id,
                child_id=child.id,
                status=AppointmentStatus.CONFIRMED,
                source=AppointmentSource.ONLINE,
                start_at=start_at,
                end_at=start_at + dt.timedelta(minutes=service.default_duration_minutes),
                price_amount=Decimal(service.default_price),
                notes="Wizyta demo",
            )
            session.add(appointment)
            session.flush()

        encounter = session.execute(
            select(Encounter).where(Encounter.appointment_id == appointment.id)
        ).scalar_one_or_none()
        if not encounter:
            encounter = Encounter(
                appointment_id=appointment.id,
                doctor_id=doctor.id,
                guardian_id=guardian.id,
                child_id=child.id,
                status=EncounterStatus.OPEN,
                started_at=start_at,
            )
            session.add(encounter)
            session.flush()

        prescription_code = f"RX-DEMO-{child.id.hex[:6]}"
        prescription = session.execute(
            select(Prescription).where(Prescription.code == prescription_code)
        ).scalar_one_or_none()
        if not prescription:
            prescription = Prescription(
                appointment_id=appointment.id,
                doctor_id=doctor.id,
                child_id=child.id,
                code=prescription_code,
                issued_at=start_at,
                expires_at=start_at + dt.timedelta(days=30),
            )
            session.add(prescription)
            session.flush()
            session.add(
                PrescriptionItem(
                    prescription_id=prescription.id,
                    medication_name="Syrop demo",
                    dosage="2x dziennie",
                    instructions="Po posilku",
                    quantity="1 op.",
                )
            )

        invoice_number = f"FV/DEMO/{guardian.id.hex[:6]}"
        invoice = session.execute(
            select(Invoice).where(Invoice.number == invoice_number)
        ).scalar_one_or_none()
        if not invoice:
            invoice = Invoice(
                appointment_id=appointment.id,
                guardian_id=guardian.id,
                number=invoice_number,
                status=InvoiceStatus.UNPAID,
                issued_at=start_at,
                due_at=start_at + dt.timedelta(days=7),
                total_amount=Decimal(service.default_price),
                currency="PLN",
            )
            session.add(invoice)
            session.flush()
            session.add(
                InvoiceItem(
                    invoice_id=invoice.id,
                    service_id=service.id,
                    description=service.name,
                    quantity=1,
                    unit_price=Decimal(service.default_price),
                    amount=Decimal(service.default_price),
                )
            )

        attachment_key = f"demo/{child.id.hex}/attachment-1.pdf"
        attachment = session.execute(
            select(Attachment).where(Attachment.storage_key == attachment_key)
        ).scalar_one_or_none()
        if not attachment:
            session.add(
                Attachment(
                    child_id=child.id,
                    uploaded_by_user_id=doctor_user.id,
                    file_name="skan_wizyty.pdf",
                    mime_type="application/pdf",
                    size_bytes=12345,
                    storage_key=attachment_key,
                )
            )

        session.commit()

        print("Seed demo OK")
        print(f"Guardian user id: {guardian_user.id} ({guardian_user.email})")
        print(f"Doctor user id: {doctor_user.id} ({doctor_user.email})")
        print(f"Child id: {child.id}")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_demo()

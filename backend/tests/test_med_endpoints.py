import datetime as dt
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
import sqlalchemy as sa

if not os.getenv("DATABASE_URL"):
    pytest.skip("DATABASE_URL not set", allow_module_level=True)

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import app
from app.core.security import get_password_hash
from app.db.enums import (
    AppointmentSource,
    AppointmentStatus,
    EncounterStatus,
    Gender,
    InvoiceStatus,
    ServiceType,
    UserRole,
)
from app.db.models import (
    Appointment,
    Attachment,
    ChildProfile,
    ClinicalNote,
    Doctor,
    Encounter,
    Invoice,
    NoteVersion,
    PatientProfile,
    Prescription,
    Service,
    User,
)
from app.db.session import SessionLocal
from app.utils.storage import resolve_storage_path


def _create_seed_data():
    now = dt.datetime.now(dt.timezone.utc)
    guardian_user_id = uuid.uuid4()
    doctor_user_id = uuid.uuid4()
    guardian_id = uuid.uuid4()
    child_id = uuid.uuid4()
    doctor_id = uuid.uuid4()
    service_id = uuid.uuid4()
    appointment_id = uuid.uuid4()
    encounter_id = uuid.uuid4()
    prescription_id = uuid.uuid4()
    invoice_id = uuid.uuid4()
    attachment_id = uuid.uuid4()

    guardian_email = f"guardian_{guardian_user_id.hex}@example.com"
    doctor_email = f"doctor_{doctor_user_id.hex}@example.com"
    service_name = f"Test Service {service_id.hex}"

    guardian_user = User(
        id=guardian_user_id,
        email=guardian_email,
        hashed_password=get_password_hash("demo123"),
        role=UserRole.GUARDIAN,
    )
    doctor_user = User(
        id=doctor_user_id,
        email=doctor_email,
        hashed_password=get_password_hash("demo123"),
        role=UserRole.DOCTOR,
    )
    guardian = PatientProfile(
        id=guardian_id,
        user_id=guardian_user_id,
        full_name="Jan Kowalski",
        email=guardian_email,
        phone="500600700",
    )
    child = ChildProfile(
        id=child_id,
        guardian_id=guardian_id,
        first_name="Ola",
        last_name="Kowalska",
        date_of_birth=dt.date(2015, 5, 10),
        gender=Gender.FEMALE,
    )
    doctor = Doctor(
        id=doctor_id,
        user_id=doctor_user_id,
        specialization="Psychiatria dzieci i młodzieży",
    )
    service = Service(
        id=service_id,
        name=service_name,
        description="Testowa usługa diagnostyczna.",
        service_type=ServiceType.INDIVIDUAL,
        default_duration_minutes=50,
        default_price=Decimal("150.00"),
        buffer_minutes_default=0,
    )
    appointment = Appointment(
        id=appointment_id,
        doctor_id=doctor_id,
        service_id=service_id,
        guardian_id=guardian_id,
        child_id=child_id,
        status=AppointmentStatus.CONFIRMED,
        source=AppointmentSource.ONLINE,
        start_at=now,
        end_at=now + dt.timedelta(minutes=50),
        price_amount=Decimal("150.00"),
    )
    encounter = Encounter(
        id=encounter_id,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        guardian_id=guardian_id,
        child_id=child_id,
        status=EncounterStatus.OPEN,
        started_at=now,
    )
    prescription = Prescription(
        id=prescription_id,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        child_id=child_id,
        code=f"RX-{prescription_id.hex[:8]}",
        issued_at=now,
        expires_at=now + dt.timedelta(days=30),
    )
    invoice = Invoice(
        id=invoice_id,
        appointment_id=appointment_id,
        guardian_id=guardian_id,
        number=f"FV/{now:%Y%m%d}/{invoice_id.hex[:6]}",
        status=InvoiceStatus.UNPAID,
        issued_at=now,
        due_at=now + dt.timedelta(days=7),
        total_amount=Decimal("150.00"),
        currency="PLN",
    )
    attachment = Attachment(
        id=attachment_id,
        child_id=child_id,
        uploaded_by_user_id=doctor_user_id,
        file_name="skan_wizyty.pdf",
        mime_type="application/pdf",
        size_bytes=12345,
        storage_key=f"attachments/{attachment_id.hex}.pdf",
    )

    return {
        "guardian_user": guardian_user,
        "doctor_user": doctor_user,
        "guardian": guardian,
        "child": child,
        "doctor": doctor,
        "service": service,
        "appointment": appointment,
        "encounter": encounter,
        "prescription": prescription,
        "invoice": invoice,
        "attachment": attachment,
    }


def test_med_patient_endpoints_smoke():
    client = TestClient(app)
    session = SessionLocal()
    data = _create_seed_data()
    try:
        session.add_all([data["guardian_user"], data["doctor_user"]])
        session.commit()

        session.add_all([data["guardian"], data["doctor"], data["service"]])
        session.commit()

        session.add(data["child"])
        session.commit()

        session.add_all([data["appointment"], data["encounter"]])
        session.commit()

        session.add_all([data["prescription"], data["invoice"], data["attachment"]])
        session.commit()

        patient_id = data["child"].id
        login_doctor = client.post(
            "/auth/login",
            json={"email": data["doctor_user"].email, "password": "demo123"},
        )
        assert login_doctor.status_code == 200
        doctor_token = login_doctor.json()["access_token"]
        headers = {"Authorization": f"Bearer {doctor_token}"}

        login_guardian = client.post(
            "/auth/login",
            json={"email": data["guardian_user"].email, "password": "demo123"},
        )
        assert login_guardian.status_code == 200
        guardian_token = login_guardian.json()["access_token"]
        guardian_headers = {"Authorization": f"Bearer {guardian_token}"}

        summary = client.get(f"/med/patients/{patient_id}/summary", headers=headers)
        assert summary.status_code == 200
        summary_payload = summary.json()
        assert summary_payload["id"] == str(patient_id)
        assert summary_payload["guardian"]["id"] == str(data["guardian"].id)
        lookup = client.get(
            f"/med/patients/lookup?code={summary_payload['record_code']}",
            headers=headers,
        )
        assert lookup.status_code == 200
        lookup_payload = lookup.json()
        assert lookup_payload["id"] == str(patient_id)
        search = client.get(
            f"/med/patients/search?query={data['child'].first_name}",
            headers=headers,
        )
        assert search.status_code == 200
        search_payload = search.json()
        assert any(item["id"] == str(patient_id) for item in search_payload)

        details = client.get(f"/med/patients/{patient_id}/details", headers=headers)
        assert details.status_code == 200
        details_payload = details.json()
        assert details_payload["guardian"]["id"] == str(data["guardian"].id)
        assert details_payload["guardian_contacts"] == []
        update_payload = {
            "child": {
                "last_name": "Kowalska-Nowak",
                "version": details_payload["child_version"],
            },
            "guardian": {
                "full_name": "Jan Nowak",
                "version": details_payload["guardian_version"],
            },
            "child_contact": {
                "city": "Gdynia",
                "postal_code": "81-001",
            },
        }
        update_details = client.patch(
            f"/med/patients/{patient_id}/details",
            json=update_payload,
            headers=headers,
        )
        assert update_details.status_code == 200
        updated_payload = update_details.json()
        assert updated_payload["last_name"] == "Kowalska-Nowak"
        assert updated_payload["guardian"]["full_name"] == "Jan Nowak"
        assert updated_payload["child_contact"]["city"] == "Gdynia"
        assert updated_payload["child_version"] == details_payload["child_version"] + 1
        assert updated_payload["guardian_version"] == details_payload["guardian_version"] + 1

        appointments = client.get(f"/med/patients/{patient_id}/appointments", headers=headers)
        assert appointments.status_code == 200
        appointments_payload = appointments.json()
        assert len(appointments_payload) == 1
        assert appointments_payload[0]["id"] == str(data["appointment"].id)

        appointment_details = client.get(
            f"/med/appointments/{data['appointment'].id}", headers=headers
        )
        assert appointment_details.status_code == 200
        appointment_payload = appointment_details.json()
        assert appointment_payload["id"] == str(data["appointment"].id)
        assert appointment_payload["guardian_id"] == str(data["guardian"].id)
        assert appointment_payload["child_id"] == str(data["child"].id)

        encounters = client.get(f"/med/patients/{patient_id}/encounters", headers=headers)
        assert encounters.status_code == 200
        encounters_payload = encounters.json()
        assert len(encounters_payload) == 1
        assert encounters_payload[0]["id"] == str(data["encounter"].id)

        prescriptions = client.get(f"/med/patients/{patient_id}/prescriptions", headers=headers)
        assert prescriptions.status_code == 200
        prescriptions_payload = prescriptions.json()
        assert len(prescriptions_payload) == 1
        assert prescriptions_payload[0]["id"] == str(data["prescription"].id)

        invoices = client.get(f"/med/patients/{patient_id}/invoices", headers=headers)
        assert invoices.status_code == 200
        invoices_payload = invoices.json()
        assert len(invoices_payload) == 1
        assert invoices_payload[0]["id"] == str(data["invoice"].id)

        attachments = client.get(f"/med/patients/{patient_id}/attachments", headers=headers)
        assert attachments.status_code == 200
        attachments_payload = attachments.json()
        assert len(attachments_payload) == 1
        assert attachments_payload[0]["id"] == str(data["attachment"].id)

        med_file_content = b"med-attachment"
        med_upload = client.post(
            f"/med/patients/{patient_id}/attachments",
            headers=headers,
            files={"file": ("skan_med.pdf", med_file_content, "application/pdf")},
        )
        assert med_upload.status_code == 201
        med_upload_data = med_upload.json()
        med_upload_id = med_upload_data["id"]
        med_download = client.get(f"/med/attachments/{med_upload_id}/download", headers=headers)
        assert med_download.status_code == 200
        assert med_download.content == med_file_content

        encounter_details = client.get(
            f"/med/encounters/{data['encounter'].id}", headers=headers
        )
        assert encounter_details.status_code == 200
        encounter_payload = encounter_details.json()
        assert encounter_payload["id"] == str(data["encounter"].id)
        assert encounter_payload["guardian_id"] == str(data["guardian"].id)

        note_payload = {
            "history_text": "Wywiad wstępny",
            "recommendations_text": "Zalecenia testowe",
            "is_visible_to_guardian": True,
        }
        note_response = client.post(
            f"/med/encounters/{data['encounter'].id}/notes", json=note_payload, headers=headers
        )
        assert note_response.status_code == 201
        note_data = note_response.json()
        assert note_data["status"] == "DRAFT"
        assert note_data["current_version"]["version_number"] == 1
        assert note_data["current_version"]["is_addendum"] is False

        note_id = note_data["id"]
        update_payload = {
            "history_text": "Wywiad uzupełniony",
            "diagnosis_text": "Rozpoznanie testowe",
            "is_visible_to_guardian": False,
        }
        update_response = client.patch(f"/med/notes/{note_id}", json=update_payload, headers=headers)
        assert update_response.status_code == 200
        update_data = update_response.json()
        assert update_data["status"] == "DRAFT"
        assert update_data["current_version"]["version_number"] == 2
        assert update_data["current_version"]["is_addendum"] is False

        sign_response = client.post(f"/med/notes/{note_id}/sign", json={}, headers=headers)
        assert sign_response.status_code == 200
        sign_data = sign_response.json()
        assert sign_data["status"] == "SIGNED"

        addendum_payload = {
            "recommendations_text": "Aneks zaleceń",
        }
        addendum_response = client.post(
            f"/med/notes/{note_id}/addendum", json=addendum_payload, headers=headers
        )
        assert addendum_response.status_code == 200
        addendum_data = addendum_response.json()
        assert addendum_data["status"] == "SIGNED"
        assert addendum_data["current_version"]["version_number"] == 3
        assert addendum_data["current_version"]["is_addendum"] is True

        guardian_summary = client.get(f"/patient/children/{patient_id}/summary", headers=guardian_headers)
        assert guardian_summary.status_code == 200
        guardian_summary_payload = guardian_summary.json()
        assert guardian_summary_payload["id"] == str(patient_id)

        guardian_details = client.get(f"/patient/children/{patient_id}/details", headers=guardian_headers)
        assert guardian_details.status_code == 200

        guardian_appointments = client.get(
            f"/patient/children/{patient_id}/appointments", headers=guardian_headers
        )
        assert guardian_appointments.status_code == 200
        guardian_appointments_payload = guardian_appointments.json()
        assert len(guardian_appointments_payload) == 1

        guardian_encounters = client.get(
            f"/patient/children/{patient_id}/encounters", headers=guardian_headers
        )
        assert guardian_encounters.status_code == 200
        guardian_encounters_payload = guardian_encounters.json()
        assert len(guardian_encounters_payload) == 1

        guardian_prescriptions = client.get(
            f"/patient/children/{patient_id}/prescriptions", headers=guardian_headers
        )
        assert guardian_prescriptions.status_code == 200
        guardian_prescriptions_payload = guardian_prescriptions.json()
        assert len(guardian_prescriptions_payload) == 1

        guardian_invoices = client.get(
            f"/patient/children/{patient_id}/invoices", headers=guardian_headers
        )
        assert guardian_invoices.status_code == 200
        guardian_invoices_payload = guardian_invoices.json()
        assert len(guardian_invoices_payload) == 1

        guardian_attachments = client.get(
            f"/patient/children/{patient_id}/attachments", headers=guardian_headers
        )
        assert guardian_attachments.status_code == 200
        guardian_attachments_payload = guardian_attachments.json()
        guardian_attachment_ids = {item["id"] for item in guardian_attachments_payload}
        assert str(data["attachment"].id) in guardian_attachment_ids
        assert med_upload_id in guardian_attachment_ids

        guardian_file_content = b"guardian-attachment"
        guardian_upload = client.post(
            f"/patient/children/{patient_id}/attachments",
            headers=guardian_headers,
            files={"file": ("zgoda.txt", guardian_file_content, "text/plain")},
        )
        assert guardian_upload.status_code == 201
        guardian_upload_data = guardian_upload.json()
        guardian_upload_id = guardian_upload_data["id"]
        guardian_download = client.get(
            f"/patient/attachments/{guardian_upload_id}/download", headers=guardian_headers
        )
        assert guardian_download.status_code == 200
        assert guardian_download.content == guardian_file_content
    finally:
        session.rollback()
        if "note_data" in locals():
            session.execute(sa.delete(NoteVersion).where(NoteVersion.note_id == note_data["id"]))
            session.execute(sa.delete(ClinicalNote).where(ClinicalNote.id == note_data["id"]))
        for attachment_id in [
            uuid.UUID(locals().get("med_upload_id")) if "med_upload_id" in locals() else None,
            uuid.UUID(locals().get("guardian_upload_id")) if "guardian_upload_id" in locals() else None,
        ]:
            if attachment_id:
                attachment_row = session.execute(
                    sa.select(Attachment).where(Attachment.id == attachment_id)
                ).scalar_one_or_none()
                if attachment_row:
                    try:
                        path = resolve_storage_path(attachment_row.storage_key)
                        if path.exists():
                            path.unlink()
                    except ValueError:
                        pass
                session.execute(sa.delete(Attachment).where(Attachment.id == attachment_id))
        session.execute(sa.delete(Attachment).where(Attachment.id == data["attachment"].id))
        session.execute(sa.delete(Prescription).where(Prescription.id == data["prescription"].id))
        session.execute(sa.delete(Invoice).where(Invoice.id == data["invoice"].id))
        session.execute(sa.delete(Encounter).where(Encounter.id == data["encounter"].id))
        session.execute(sa.delete(Appointment).where(Appointment.id == data["appointment"].id))
        session.execute(sa.delete(ChildProfile).where(ChildProfile.id == data["child"].id))
        session.execute(sa.delete(PatientProfile).where(PatientProfile.id == data["guardian"].id))
        session.execute(sa.delete(Doctor).where(Doctor.id == data["doctor"].id))
        session.execute(sa.delete(Service).where(Service.id == data["service"].id))
        session.execute(sa.delete(User).where(User.id == data["guardian_user"].id))
        session.execute(sa.delete(User).where(User.id == data["doctor_user"].id))
        session.commit()
        session.close()

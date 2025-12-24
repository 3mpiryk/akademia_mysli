import datetime as dt
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .enums import (
    AppointmentSource,
    AppointmentStatus,
    ContactChannel,
    ConsentType,
    EncounterStatus,
    Gender,
    InvoiceStatus,
    NoteStatus,
    NotificationChannel,
    NotificationStatus,
    ParticipantStatus,
    PatientStatus,
    ServiceType,
    UserRole,
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(sa.String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(sa.Enum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    is_verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    phone: Mapped[str | None] = mapped_column(sa.String(32))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    last_login_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(sa.String(255))
    phone: Mapped[str | None] = mapped_column(sa.String(32))
    address_line: Mapped[str | None] = mapped_column(sa.String(255))
    city: Mapped[str | None] = mapped_column(sa.String(120))
    postal_code: Mapped[str | None] = mapped_column(sa.String(20))
    preferred_contact_channel: Mapped[ContactChannel | None] = mapped_column(sa.Enum(ContactChannel, name="contact_channel"))
    billing_name: Mapped[str | None] = mapped_column(sa.String(200))
    billing_address_line: Mapped[str | None] = mapped_column(sa.String(255))
    billing_city: Mapped[str | None] = mapped_column(sa.String(120))
    billing_postal_code: Mapped[str | None] = mapped_column(sa.String(20))
    billing_tax_id: Mapped[str | None] = mapped_column(sa.String(32))
    version: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1")
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    first_name: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    date_of_birth: Mapped[dt.date] = mapped_column(sa.Date, nullable=False)
    pesel: Mapped[str | None] = mapped_column(sa.String(11), unique=True)
    mrn: Mapped[str | None] = mapped_column(sa.String(32), unique=True)
    mrn_number: Mapped[int] = mapped_column(sa.Integer, nullable=False, unique=True, server_default=sa.text("nextval('mrn_number_seq')"))
    gender: Mapped[Gender | None] = mapped_column(sa.Enum(Gender, name="gender"))
    status: Mapped[PatientStatus] = mapped_column(sa.Enum(PatientStatus, name="patient_status"), nullable=False, server_default="ACTIVE")
    tags: Mapped[dict | None] = mapped_column(JSONB)
    archived_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    version: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1")
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Consent(Base):
    __tablename__ = "consents"
    __table_args__ = (
        sa.UniqueConstraint("guardian_id", "child_id", "consent_type", name="uq_consents_guardian_child_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False)
    consent_type: Mapped[ConsentType] = mapped_column(sa.Enum(ConsentType, name="consent_type"), nullable=False)
    granted_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    revoked_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(sa.Text)


class GuardianContact(Base):
    __tablename__ = "guardian_contacts"
    __table_args__ = (
        sa.UniqueConstraint("guardian_id", "channel", "value", name="uq_guardian_contacts_value"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    channel: Mapped[ContactChannel] = mapped_column(sa.Enum(ContactChannel, name="contact_channel"), nullable=False)
    value: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    is_primary: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    is_verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class ChildContact(Base):
    __tablename__ = "child_contacts"
    __table_args__ = (
        sa.UniqueConstraint("child_id", name="uq_child_contacts_child"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False)
    address_line: Mapped[str | None] = mapped_column(sa.String(255))
    city: Mapped[str | None] = mapped_column(sa.String(120))
    postal_code: Mapped[str | None] = mapped_column(sa.String(20))
    school_name: Mapped[str | None] = mapped_column(sa.String(200))
    class_name: Mapped[str | None] = mapped_column(sa.String(120))
    registration_notes: Mapped[str | None] = mapped_column(sa.Text)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False)
    full_name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    relation: Mapped[str | None] = mapped_column(sa.String(120))
    phone: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class AuthorizedPerson(Base):
    __tablename__ = "authorized_people"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False)
    guardian_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="SET NULL"))
    full_name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    relation: Mapped[str | None] = mapped_column(sa.String(120))
    phone: Mapped[str | None] = mapped_column(sa.String(32))
    email: Mapped[str | None] = mapped_column(sa.String(255))
    scope: Mapped[str | None] = mapped_column(sa.Text)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        sa.CheckConstraint("buffer_minutes >= 0", name="ck_doctors_buffer_minutes"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    specialization: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    license_number: Mapped[str | None] = mapped_column(sa.String(64))
    buffer_minutes: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="0")
    timezone: Mapped[str] = mapped_column(sa.String(64), nullable=False, server_default="Europe/Warsaw")
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Service(Base):
    __tablename__ = "services"
    __table_args__ = (
        sa.UniqueConstraint("name", name="uq_services_name"),
        sa.CheckConstraint("default_duration_minutes > 0", name="ck_services_duration"),
        sa.CheckConstraint("default_price >= 0", name="ck_services_price"),
        sa.CheckConstraint("buffer_minutes_default >= 0", name="ck_services_buffer"),
        sa.CheckConstraint("group_capacity IS NULL OR group_capacity > 0", name="ck_services_group_capacity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    description: Mapped[str] = mapped_column(sa.Text, nullable=False)
    service_type: Mapped[ServiceType] = mapped_column(sa.Enum(ServiceType, name="service_type"), nullable=False)
    default_duration_minutes: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    default_price: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(sa.String(3), nullable=False, server_default="PLN")
    buffer_minutes_default: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="0")
    min_age: Mapped[int | None] = mapped_column(sa.Integer)
    max_age: Mapped[int | None] = mapped_column(sa.Integer)
    group_capacity: Mapped[int | None] = mapped_column(sa.Integer)
    waitlist_enabled: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class ServicePrice(Base):
    __tablename__ = "service_prices"
    __table_args__ = (
        sa.UniqueConstraint("service_id", "valid_from", name="uq_service_prices_valid_from"),
        sa.CheckConstraint("valid_to IS NULL OR valid_to > valid_from", name="ck_service_prices_valid_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    price: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(sa.String(3), nullable=False, server_default="PLN")
    valid_from: Mapped[dt.date] = mapped_column(sa.Date, nullable=False)
    valid_to: Mapped[dt.date | None] = mapped_column(sa.Date)


class Schedule(Base):
    __tablename__ = "schedules"
    __table_args__ = (
        sa.CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_schedules_day_of_week"),
        sa.CheckConstraint("end_time > start_time", name="ck_schedules_time_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    start_time: Mapped[dt.time] = mapped_column(sa.Time, nullable=False)
    end_time: Mapped[dt.time] = mapped_column(sa.Time, nullable=False)
    timezone: Mapped[str] = mapped_column(sa.String(64), nullable=False, server_default="Europe/Warsaw")
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class ScheduleException(Base):
    __tablename__ = "schedule_exceptions"
    __table_args__ = (
        sa.CheckConstraint("start_time IS NULL OR end_time IS NULL OR end_time > start_time", name="ck_schedule_exceptions_time_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[dt.date] = mapped_column(sa.Date, nullable=False)
    start_time: Mapped[dt.time | None] = mapped_column(sa.Time)
    end_time: Mapped[dt.time | None] = mapped_column(sa.Time)
    is_available: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    reason: Mapped[str | None] = mapped_column(sa.String(255))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Block(Base):
    __tablename__ = "blocks"
    __table_args__ = (
        sa.CheckConstraint("end_at > start_at", name="ck_blocks_time_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    start_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    end_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    reason: Mapped[str | None] = mapped_column(sa.String(255))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        sa.CheckConstraint("end_at > start_at", name="ck_appointments_time_range"),
        sa.CheckConstraint("buffer_minutes >= 0", name="ck_appointments_buffer_minutes"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="RESTRICT"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(sa.Enum(AppointmentStatus, name="appointment_status"), nullable=False, server_default="REQUESTED")
    source: Mapped[AppointmentSource] = mapped_column(sa.Enum(AppointmentSource, name="appointment_source"), nullable=False, server_default="ONLINE")
    start_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    end_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="0")
    price_amount: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(sa.String(3), nullable=False, server_default="PLN")
    notes: Mapped[str | None] = mapped_column(sa.Text)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    cancelled_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    cancellation_reason: Mapped[str | None] = mapped_column(sa.Text)


class Encounter(Base):
    __tablename__ = "encounters"
    __table_args__ = (
        sa.UniqueConstraint("appointment_id", name="uq_encounters_appointment"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False)
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="RESTRICT"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[EncounterStatus] = mapped_column(sa.Enum(EncounterStatus, name="encounter_status"), nullable=False, server_default="OPEN")
    started_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    ended_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class AppointmentParticipant(Base):
    __tablename__ = "appointment_participants"
    __table_args__ = (
        sa.UniqueConstraint("appointment_id", "child_id", name="uq_appointment_participants_child"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False)
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[ParticipantStatus] = mapped_column(sa.Enum(ParticipantStatus, name="participant_status"), nullable=False, server_default="CONFIRMED")
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class MedicalNote(Base):
    __tablename__ = "medical_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False)
    note_text: Mapped[str | None] = mapped_column(sa.Text)
    diagnosis_text: Mapped[str | None] = mapped_column(sa.Text)
    recommendations_text: Mapped[str | None] = mapped_column(sa.Text)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    __table_args__ = (
        sa.UniqueConstraint("encounter_id", name="uq_clinical_notes_encounter"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    author_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[NoteStatus] = mapped_column(sa.Enum(NoteStatus, name="note_status"), nullable=False, server_default="DRAFT")
    is_visible_to_guardian: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    version: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1")
    signed_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    signed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class NoteVersion(Base):
    __tablename__ = "note_versions"
    __table_args__ = (
        sa.UniqueConstraint("note_id", "version_number", name="uq_note_versions_note_version"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    note_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("clinical_notes.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    is_addendum: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    history_text: Mapped[str | None] = mapped_column(sa.Text)
    diagnosis_text: Mapped[str | None] = mapped_column(sa.Text)
    recommendations_text: Mapped[str | None] = mapped_column(sa.Text)
    therapy_plan_text: Mapped[str | None] = mapped_column(sa.Text)
    guardian_summary_text: Mapped[str | None] = mapped_column(sa.Text)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Attachment(Base):
    __tablename__ = "attachments"
    __table_args__ = (
        sa.CheckConstraint(
            "(child_id IS NOT NULL) OR (encounter_id IS NOT NULL) OR (note_id IS NOT NULL)",
            name="ck_attachments_target",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    child_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="CASCADE"))
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("encounters.id", ondelete="CASCADE"))
    note_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("clinical_notes.id", ondelete="CASCADE"))
    uploaded_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    file_name: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(sa.BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("child_profiles.id", ondelete="RESTRICT"), nullable=False)
    code: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    issued_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    expires_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    prescription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    medication_name: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    dosage: Mapped[str | None] = mapped_column(sa.String(255))
    instructions: Mapped[str | None] = mapped_column(sa.Text)
    quantity: Mapped[str | None] = mapped_column(sa.String(64))


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        sa.UniqueConstraint("number", name="uq_invoices_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"))
    guardian_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("patient_profiles.id", ondelete="RESTRICT"), nullable=False)
    number: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(sa.Enum(InvoiceStatus, name="invoice_status"), nullable=False, server_default="UNPAID")
    issued_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    due_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    paid_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    total_amount: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(sa.String(3), nullable=False, server_default="PLN")
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    service_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("services.id", ondelete="SET NULL"))
    description: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1")
    unit_price: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)
    amount: Mapped[sa.Numeric] = mapped_column(sa.Numeric(10, 2), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"))
    channel: Mapped[NotificationChannel] = mapped_column(sa.Enum(NotificationChannel, name="notification_channel"), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(sa.Enum(NotificationStatus, name="notification_status"), nullable=False, server_default="PENDING")
    template: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB)
    scheduled_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    sent_at: Mapped[dt.datetime | None] = mapped_column(sa.DateTime(timezone=True))
    error: Mapped[str | None] = mapped_column(sa.Text)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    resource_type: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(sa.String(64))
    ip_address: Mapped[str | None] = mapped_column(sa.String(45))
    user_agent: Mapped[str | None] = mapped_column(sa.String(255))
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[dt.datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))

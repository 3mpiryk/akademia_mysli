"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2025-01-01 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ExcludeConstraint

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "btree_gist"')

    def create_enum_if_not_exists(name: str, values: list[str]) -> None:
        escaped_values = ", ".join(f"'{value}'" for value in values)
        op.execute(
            f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN
        CREATE TYPE {name} AS ENUM ({escaped_values});
    END IF;
END $$;
"""
        )

    create_enum_if_not_exists("user_role", ["ADMIN", "REGISTRATION", "DOCTOR", "THERAPIST", "GUARDIAN"])
    create_enum_if_not_exists("service_type", ["INDIVIDUAL", "GROUP"])
    create_enum_if_not_exists("appointment_status", ["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    create_enum_if_not_exists("appointment_source", ["ONLINE", "STAFF"])
    create_enum_if_not_exists("invoice_status", ["UNPAID", "PAID", "REFUNDED"])
    create_enum_if_not_exists("notification_channel", ["EMAIL", "SMS"])
    create_enum_if_not_exists("notification_status", ["PENDING", "SENT", "FAILED"])
    create_enum_if_not_exists("participant_status", ["CONFIRMED", "WAITLIST", "CANCELLED"])
    create_enum_if_not_exists("consent_type", ["RODO", "GUARDIAN", "MARKETING"])

    user_role = postgresql.ENUM("ADMIN", "REGISTRATION", "DOCTOR", "THERAPIST", "GUARDIAN", name="user_role", create_type=False)
    service_type = postgresql.ENUM("INDIVIDUAL", "GROUP", name="service_type", create_type=False)
    appointment_status = postgresql.ENUM("REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", name="appointment_status", create_type=False)
    appointment_source = postgresql.ENUM("ONLINE", "STAFF", name="appointment_source", create_type=False)
    invoice_status = postgresql.ENUM("UNPAID", "PAID", "REFUNDED", name="invoice_status", create_type=False)
    notification_channel = postgresql.ENUM("EMAIL", "SMS", name="notification_channel", create_type=False)
    notification_status = postgresql.ENUM("PENDING", "SENT", "FAILED", name="notification_status", create_type=False)
    participant_status = postgresql.ENUM("CONFIRMED", "WAITLIST", "CANCELLED", name="participant_status", create_type=False)
    consent_type = postgresql.ENUM("RODO", "GUARDIAN", "MARKETING", name="consent_type", create_type=False)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "patient_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("address_line", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_patient_profiles"),
        sa.UniqueConstraint("user_id", name="uq_patient_profiles_user_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "child_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("date_of_birth", sa.Date, nullable=False),
        sa.Column("pesel", sa.String(length=11), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_child_profiles"),
        sa.UniqueConstraint("pesel", name="uq_child_profiles_pesel"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "consents",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("consent_type", consent_type, nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_consents"),
        sa.UniqueConstraint("guardian_id", "child_id", "consent_type", name="uq_consents_guardian_child_type"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "doctors",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("specialization", sa.String(length=200), nullable=False),
        sa.Column("license_number", sa.String(length=64), nullable=True),
        sa.Column("buffer_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("timezone", sa.String(length=64), server_default="Europe/Warsaw", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_doctors"),
        sa.UniqueConstraint("user_id", name="uq_doctors_user_id"),
        sa.CheckConstraint("buffer_minutes >= 0", name="ck_doctors_buffer_minutes"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("service_type", service_type, nullable=False),
        sa.Column("default_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("default_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="PLN", nullable=False),
        sa.Column("buffer_minutes_default", sa.Integer(), server_default="0", nullable=False),
        sa.Column("min_age", sa.Integer(), nullable=True),
        sa.Column("max_age", sa.Integer(), nullable=True),
        sa.Column("group_capacity", sa.Integer(), nullable=True),
        sa.Column("waitlist_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_services"),
        sa.UniqueConstraint("name", name="uq_services_name"),
        sa.CheckConstraint("default_duration_minutes > 0", name="ck_services_duration"),
        sa.CheckConstraint("default_price >= 0", name="ck_services_price"),
        sa.CheckConstraint("buffer_minutes_default >= 0", name="ck_services_buffer"),
        sa.CheckConstraint("group_capacity IS NULL OR group_capacity > 0", name="ck_services_group_capacity"),
    )

    op.create_table(
        "service_prices",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="PLN", nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_to", sa.Date(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_service_prices"),
        sa.UniqueConstraint("service_id", "valid_from", name="uq_service_prices_valid_from"),
        sa.CheckConstraint("valid_to IS NULL OR valid_to > valid_from", name="ck_service_prices_valid_range"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("timezone", sa.String(length=64), server_default="Europe/Warsaw", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_schedules"),
        sa.CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_schedules_day_of_week"),
        sa.CheckConstraint("end_time > start_time", name="ck_schedules_time_range"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_schedules_doctor_day", "schedules", ["doctor_id", "day_of_week"], unique=False)

    op.create_table(
        "schedule_exceptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("is_available", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_schedule_exceptions"),
        sa.CheckConstraint("start_time IS NULL OR end_time IS NULL OR end_time > start_time", name="ck_schedule_exceptions_time_range"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_schedule_exceptions_doctor_date", "schedule_exceptions", ["doctor_id", "date"], unique=False)

    op.create_table(
        "blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_blocks"),
        sa.CheckConstraint("end_at > start_at", name="ck_blocks_time_range"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_blocks_doctor_start", "blocks", ["doctor_id", "start_at"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", appointment_status, server_default="REQUESTED", nullable=False),
        sa.Column("source", appointment_source, server_default="ONLINE", nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("buffer_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("price_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="PLN", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_appointments"),
        sa.CheckConstraint("end_at > start_at", name="ck_appointments_time_range"),
        sa.CheckConstraint("buffer_minutes >= 0", name="ck_appointments_buffer_minutes"),
        ExcludeConstraint(
            (sa.column("doctor_id"), "="),
            (sa.text("tstzrange(start_at, end_at, '[)')"), "&&"),
            name="exclude_doctor_time_overlap",
            using="gist",
            where=sa.text("status IN ('REQUESTED','CONFIRMED')"),
        ),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_appointments_doctor_start", "appointments", ["doctor_id", "start_at"], unique=False)
    op.create_index("ix_appointments_guardian", "appointments", ["guardian_id"], unique=False)
    op.create_index("ix_appointments_child", "appointments", ["child_id"], unique=False)

    op.create_table(
        "appointment_participants",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", participant_status, server_default="CONFIRMED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_appointment_participants"),
        sa.UniqueConstraint("appointment_id", "child_id", name="uq_appointment_participants_child"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "medical_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note_text", sa.Text(), nullable=True),
        sa.Column("diagnosis_text", sa.Text(), nullable=True),
        sa.Column("recommendations_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_medical_notes"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="RESTRICT"),
    )

    op.create_table(
        "prescriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_prescriptions"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_prescriptions_code", "prescriptions", ["code"], unique=False)

    op.create_table(
        "prescription_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("prescription_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("medication_name", sa.String(length=255), nullable=False),
        sa.Column("dosage", sa.String(length=255), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("quantity", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_prescription_items"),
        sa.ForeignKeyConstraint(["prescription_id"], ["prescriptions.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("number", sa.String(length=64), nullable=False),
        sa.Column("status", invoice_status, server_default="UNPAID", nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="PLN", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_invoices"),
        sa.UniqueConstraint("number", name="uq_invoices_number"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_invoices_guardian", "invoices", ["guardian_id"], unique=False)

    op.create_table(
        "invoice_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default="1", nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_invoice_items"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("channel", notification_channel, nullable=False),
        sa.Column("status", notification_status, server_default="PENDING", nullable=False),
        sa.Column("template", sa.String(length=120), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_notifications"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_notifications_user", "notifications", ["user_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("resource_type", sa.String(length=120), nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_index("ix_notifications_user", table_name="notifications")
    op.drop_table("notifications")
    op.drop_table("invoice_items")
    op.drop_index("ix_invoices_guardian", table_name="invoices")
    op.drop_table("invoices")
    op.drop_table("prescription_items")
    op.drop_index("ix_prescriptions_code", table_name="prescriptions")
    op.drop_table("prescriptions")
    op.drop_table("medical_notes")
    op.drop_table("appointment_participants")
    op.drop_index("ix_appointments_child", table_name="appointments")
    op.drop_index("ix_appointments_guardian", table_name="appointments")
    op.drop_index("ix_appointments_doctor_start", table_name="appointments")
    op.drop_table("appointments")
    op.drop_index("ix_blocks_doctor_start", table_name="blocks")
    op.drop_table("blocks")
    op.drop_index("ix_schedule_exceptions_doctor_date", table_name="schedule_exceptions")
    op.drop_table("schedule_exceptions")
    op.drop_index("ix_schedules_doctor_day", table_name="schedules")
    op.drop_table("schedules")
    op.drop_table("service_prices")
    op.drop_table("services")
    op.drop_table("doctors")
    op.drop_table("consents")
    op.drop_table("child_profiles")
    op.drop_table("patient_profiles")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_table("users")

    consent_type = sa.Enum("RODO", "GUARDIAN", "MARKETING", name="consent_type")
    participant_status = sa.Enum("CONFIRMED", "WAITLIST", "CANCELLED", name="participant_status")
    notification_status = sa.Enum("PENDING", "SENT", "FAILED", name="notification_status")
    notification_channel = sa.Enum("EMAIL", "SMS", name="notification_channel")
    invoice_status = sa.Enum("UNPAID", "PAID", "REFUNDED", name="invoice_status")
    appointment_source = sa.Enum("ONLINE", "STAFF", name="appointment_source")
    appointment_status = sa.Enum("REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", name="appointment_status")
    service_type = sa.Enum("INDIVIDUAL", "GROUP", name="service_type")
    user_role = sa.Enum("ADMIN", "REGISTRATION", "DOCTOR", "THERAPIST", "GUARDIAN", name="user_role")

    consent_type.drop(op.get_bind(), checkfirst=True)
    participant_status.drop(op.get_bind(), checkfirst=True)
    notification_status.drop(op.get_bind(), checkfirst=True)
    notification_channel.drop(op.get_bind(), checkfirst=True)
    invoice_status.drop(op.get_bind(), checkfirst=True)
    appointment_source.drop(op.get_bind(), checkfirst=True)
    appointment_status.drop(op.get_bind(), checkfirst=True)
    service_type.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)

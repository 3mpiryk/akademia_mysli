"""patient record module schema

Revision ID: 0002_patient_record_module
Revises: 0001_initial_schema
Create Date: 2025-01-01 00:10:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0002_patient_record_module"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def _create_enum_if_not_exists(name: str, values: list[str]) -> None:
    escaped_values = ", ".join([f"'{value}'" for value in values])
    op.execute(
        sa.text(
            f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN
        CREATE TYPE {name} AS ENUM ({escaped_values});
    END IF;
END $$;
"""
        )
    )


def upgrade() -> None:
    contact_channel_values = ["EMAIL", "SMS", "PHONE"]
    patient_status_values = ["ACTIVE", "ARCHIVED"]
    gender_values = ["FEMALE", "MALE", "OTHER", "UNKNOWN"]
    encounter_status_values = ["OPEN", "CLOSED"]
    note_status_values = ["DRAFT", "SIGNED"]

    _create_enum_if_not_exists("contact_channel", contact_channel_values)
    _create_enum_if_not_exists("patient_status", patient_status_values)
    _create_enum_if_not_exists("gender", gender_values)
    _create_enum_if_not_exists("encounter_status", encounter_status_values)
    _create_enum_if_not_exists("note_status", note_status_values)

    contact_channel = postgresql.ENUM(
        *contact_channel_values, name="contact_channel", create_type=False
    )
    patient_status = postgresql.ENUM(
        *patient_status_values, name="patient_status", create_type=False
    )
    gender = postgresql.ENUM(*gender_values, name="gender", create_type=False)
    encounter_status = postgresql.ENUM(
        *encounter_status_values, name="encounter_status", create_type=False
    )
    note_status = postgresql.ENUM(
        *note_status_values, name="note_status", create_type=False
    )

    op.add_column("patient_profiles", sa.Column("preferred_contact_channel", contact_channel, nullable=True))
    op.add_column("patient_profiles", sa.Column("billing_name", sa.String(length=200), nullable=True))
    op.add_column("patient_profiles", sa.Column("billing_address_line", sa.String(length=255), nullable=True))
    op.add_column("patient_profiles", sa.Column("billing_city", sa.String(length=120), nullable=True))
    op.add_column("patient_profiles", sa.Column("billing_postal_code", sa.String(length=20), nullable=True))
    op.add_column("patient_profiles", sa.Column("billing_tax_id", sa.String(length=32), nullable=True))
    op.add_column("patient_profiles", sa.Column("version", sa.Integer(), server_default="1", nullable=False))

    op.add_column("child_profiles", sa.Column("mrn", sa.String(length=32), nullable=True))
    op.add_column("child_profiles", sa.Column("gender", gender, nullable=True))
    op.add_column("child_profiles", sa.Column("status", patient_status, server_default="ACTIVE", nullable=False))
    op.add_column("child_profiles", sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("child_profiles", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("child_profiles", sa.Column("version", sa.Integer(), server_default="1", nullable=False))
    op.create_unique_constraint("uq_child_profiles_mrn", "child_profiles", ["mrn"])

    op.create_table(
        "guardian_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", contact_channel, nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_guardian_contacts"),
        sa.UniqueConstraint("guardian_id", "channel", "value", name="uq_guardian_contacts_value"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_guardian_contacts_guardian", "guardian_contacts", ["guardian_id"], unique=False)

    op.create_table(
        "child_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("address_line", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("school_name", sa.String(length=200), nullable=True),
        sa.Column("class_name", sa.String(length=120), nullable=True),
        sa.Column("registration_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_child_contacts"),
        sa.UniqueConstraint("child_id", name="uq_child_contacts_child"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "emergency_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("relation", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_emergency_contacts"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_emergency_contacts_child", "emergency_contacts", ["child_id"], unique=False)

    op.create_table(
        "authorized_people",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("relation", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_authorized_people"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_authorized_people_child", "authorized_people", ["child_id"], unique=False)

    op.create_table(
        "encounters",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", encounter_status, server_default="OPEN", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_encounters"),
        sa.UniqueConstraint("appointment_id", name="uq_encounters_appointment"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["guardian_id"], ["patient_profiles.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_encounters_child", "encounters", ["child_id"], unique=False)
    op.create_index("ix_encounters_doctor", "encounters", ["doctor_id"], unique=False)

    op.create_table(
        "clinical_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("encounter_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", note_status, server_default="DRAFT", nullable=False),
        sa.Column("is_visible_to_guardian", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_clinical_notes"),
        sa.UniqueConstraint("encounter_id", name="uq_clinical_notes_encounter"),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["signed_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_clinical_notes_encounter", "clinical_notes", ["encounter_id"], unique=False)

    op.create_table(
        "note_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("note_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("is_addendum", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("history_text", sa.Text(), nullable=True),
        sa.Column("diagnosis_text", sa.Text(), nullable=True),
        sa.Column("recommendations_text", sa.Text(), nullable=True),
        sa.Column("therapy_plan_text", sa.Text(), nullable=True),
        sa.Column("guardian_summary_text", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_note_versions"),
        sa.UniqueConstraint("note_id", "version_number", name="uq_note_versions_note_version"),
        sa.ForeignKeyConstraint(["note_id"], ["clinical_notes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_note_versions_note", "note_versions", ["note_id"], unique=False)

    op.create_table(
        "attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("encounter_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("note_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("uploaded_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("storage_key", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_attachments"),
        sa.CheckConstraint("(child_id IS NOT NULL) OR (encounter_id IS NOT NULL) OR (note_id IS NOT NULL)", name="ck_attachments_target"),
        sa.ForeignKeyConstraint(["child_id"], ["child_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["note_id"], ["clinical_notes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_attachments_child", "attachments", ["child_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_attachments_child", table_name="attachments")
    op.drop_table("attachments")
    op.drop_index("ix_note_versions_note", table_name="note_versions")
    op.drop_table("note_versions")
    op.drop_index("ix_clinical_notes_encounter", table_name="clinical_notes")
    op.drop_table("clinical_notes")
    op.drop_index("ix_encounters_doctor", table_name="encounters")
    op.drop_index("ix_encounters_child", table_name="encounters")
    op.drop_table("encounters")
    op.drop_index("ix_authorized_people_child", table_name="authorized_people")
    op.drop_table("authorized_people")
    op.drop_index("ix_emergency_contacts_child", table_name="emergency_contacts")
    op.drop_table("emergency_contacts")
    op.drop_table("child_contacts")
    op.drop_index("ix_guardian_contacts_guardian", table_name="guardian_contacts")
    op.drop_table("guardian_contacts")

    op.drop_constraint("uq_child_profiles_mrn", "child_profiles", type_="unique")
    op.drop_column("child_profiles", "version")
    op.drop_column("child_profiles", "archived_at")
    op.drop_column("child_profiles", "tags")
    op.drop_column("child_profiles", "status")
    op.drop_column("child_profiles", "gender")
    op.drop_column("child_profiles", "mrn")

    op.drop_column("patient_profiles", "version")
    op.drop_column("patient_profiles", "billing_tax_id")
    op.drop_column("patient_profiles", "billing_postal_code")
    op.drop_column("patient_profiles", "billing_city")
    op.drop_column("patient_profiles", "billing_address_line")
    op.drop_column("patient_profiles", "billing_name")
    op.drop_column("patient_profiles", "preferred_contact_channel")

    note_status = sa.Enum("DRAFT", "SIGNED", name="note_status")
    encounter_status = sa.Enum("OPEN", "CLOSED", name="encounter_status")
    gender = sa.Enum("FEMALE", "MALE", "OTHER", "UNKNOWN", name="gender")
    patient_status = sa.Enum("ACTIVE", "ARCHIVED", name="patient_status")
    contact_channel = sa.Enum("EMAIL", "SMS", "PHONE", name="contact_channel")

    note_status.drop(op.get_bind(), checkfirst=True)
    encounter_status.drop(op.get_bind(), checkfirst=True)
    gender.drop(op.get_bind(), checkfirst=True)
    patient_status.drop(op.get_bind(), checkfirst=True)
    contact_channel.drop(op.get_bind(), checkfirst=True)

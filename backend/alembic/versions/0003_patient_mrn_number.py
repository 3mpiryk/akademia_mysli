"""short patient record number

Revision ID: 0003_patient_mrn_number
Revises: 0002_patient_record_module
Create Date: 2025-01-02 00:10:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_patient_mrn_number"
down_revision = "0002_patient_record_module"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS mrn_number_seq"))
    op.add_column(
        "child_profiles",
        sa.Column("mrn_number", sa.Integer(), server_default=sa.text("nextval('mrn_number_seq')"), nullable=True),
    )
    op.execute(sa.text("ALTER SEQUENCE mrn_number_seq OWNED BY child_profiles.mrn_number"))
    op.execute(sa.text("UPDATE child_profiles SET mrn_number = nextval('mrn_number_seq') WHERE mrn_number IS NULL"))
    op.execute(
        sa.text(
            "SELECT setval('mrn_number_seq', (SELECT COALESCE(MAX(mrn_number), 0) FROM child_profiles))"
        )
    )
    op.alter_column(
        "child_profiles",
        "mrn_number",
        nullable=False,
        server_default=sa.text("nextval('mrn_number_seq')"),
    )
    op.create_unique_constraint(
        "uq_child_profiles_mrn_number", "child_profiles", ["mrn_number"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_child_profiles_mrn_number", "child_profiles", type_="unique")
    op.drop_column("child_profiles", "mrn_number")
    op.execute(sa.text("DROP SEQUENCE IF EXISTS mrn_number_seq"))

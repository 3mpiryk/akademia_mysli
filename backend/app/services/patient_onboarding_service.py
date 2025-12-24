from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.enums import ConsentType, ContactChannel
from app.db.models import (
    ChildContact,
    ChildProfile,
    Consent,
    GuardianContact,
    PatientProfile,
    User,
)
from app.schemas.onboarding import PatientOnboardingRequest
from app.utils.patient_code import PatientCode


class PatientOnboardingService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_guardian_with_child(
        self,
        *,
        user: User,
        payload: PatientOnboardingRequest,
    ) -> tuple[ChildProfile, str]:
        existing_guardian = self.db.execute(
            select(PatientProfile).where(PatientProfile.user_id == user.id)
        ).scalar_one_or_none()
        if existing_guardian:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Guardian profile already exists")

        guardian = PatientProfile(
            user_id=user.id,
            full_name=payload.guardian_full_name,
            email=user.email,
            phone=payload.guardian_phone,
            address_line=payload.guardian_address_line,
            city=payload.guardian_city,
            postal_code=payload.guardian_postal_code,
            preferred_contact_channel=payload.guardian_preferred_contact_channel,
        )
        self.db.add(guardian)
        self.db.flush()

        if payload.guardian_phone:
            user.phone = payload.guardian_phone

        self.db.add(
            GuardianContact(
                guardian_id=guardian.id,
                channel=ContactChannel.EMAIL,
                value=user.email,
                is_primary=True,
                is_verified=False,
            )
        )
        if payload.guardian_phone:
            self.db.add(
                GuardianContact(
                    guardian_id=guardian.id,
                    channel=ContactChannel.PHONE,
                    value=payload.guardian_phone,
                    is_primary=payload.guardian_preferred_contact_channel != ContactChannel.EMAIL,
                    is_verified=False,
                )
            )

        child = ChildProfile(
            guardian_id=guardian.id,
            first_name=payload.child_first_name,
            last_name=payload.child_last_name,
            date_of_birth=payload.child_date_of_birth,
            gender=payload.child_gender,
            pesel=payload.child_pesel,
        )
        self.db.add(child)
        self.db.flush()

        if any(
            [
                payload.child_address_line,
                payload.child_city,
                payload.child_postal_code,
                payload.child_school_name,
                payload.child_class_name,
            ]
        ):
            self.db.add(
                ChildContact(
                    child_id=child.id,
                    address_line=payload.child_address_line,
                    city=payload.child_city,
                    postal_code=payload.child_postal_code,
                    school_name=payload.child_school_name,
                    class_name=payload.child_class_name,
                )
            )

        if payload.consent_rodo:
            self.db.add(
                Consent(
                    guardian_id=guardian.id,
                    child_id=child.id,
                    consent_type=ConsentType.RODO,
                )
            )
        if payload.consent_guardian:
            self.db.add(
                Consent(
                    guardian_id=guardian.id,
                    child_id=child.id,
                    consent_type=ConsentType.GUARDIAN,
                )
            )

        self.db.commit()
        return child, PatientCode.format(child.mrn_number)

import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    REGISTRATION = "REGISTRATION"
    DOCTOR = "DOCTOR"
    THERAPIST = "THERAPIST"
    GUARDIAN = "GUARDIAN"


class ServiceType(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    GROUP = "GROUP"


class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class AppointmentSource(str, enum.Enum):
    ONLINE = "ONLINE"
    STAFF = "STAFF"


class InvoiceStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"


class NotificationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class ParticipantStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    WAITLIST = "WAITLIST"
    CANCELLED = "CANCELLED"


class ConsentType(str, enum.Enum):
    RODO = "RODO"
    GUARDIAN = "GUARDIAN"
    MARKETING = "MARKETING"


class ContactChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PHONE = "PHONE"


class PatientStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class Gender(str, enum.Enum):
    FEMALE = "FEMALE"
    MALE = "MALE"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class EncounterStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class NoteStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SIGNED = "SIGNED"

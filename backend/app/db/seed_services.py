import datetime as dt

from sqlalchemy import select

from .enums import ServiceType
from .models import Service, ServicePrice
from .session import SessionLocal

SERVICES = [
    {
        "name": "Poradnia psychiatrii dzieci i młodzieży",
        "description": (
            "Wsparcie dla dzieci i nastolatków z trudnościami emocjonalnymi, lękiem, obniżonym nastrojem "
            "lub problemami w zachowaniu. Pierwsza wizyta to spokojny wywiad z opiekunem i dzieckiem "
            "oraz ustalenie potrzeb i planu dalszych kroków. Czas trwania: ok. 50 min. Warto zabrać "
            "wcześniejszą dokumentację i listę przyjmowanych leków. W sytuacjach pilnych, gdy bezpieczeństwo "
            "dziecka jest zagrożone, skontaktuj się z 112 lub najbliższym SOR."
        ),
        "service_type": ServiceType.INDIVIDUAL,
        "default_duration_minutes": 50,
        "default_price": 250,
        "currency": "PLN",
        "min_age": 6,
        "max_age": 17,
        "group_capacity": None,
        "buffer_minutes_default": 5,
    },
    {
        "name": "Psychoterapia",
        "description": (
            "Psychoterapia indywidualna dla dzieci i młodzieży z trudnościami w relacjach, stresem szkolnym, "
            "lękiem lub obniżonym nastrojem. Pierwsze spotkanie służy poznaniu i ustaleniu celów terapii. "
            "Sesja trwa 50 min; warto przygotować krótki opis sytuacji i oczekiwań. W sytuacjach nagłych "
            "skorzystaj z pomocy doraźnej (112/SOR)."
        ),
        "service_type": ServiceType.INDIVIDUAL,
        "default_duration_minutes": 50,
        "default_price": 200,
        "currency": "PLN",
        "min_age": 6,
        "max_age": 17,
        "group_capacity": None,
        "buffer_minutes_default": 5,
    },
    {
        "name": "Terapia z seksuologiem",
        "description": (
            "Bezpieczna, dyskretna konsultacja dotycząca dojrzewania, tożsamości, granic i edukacji seksualnej. "
            "Pierwsza wizyta obejmuje rozmowę z opiekunem i nastolatkiem z poszanowaniem prywatności. "
            "Czas trwania: 50 min. Można przygotować pytania lub obszary, które budzą niepokój. "
            "W sytuacjach pilnych skorzystaj z pomocy doraźnej (112/SOR)."
        ),
        "service_type": ServiceType.INDIVIDUAL,
        "default_duration_minutes": 50,
        "default_price": 220,
        "currency": "PLN",
        "min_age": 12,
        "max_age": 18,
        "group_capacity": None,
        "buffer_minutes_default": 5,
    },
    {
        "name": "Psychiatria młodzieży - konsultacje",
        "description": (
            "Konsultacje psychiatryczne dla młodzieży obejmujące diagnostykę, omówienie wyników oraz, "
            "jeśli to potrzebne, plan leczenia i monitorowanie farmakoterapii. Pierwsza wizyta to "
            "szczegółowy wywiad i ustalenie zaleceń. Czas trwania: ok. 40 min. Zabierz listę leków "
            "i dotychczasowe wyniki badań. W nagłych sytuacjach wybierz pomoc doraźną (112/SOR)."
        ),
        "service_type": ServiceType.INDIVIDUAL,
        "default_duration_minutes": 40,
        "default_price": 230,
        "currency": "PLN",
        "min_age": 14,
        "max_age": 18,
        "group_capacity": None,
        "buffer_minutes_default": 5,
    },
    {
        "name": "Neurologia",
        "description": (
            "Konsultacje neurologiczne przy bólach głowy, tikach, napadach lub trudnościach neurorozwojowych. "
            "Pierwsza wizyta obejmuje wywiad i ocenę neurologiczną. Czas trwania: 45 min. Warto zabrać "
            "wyniki badań oraz krótki opis objawów. W sytuacjach nagłych skorzystaj z pomocy doraźnej (112/SOR)."
        ),
        "service_type": ServiceType.INDIVIDUAL,
        "default_duration_minutes": 45,
        "default_price": 220,
        "currency": "PLN",
        "min_age": 4,
        "max_age": 17,
        "group_capacity": None,
        "buffer_minutes_default": 5,
    },
    {
        "name": "Felinoterapia i dogoterapia (zajęcia grupowe)",
        "description": (
            "Zajęcia grupowe z udziałem zwierząt terapeutycznych, wspierające regulację emocji, komunikację "
            "i poczucie bezpieczeństwa. Pierwsze spotkanie to krótkie zapoznanie i omówienie zasad. "
            "Czas trwania: 60 min, liczba miejsc ograniczona. Ubierz dziecko wygodnie; warto zabrać butelkę wody. "
            "W sytuacjach pilnych wybierz pomoc doraźną (112/SOR)."
        ),
        "service_type": ServiceType.GROUP,
        "default_duration_minutes": 60,
        "default_price": 120,
        "currency": "PLN",
        "min_age": 4,
        "max_age": 12,
        "group_capacity": 8,
        "buffer_minutes_default": 10,
    },
]


def seed_services() -> None:
    session = SessionLocal()
    today = dt.date.today()
    try:
        for data in SERVICES:
            service = session.execute(
                select(Service).where(Service.name == data["name"])
            ).scalar_one_or_none()

            if service:
                for key, value in data.items():
                    setattr(service, key, value)
            else:
                service = Service(**data)
                session.add(service)
                session.flush()

            price = session.execute(
                select(ServicePrice).where(
                    ServicePrice.service_id == service.id,
                    ServicePrice.valid_from == today,
                )
            ).scalar_one_or_none()
            if not price:
                session.add(
                    ServicePrice(
                        service_id=service.id,
                        price=data["default_price"],
                        currency=data["currency"],
                        valid_from=today,
                    )
                )

        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_services()

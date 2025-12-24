class PatientCode:
    PREFIX = "AM-"
    LENGTH = 6

    @classmethod
    def format(cls, number: int) -> str:
        return f"{cls.PREFIX}{number:0{cls.LENGTH}d}"

    @classmethod
    def parse(cls, code: str) -> int:
        normalized = code.strip().upper()
        if normalized.startswith(cls.PREFIX):
            normalized = normalized[len(cls.PREFIX):]
        if not normalized.isdigit():
            raise ValueError("Invalid patient code")
        return int(normalized)

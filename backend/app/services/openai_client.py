import os
from dataclasses import dataclass
from typing import List

import httpx

from app.schemas.ai import ChatMessage


@dataclass
class OpenAIConfig:
    api_key: str
    base_url: str
    model: str
    timeout: float


class OpenAIClient:
    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        self.config = OpenAIConfig(
            api_key=api_key,
            base_url=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"),
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            timeout=float(os.getenv("OPENAI_TIMEOUT", "20")),
        )

    def generate(self, system_prompt: str, messages: List[ChatMessage]) -> str:
        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *[
                    {"role": msg.role, "content": msg.text}
                    for msg in messages
                ],
            ],
            "temperature": 0.4,
        }
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self.config.base_url}/chat/completions"
        with httpx.Client(timeout=self.config.timeout) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


class OpenAIService:
    def __init__(self) -> None:
        self.client = OpenAIClient()

    def clinical_suggestions(self, note: str, context: str | None) -> str:
        system_prompt = (
            "Jesteś asystentem lekarza przygotowującym podpowiedzi do dokumentacji medycznej. "
            "Nie stawiasz diagnozy ani nie sugerujesz leczenia. Skupiasz się na porządkowaniu wpisu, "
            "wyłapaniu braków formalnych i pytaniach uzupełniających. Zwróć maksymalnie 6 punktów. "
            "Unikaj danych wrażliwych i PII w odpowiedzi. Ton: profesjonalny i rzeczowy."
        )
        content_parts = [
            "Oceń poniższy wpis lekarza i zaproponuj krótkie podpowiedzi do uzupełnienia dokumentacji.",
        ]
        if context:
            content_parts.append(f"Kontekst: {context}")
        content_parts.append(f"Wpis: {note}")
        messages = [ChatMessage(role="user", text="\n".join(content_parts))]
        return self.client.generate(system_prompt, messages)

    def public_chat(self, history: List[ChatMessage], message: str) -> str:
        system_prompt = (
            'Jesteś wirtualnym asystentem przychodni "Akademia Myśli", placówki medycznej dla dzieci i młodzieży. '
            "Twoim celem jest pomoc rodzicom i pacjentom w nawigacji po systemie, wyjaśnianie usług oraz wsparcie "
            "w procesie rejestracji. "
            "Nie udzielasz konkretnych porad medycznych ani diagnoz. Zawsze sugeruj konsultację z lekarzem. "
            "Jesteś uprzejmy, cierpliwy i używasz języka dostosowanego do charakteru placówki (opiekuńczy, ale profesjonalny). "
            "Jeśli użytkownik pyta o cennik lub wolne terminy, skieruj go do zakładki \"Rejestracja\" lub \"Usługi\"."
        )
        messages = [*history, ChatMessage(role="user", text=message)]
        return self.client.generate(system_prompt, messages)

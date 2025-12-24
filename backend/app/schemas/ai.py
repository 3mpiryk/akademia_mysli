from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = "user"
    text: str


class PublicChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: List[ChatMessage] = []


class PublicChatResponse(BaseModel):
    reply: str


class ClinicalSuggestionRequest(BaseModel):
    note: str = Field(..., min_length=1)
    context: Optional[str] = None


class ClinicalSuggestionResponse(BaseModel):
    reply: str

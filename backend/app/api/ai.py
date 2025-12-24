from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_staff_user
from app.schemas.ai import (
    ClinicalSuggestionRequest,
    ClinicalSuggestionResponse,
    PublicChatRequest,
    PublicChatResponse,
)
from app.services.openai_client import OpenAIService

router = APIRouter(prefix="/ai", tags=["AI"])


def get_ai_service() -> OpenAIService:
    return OpenAIService()


@router.post("/public-chat", response_model=PublicChatResponse)
def public_chat(payload: PublicChatRequest, service: OpenAIService = Depends(get_ai_service)) -> PublicChatResponse:
    try:
        reply = service.public_chat(payload.history, payload.message)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI service error") from exc
    return PublicChatResponse(reply=reply)


@router.post("/clinical-suggestions", response_model=ClinicalSuggestionResponse)
def clinical_suggestions(
    payload: ClinicalSuggestionRequest,
    service: OpenAIService = Depends(get_ai_service),
    _user=Depends(require_staff_user),
) -> ClinicalSuggestionResponse:
    try:
        reply = service.clinical_suggestions(payload.note, payload.context)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI service error") from exc
    return ClinicalSuggestionResponse(reply=reply)

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse
from app.services import ai_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: User | None = Depends(get_current_user),
) -> ChatResponse:
    message = await ai_service.chat(body)
    return ChatResponse(message=message)

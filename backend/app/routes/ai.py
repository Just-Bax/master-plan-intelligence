from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_database_session
from app.core.dependencies import get_current_user, require_current_user
from app.core.exceptions import handle_domain_errors
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, ReportResponse
from app.services import ai_service, master_plan_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User | None = Depends(get_current_user),
) -> ChatResponse:
    context = await ai_service.build_chat_context(
        database_session,
        master_plan_id=body.master_plan_id,
        object_ids=body.object_ids,
    )
    message = await ai_service.chat(body, context=context)
    return ChatResponse(message=message)


@router.post("/report/{master_plan_id}", response_model=ReportResponse)
@handle_domain_errors
async def generate_report(
    master_plan_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ReportResponse:
    try:
        report = await ai_service.generate_development_report(
            database_session, master_plan_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    await master_plan_service.update_ai_development_report(
        database_session, master_plan_id, report
    )
    return ReportResponse(report=report)

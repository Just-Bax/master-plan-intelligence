from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_current_user
from app.core.exceptions import NotFoundError, domain_exception_to_http
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, ReportRequest, ReportResponse
from app.services import ai_service, master_plan_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> ChatResponse:
    context = await ai_service.build_chat_context(
        db,
        master_plan_id=body.master_plan_id,
        object_ids=body.object_ids,
    )
    message = await ai_service.chat(body, context=context)
    return ChatResponse(message=message)


@router.post("/report", response_model=ReportResponse)
async def generate_report(
    body: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ReportResponse:
    try:
        report = await ai_service.generate_development_report(db, body.master_plan_id)
    except NotFoundError as e:
        domain_exception_to_http(e)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    await master_plan_service.update_ai_development_report(
        db, body.master_plan_id, report
    )
    return ReportResponse(report=report)

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_database_session
from app.core.dependencies import get_current_user, require_current_user
from app.core.exceptions import handle_domain_errors
from app.models.user import User
from app.schemas.ai import ReportResponse
from app.schemas.project import (
    AnalyzeStubResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services import ai_service, master_plan_service, project_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    master_plan_id: int | None = Query(None, description="Filter by master plan"),
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User | None = Depends(get_current_user),
) -> list[ProjectResponse]:
    rows = await project_service.list_projects(
        database_session, master_plan_id=master_plan_id, current_user=current_user
    )
    return [project_service.project_to_response(r) for r in rows]


@router.post("", response_model=ProjectResponse, status_code=201)
@handle_domain_errors
async def create_project(
    body: ProjectCreate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    project = await project_service.create_project(database_session, body, current_user)
    return project_service.project_to_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
@handle_domain_errors
async def get_project(
    project_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User | None = Depends(get_current_user),
) -> ProjectResponse:
    project = await project_service.get_by_id(
        database_session, project_id, current_user=current_user
    )
    return project_service.project_to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
@handle_domain_errors
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    project = await project_service.update_project(
        database_session, project_id, body, current_user
    )
    return project_service.project_to_response(project)


@router.delete("/{project_id}", status_code=204)
@handle_domain_errors
async def delete_project(
    project_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> None:
    await project_service.delete_project(database_session, project_id, current_user)


@router.post("/{project_id}/analyze", response_model=AnalyzeStubResponse)
@handle_domain_errors
async def analyze_project(
    project_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User | None = Depends(get_current_user),
) -> AnalyzeStubResponse:
    await project_service.get_by_id(database_session, project_id)
    return AnalyzeStubResponse(project_id=project_id)


@router.post("/{project_id}/report", response_model=ReportResponse)
@handle_domain_errors
async def report_project(
    project_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ReportResponse:
    project = await project_service.get_by_id(database_session, project_id)
    if project.master_plan_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Project has no master plan. Set master_plan_id to generate a report.",
        )
    try:
        report_data = await ai_service.generate_development_report(
            database_session, project.master_plan_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    await master_plan_service.update_ai_development_report(
        database_session, project.master_plan_id, report_data
    )
    return ReportResponse(report=report_data)

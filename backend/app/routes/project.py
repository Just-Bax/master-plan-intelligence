from fastapi import APIRouter, Depends, Query

from app.core.database import get_db
from app.core.deps import get_current_user, require_current_user
from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    domain_exception_to_http,
)
from app.models.user import User
from app.schemas.project import (
    AnalyzeStubResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ReportStubResponse,
)
from app.services import project_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    master_plan_id: int | None = Query(None, description="Filter by master plan"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> list[ProjectResponse]:
    rows = await project_service.list_projects(
        db, master_plan_id=master_plan_id, current_user=current_user
    )
    return [project_service.project_to_response(r) for r in rows]


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    try:
        project = await project_service.create_project(db, body, current_user)
        return project_service.project_to_response(project)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> ProjectResponse:
    try:
        project = await project_service.get_by_id(
            db, project_id, current_user=current_user
        )
        return project_service.project_to_response(project)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    try:
        project = await project_service.update_project(
            db, project_id, body, current_user
        )
        return project_service.project_to_response(project)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> None:
    try:
        await project_service.delete_project(db, project_id, current_user)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.post("/{project_id}/analyze", response_model=AnalyzeStubResponse)
async def analyze_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> AnalyzeStubResponse:
    try:
        await project_service.get_by_id(db, project_id)
        return AnalyzeStubResponse(project_id=project_id)
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.post("/{project_id}/report", response_model=ReportStubResponse)
async def report_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> ReportStubResponse:
    try:
        await project_service.get_by_id(db, project_id)
        return ReportStubResponse(
            content="Report stub. Configure AI to generate.",
            project_id=project_id,
        )
    except NotFoundError as e:
        domain_exception_to_http(e)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate


def project_to_response(project: Project) -> ProjectResponse:
    return ProjectResponse.model_validate(project)


async def list_projects(
    db: AsyncSession,
    master_plan_id: int | None = None,
    current_user: User | None = None,
) -> list[Project]:
    q = select(Project).order_by(Project.updated_at.desc())
    if master_plan_id is not None:
        q = q.where(Project.master_plan_id == master_plan_id)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_by_id(
    db: AsyncSession,
    project_id: int,
    current_user: User | None = None,
) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    return project


async def create_project(
    db: AsyncSession,
    body: ProjectCreate,
    current_user: User,
) -> Project:
    project = Project(
        name=body.name,
        description=body.description,
        master_plan_id=body.master_plan_id,
        created_by=current_user.id,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def update_project(
    db: AsyncSession,
    project_id: int,
    body: ProjectUpdate,
    current_user: User,
) -> Project:
    project = await get_by_id(db, project_id)
    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    if body.master_plan_id is not None:
        project.master_plan_id = body.master_plan_id
    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(
    db: AsyncSession,
    project_id: int,
    current_user: User,
) -> None:
    project = await get_by_id(db, project_id)
    await db.delete(project)

from fastapi import APIRouter, Depends

from app.core.database import get_database_session
from app.core.dependencies import require_current_user
from app.core.exceptions import handle_domain_errors
from app.models.user import User
from app.schemas.master_plan import (
    MasterPlanCreate,
    MasterPlanResponse,
    MasterPlanUpdate,
)
from app.schemas.object import ObjectResponse
from app.services import master_plan_service, object_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[MasterPlanResponse])
async def list_master_plans(
    database_session: AsyncSession = Depends(get_database_session),
) -> list[MasterPlanResponse]:
    rows = await master_plan_service.list_master_plans(database_session)
    return [
        master_plan_service.plan_to_response(plan, area_m2) for plan, area_m2 in rows
    ]


@router.post("", response_model=MasterPlanResponse, status_code=201)
@handle_domain_errors
async def create_master_plan(
    body: MasterPlanCreate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> MasterPlanResponse:
    plan, area_m2 = await master_plan_service.create_master_plan(
        database_session, body, current_user=current_user
    )
    return master_plan_service.plan_to_response(plan, area_m2)


@router.get("/{master_plan_id}", response_model=MasterPlanResponse)
@handle_domain_errors
async def get_master_plan(
    master_plan_id: int,
    database_session: AsyncSession = Depends(get_database_session),
) -> MasterPlanResponse:
    plan, area_m2 = await master_plan_service.get_by_id(
        database_session, master_plan_id
    )
    return master_plan_service.plan_to_response(plan, area_m2)


@router.get(
    "/{master_plan_id}/objects",
    response_model=list[ObjectResponse],
)
@handle_domain_errors
async def list_master_plan_objects(
    master_plan_id: int,
    database_session: AsyncSession = Depends(get_database_session),
) -> list[ObjectResponse]:
    rows = await master_plan_service.list_objects_in_plan(
        database_session, master_plan_id
    )
    return [object_service.object_to_response(obj, area_m2) for obj, area_m2 in rows]


@router.patch("/{master_plan_id}", response_model=MasterPlanResponse)
@handle_domain_errors
async def update_master_plan(
    master_plan_id: int,
    body: MasterPlanUpdate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> MasterPlanResponse:
    plan, area_m2 = await master_plan_service.update_master_plan(
        database_session, master_plan_id, body, current_user=current_user
    )
    return master_plan_service.plan_to_response(plan, area_m2)


@router.delete("/{master_plan_id}", status_code=204)
@handle_domain_errors
async def delete_master_plan(
    master_plan_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> None:
    await master_plan_service.delete_master_plan(database_session, master_plan_id)

from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.exceptions import NotFoundError, domain_exception_to_http
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
    db: AsyncSession = Depends(get_db),
) -> list[MasterPlanResponse]:
    rows = await master_plan_service.list_master_plans(db)
    return [
        master_plan_service.plan_to_response(plan, area_m2) for plan, area_m2 in rows
    ]


@router.post("", response_model=MasterPlanResponse, status_code=201)
async def create_master_plan(
    body: MasterPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> MasterPlanResponse:
    try:
        plan, area_m2 = await master_plan_service.create_master_plan(
            db, body, current_user=current_user
        )
        return master_plan_service.plan_to_response(plan, area_m2)
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.get("/{master_plan_id}", response_model=MasterPlanResponse)
async def get_master_plan(
    master_plan_id: int,
    db: AsyncSession = Depends(get_db),
) -> MasterPlanResponse:
    try:
        plan, area_m2 = await master_plan_service.get_by_id(db, master_plan_id)
        return master_plan_service.plan_to_response(plan, area_m2)
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.get(
    "/{master_plan_id}/objects",
    response_model=list[ObjectResponse],
)
async def list_master_plan_objects(
    master_plan_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[ObjectResponse]:
    try:
        rows = await master_plan_service.list_objects_in_plan(db, master_plan_id)
        return [
            object_service.object_to_response(obj, area_m2) for obj, area_m2 in rows
        ]
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.patch("/{master_plan_id}", response_model=MasterPlanResponse)
async def update_master_plan(
    master_plan_id: int,
    body: MasterPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> MasterPlanResponse:
    try:
        plan, area_m2 = await master_plan_service.update_master_plan(
            db, master_plan_id, body, current_user=current_user
        )
        return master_plan_service.plan_to_response(plan, area_m2)
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.delete("/{master_plan_id}", status_code=204)
async def delete_master_plan(
    master_plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> None:
    try:
        await master_plan_service.delete_master_plan(db, master_plan_id)
    except NotFoundError as e:
        domain_exception_to_http(e)

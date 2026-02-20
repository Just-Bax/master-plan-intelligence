from fastapi import APIRouter, Depends, Query

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    domain_exception_to_http,
)
from app.models.user import User
from app.schemas.object import ObjectCreate, ObjectResponse, ObjectUpdate
from app.services import object_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ObjectResponse])
async def list_objects(
    object_type_id: int | None = Query(None, description="Filter by object type"),
    db: AsyncSession = Depends(get_db),
) -> list[ObjectResponse]:
    rows = await object_service.list_objects(db, object_type_id=object_type_id)
    return [object_service.object_to_response(obj, area_m2) for obj, area_m2 in rows]


@router.post("", response_model=ObjectResponse, status_code=201)
async def create_object(
    body: ObjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ObjectResponse:
    try:
        obj, area_m2 = await object_service.create_object(db, body, current_user)
        return object_service.object_to_response(obj, area_m2)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.get("/{object_id}", response_model=ObjectResponse)
async def read_object(
    object_id: int,
    db: AsyncSession = Depends(get_db),
) -> ObjectResponse:
    try:
        obj, area_m2 = await object_service.get_by_id(db, object_id)
        return object_service.object_to_response(obj, area_m2)
    except NotFoundError as e:
        domain_exception_to_http(e)


@router.patch("/{object_id}", response_model=ObjectResponse)
async def update_object(
    object_id: int,
    body: ObjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ObjectResponse:
    try:
        obj, area_m2 = await object_service.update_object(
            db, object_id, body, current_user
        )
        return object_service.object_to_response(obj, area_m2)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)


@router.delete("/{object_id}", status_code=204)
async def delete_object(
    object_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> None:
    try:
        await object_service.delete_object(db, object_id, current_user)
    except (NotFoundError, ForbiddenError) as e:
        domain_exception_to_http(e)

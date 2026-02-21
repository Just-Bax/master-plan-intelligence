from fastapi import APIRouter, Depends, Query

from app.core.database import get_database_session
from app.core.dependencies import require_current_user
from app.core.exceptions import handle_domain_errors
from app.models.user import User
from app.schemas.object import ObjectCreate, ObjectResponse, ObjectUpdate
from app.services import object_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ObjectResponse])
async def list_objects(
    object_type_id: int | None = Query(None, description="Filter by object type"),
    database_session: AsyncSession = Depends(get_database_session),
) -> list[ObjectResponse]:
    rows = await object_service.list_objects(
        database_session, object_type_id=object_type_id
    )
    return [object_service.object_to_response(obj, area_m2) for obj, area_m2 in rows]


@router.post("", response_model=ObjectResponse, status_code=201)
@handle_domain_errors
async def create_object(
    body: ObjectCreate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ObjectResponse:
    object_entity, area_m2 = await object_service.create_object(
        database_session, body, current_user
    )
    return object_service.object_to_response(object_entity, area_m2)


@router.get("/{object_id}", response_model=ObjectResponse)
@handle_domain_errors
async def get_object(
    object_id: int,
    database_session: AsyncSession = Depends(get_database_session),
) -> ObjectResponse:
    object_entity, area_m2 = await object_service.get_by_id(database_session, object_id)
    return object_service.object_to_response(object_entity, area_m2)


@router.patch("/{object_id}", response_model=ObjectResponse)
@handle_domain_errors
async def update_object(
    object_id: int,
    body: ObjectUpdate,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> ObjectResponse:
    object_entity, area_m2 = await object_service.update_object(
        database_session, object_id, body, current_user
    )
    return object_service.object_to_response(object_entity, area_m2)


@router.delete("/{object_id}", status_code=204)
@handle_domain_errors
async def delete_object(
    object_id: int,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> None:
    await object_service.delete_object(database_session, object_id, current_user)

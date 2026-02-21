from fastapi import APIRouter, Depends

from app.core.database import get_database_session
from app.schemas.object_type import ObjectTypeResponse
from app.services import object_type_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ObjectTypeResponse])
async def list_object_types(
    database_session: AsyncSession = Depends(get_database_session),
) -> list[ObjectTypeResponse]:
    rows = await object_type_service.list_object_types(database_session)
    return [object_type_service.object_type_to_response(r) for r in rows]

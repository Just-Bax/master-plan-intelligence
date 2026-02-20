from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.schemas.object_type import ObjectTypeResponse
from app.services import object_type_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[ObjectTypeResponse])
async def list_object_types(
    db: AsyncSession = Depends(get_db),
) -> list[ObjectTypeResponse]:
    rows = await object_type_service.list_object_types(db)
    return [object_type_service.object_type_to_response(r) for r in rows]

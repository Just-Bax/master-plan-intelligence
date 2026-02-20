from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.schemas.function_type import FunctionTypeResponse
from app.services import function_type_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[FunctionTypeResponse])
async def list_function_types(
    db: AsyncSession = Depends(get_db),
) -> list[FunctionTypeResponse]:
    rows = await function_type_service.list_function_types(db)
    return [function_type_service.function_type_to_response(r) for r in rows]

from fastapi import APIRouter, Depends

from app.core.database import get_database_session
from app.schemas.function_type import FunctionTypeResponse
from app.services import function_type_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[FunctionTypeResponse])
async def list_function_types(
    database_session: AsyncSession = Depends(get_database_session),
) -> list[FunctionTypeResponse]:
    rows = await function_type_service.list_function_types(database_session)
    return [function_type_service.function_type_to_response(r) for r in rows]

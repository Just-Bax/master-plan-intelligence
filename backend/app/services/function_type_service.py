from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.function_type import FunctionType
from app.schemas.function_type import FunctionTypeResponse


async def list_function_types(db: AsyncSession) -> list[FunctionType]:
    result = await db.execute(select(FunctionType).order_by(FunctionType.code))
    return list(result.scalars().all())


def function_type_to_response(ft: FunctionType) -> FunctionTypeResponse:
    return FunctionTypeResponse.model_validate(ft)

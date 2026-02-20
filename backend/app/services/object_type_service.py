from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.object_type import ObjectType
from app.schemas.object_type import ObjectTypeResponse


async def list_object_types(db: AsyncSession) -> list[ObjectType]:
    result = await db.execute(select(ObjectType).order_by(ObjectType.code))
    return list(result.scalars().all())


def object_type_to_response(ot: ObjectType) -> ObjectTypeResponse:
    return ObjectTypeResponse.model_validate(ot)

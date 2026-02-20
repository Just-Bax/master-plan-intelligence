from pydantic import BaseModel


class ObjectTypeResponse(BaseModel):
    id: int
    code: str
    name: str | None = None

    model_config = {"from_attributes": True}

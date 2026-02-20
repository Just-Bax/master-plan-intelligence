from pydantic import BaseModel


class FunctionTypeResponse(BaseModel):
    id: int
    code: str
    name: str | None = None

    model_config = {"from_attributes": True}

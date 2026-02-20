from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    object_id: int | None = None
    master_plan_id: int | None = None
    project_id: int | None = None


class ChatResponse(BaseModel):
    message: str

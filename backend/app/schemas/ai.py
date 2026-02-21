from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    object_id: int | None = None
    object_ids: list[int] | None = None
    master_plan_id: int | None = None
    project_id: int | None = None
    """Preferred response locale (e.g. en, ru, uz). If set, system prompt asks AI to respond in this language."""
    locale: str | None = None


class ChatResponse(BaseModel):
    message: str


class ReportRequest(BaseModel):
    master_plan_id: int


class ReportResponse(BaseModel):
    """Development report JSON (same schema as stored in master_plan.ai_development_report)."""

    report: dict

"""AI chat using an OpenAI-compatible API (config: AI_BASE_URL, AI_API_KEY, AI_MODEL)."""

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.ai import ChatRequest


async def chat(body: ChatRequest) -> str:
    if not settings.AI_API_KEY:
        return "AI chat is not configured. Set AI_API_KEY in .env to enable."

    client = AsyncOpenAI(
        base_url=settings.AI_BASE_URL,
        api_key=settings.AI_API_KEY,
    )
    messages = [{"role": msg.role, "content": msg.content} for msg in body.messages]
    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=messages,
    )
    choice = response.choices[0] if response.choices else None
    if choice and choice.message and choice.message.content:
        return choice.message.content
    return "No response from the model."

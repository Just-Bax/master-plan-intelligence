"""
Master Plan Intelligence API.

REST endpoints (all under API base URL, JSON unless noted):

  Health
    GET  /health

  Auth (tag: auth)
    POST /auth/login
    POST /auth/register

  User (tag: user)
    GET  /user/me

  Master plans (tag: master_plan)
    GET    /master_plan
    POST   /master_plan
    GET    /master_plan/{master_plan_id}
    GET    /master_plan/{master_plan_id}/objects
    PATCH  /master_plan/{master_plan_id}
    DELETE /master_plan/{master_plan_id}

  Object types (tag: object_type)
    GET  /object_type

  Function types (tag: function_type)
    GET  /function_type

  Objects (tag: object). List supports ?object_type_id=
    GET    /object
    POST   /object
    GET    /object/{object_id}
    PATCH  /object/{object_id}
    DELETE /object/{object_id}

  Projects (tag: project). List supports ?master_plan_id=
    GET    /project
    POST   /project
    GET    /project/{project_id}
    PATCH  /project/{project_id}
    DELETE /project/{project_id}
    POST   /project/{project_id}/analyze
    POST   /project/{project_id}/report

  AI (tag: ai)
    POST /ai/chat
    POST /ai/report/{master_plan_id}

  Files (tag: file). GET requires auth.
    POST /file
    GET  /file/{file_id}   (returns bytes)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    auth,
    user,
    master_plan,
    object as object_router,
    object_type as object_type_router,
    function_type as function_type_router,
    project as project_router,
    file as file_router,
    ai,
)
from app.core.config import settings


def _cors_origins() -> list[str]:
    """Derive CORS origins list from config (single source: CORS_ORIGINS_STR)."""
    s = (settings.CORS_ORIGINS_STR or "").strip()
    return [x.strip() for x in s.split(",") if x.strip()]


app = FastAPI(
    title="Master Plan Intelligence API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(master_plan.router, prefix="/master_plan", tags=["master_plan"])
app.include_router(
    object_type_router.router, prefix="/object_type", tags=["object_type"]
)
app.include_router(
    function_type_router.router, prefix="/function_type", tags=["function_type"]
)
app.include_router(object_router.router, prefix="/object", tags=["object"])
app.include_router(project_router.router, prefix="/project", tags=["project"])
app.include_router(file_router.router, prefix="/file", tags=["file"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

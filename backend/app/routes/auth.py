from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import ERROR_MESSAGE_INCORRECT_EMAIL_OR_PASSWORD
from app.core.database import get_database_session
from app.core.exceptions import ConflictError, NotFoundError, domain_exception_to_http
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate
from app.services import auth_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    body: LoginRequest,
    database_session: AsyncSession = Depends(get_database_session),
) -> Token:
    try:
        return await auth_service.login(database_session, body.email, body.password)
    except NotFoundError as e:
        # Login uses NotFoundError for wrong credentials; map to 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e) or ERROR_MESSAGE_INCORRECT_EMAIL_OR_PASSWORD,
        )


@router.post("/register", response_model=Token, status_code=201)
async def register(
    body: UserCreate,
    database_session: AsyncSession = Depends(get_database_session),
) -> Token:
    try:
        return await auth_service.register(database_session, body)
    except ConflictError as e:
        domain_exception_to_http(e)

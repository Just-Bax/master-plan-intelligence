"""FastAPI dependency injection: database session, current user."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import ERROR_MESSAGE_NOT_AUTHENTICATED
from app.core.database import get_database_session
from app.core.security import decode_access_token
from app.models.user import User

bearer_security = HTTPBearer(auto_error=False)


async def get_current_user(
    database_session: Annotated[AsyncSession, Depends(get_database_session)],
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_security)
    ] = None,
) -> User | None:
    if credentials is None:
        return None
    subject = decode_access_token(credentials.credentials)
    if subject is None:
        return None
    result = await database_session.execute(select(User).where(User.id == int(subject)))
    user = result.scalar_one_or_none()
    return user


async def require_current_user(
    current_user: Annotated[User | None, Depends(get_current_user)],
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGE_NOT_AUTHENTICATED,
        )
    return current_user

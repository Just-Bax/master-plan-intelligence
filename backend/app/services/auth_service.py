from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    ERROR_MESSAGE_EMAIL_ALREADY_REGISTERED,
    ERROR_MESSAGE_INCORRECT_EMAIL_OR_PASSWORD,
)
from app.core.exceptions import ConflictError, NotFoundError


async def login(
    db: AsyncSession,
    email: str,
    password: str,
) -> Token:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        raise NotFoundError(ERROR_MESSAGE_INCORRECT_EMAIL_OR_PASSWORD)
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


async def register(
    db: AsyncSession,
    body: UserCreate,
) -> Token:
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise ConflictError(ERROR_MESSAGE_EMAIL_ALREADY_REGISTERED)
    user = User(
        email=body.email,
        hashed_password=get_password_hash(body.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)

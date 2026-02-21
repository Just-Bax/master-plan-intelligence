from fastapi import APIRouter, Depends

from app.core.dependencies import require_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from app.services import user_service

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(require_current_user),
) -> UserResponse:
    return user_service.get_me(current_user)

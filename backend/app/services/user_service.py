from app.models.user import User
from app.schemas.user import UserResponse


def get_me(user: User) -> UserResponse:
    return UserResponse.model_validate(user)

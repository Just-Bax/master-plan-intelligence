"""Domain exceptions for the service layer. Routes map these to HTTPException."""


class NotFoundError(Exception):
    """Resource not found (e.g. 404)."""

    pass


class ForbiddenError(Exception):
    """User not allowed to perform action (e.g. 403)."""

    pass


class ConflictError(Exception):
    """Conflict with current state (e.g. 409 - email already registered)."""

    pass


def domain_exception_to_http(exc: Exception) -> None:
    """Map domain exceptions to HTTPException and raise. Re-raise unknown."""
    from fastapi import HTTPException, status

    if isinstance(exc, NotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Not found",
        )
    if isinstance(exc, ForbiddenError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc) or "Forbidden",
        )
    if isinstance(exc, ConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Conflict",
        )
    raise exc

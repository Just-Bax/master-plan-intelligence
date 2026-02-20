import mimetypes
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.responses import Response

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.exceptions import NotFoundError, domain_exception_to_http
from app.models.user import User
from app.schemas.file import FileResponse
from app.services import file_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def _content_disposition(filename: str) -> str:
    """Safe filename for Content-Disposition header (escape quotes)."""
    safe = filename.replace("\\", "_").replace('"', "%22")
    return f'attachment; filename="{safe}"'


@router.post("", response_model=FileResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> FileResponse:
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            413,
            f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes.",
        )
    record = await file_service.upload_file(
        db, filename=file.filename or "upload", content=content
    )
    return file_service.file_to_response(record)


@router.get("/{file_id}")
async def get_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        record, content = await file_service.get_file_content(db, file_id)
        media_type, _ = mimetypes.guess_type(record.filename)
        if media_type is None:
            media_type = "application/octet-stream"
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": _content_disposition(record.filename),
                "Content-Length": str(len(content)),
            },
        )
    except NotFoundError as e:
        domain_exception_to_http(e)

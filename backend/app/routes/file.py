import mimetypes
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_database_session
from app.core.dependencies import require_current_user
from app.core.exceptions import handle_domain_errors
from app.models.user import User
from app.schemas.file import FileResponse
from app.services import file_service
from app.utils.http_headers import content_disposition_for_download

router = APIRouter()


@router.post("", response_model=FileResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> FileResponse:
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            413,
            f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes.",
        )
    record = await file_service.upload_file(
        database_session,
        filename=file.filename or "upload",
        content=content,
    )
    return file_service.file_to_response(record)


@router.get("/{file_id}")
@handle_domain_errors
async def get_file(
    file_id: uuid.UUID,
    database_session: AsyncSession = Depends(get_database_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    record, content = await file_service.get_file_content(database_session, file_id)
    media_type, _ = mimetypes.guess_type(record.filename)
    if media_type is None:
        media_type = "application/octet-stream"
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": content_disposition_for_download(record.filename),
            "Content-Length": str(len(content)),
        },
    )

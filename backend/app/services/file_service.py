import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import ERROR_MESSAGE_FILE_NOT_FOUND
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.models.file import File as FileModel
from app.schemas.file import FileResponse


def _storage_path() -> Path:
    return Path(settings.UPLOAD_DIR)


def _file_path(file_id: uuid.UUID) -> Path:
    return _storage_path() / str(file_id)


def file_to_response(record: FileModel) -> FileResponse:
    return FileResponse.model_validate(record)


async def upload_file(
    db: AsyncSession,
    *,
    filename: str,
    content: bytes,
) -> FileModel:
    file_id = uuid.uuid4()
    size = len(content)
    record = FileModel(
        file_id=file_id,
        filename=filename,
        size=size,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    path = _file_path(file_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)

    return record


async def get_file(
    db: AsyncSession,
    file_id: uuid.UUID,
) -> FileModel:
    result = await db.execute(select(FileModel).where(FileModel.file_id == file_id))
    record = result.scalar_one_or_none()
    if record is None:
        raise NotFoundError(ERROR_MESSAGE_FILE_NOT_FOUND)
    return record


async def get_file_content(
    db: AsyncSession,
    file_id: uuid.UUID,
) -> tuple[FileModel, bytes]:
    record = await get_file(db, file_id)
    path = _file_path(file_id)
    if not path.is_file():
        raise NotFoundError(ERROR_MESSAGE_FILE_NOT_FOUND)
    content = path.read_bytes()
    return record, content

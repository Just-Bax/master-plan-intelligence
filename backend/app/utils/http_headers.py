"""HTTP header utilities for responses."""


def content_disposition_for_download(filename: str) -> str:
    """Build Content-Disposition header value for file download (safe filename, escape quotes)."""
    safe_filename = filename.replace("\\", "_").replace('"', "%22")
    return f'attachment; filename="{safe_filename}"'

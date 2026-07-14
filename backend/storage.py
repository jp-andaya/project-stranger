"""
Photo storage — base64 dataURL ingest to files on disk, paths in the DB.

The camera capture in the frontend produces dataURLs, so the API accepts
`"data:image/jpeg;base64,..."` strings in JSON. Files land under UPLOAD_DIR
(a named volume in Docker) as `<subdir>/<uuid>.<ext>`; only the relative
path is stored in the database.
"""

import base64
import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", Path(__file__).parent / "data" / "uploads"))

MAX_PHOTO_BYTES = 2 * 1024 * 1024  # 2 MB decoded

_DATAURL_RE = re.compile(r"^data:image/(jpeg|jpg|png|webp);base64,(.+)$", re.DOTALL)
_EXTENSIONS = {"jpeg": "jpg", "jpg": "jpg", "png": "png", "webp": "webp"}


def save_photo(data_url: str, subdir: str) -> str:
    """Decode a dataURL and write it under UPLOAD_DIR/<subdir>/. Returns the
    relative path to store in the DB. Raises 400 on bad input, 413 if too big."""
    match = _DATAURL_RE.match(data_url or "")
    if not match:
        raise HTTPException(
            status_code=400,
            detail="Photo must be a base64 data URL (jpeg, png or webp)",
        )
    mime_ext, b64_data = match.groups()
    try:
        raw = base64.b64decode(b64_data, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Photo data is not valid base64")
    if len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="Photo exceeds the 2 MB limit")

    relative = f"{subdir}/{uuid.uuid4().hex}.{_EXTENSIONS[mime_ext]}"
    target = UPLOAD_DIR / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)
    return relative


def photo_abs_path(relative: str) -> Path:
    return UPLOAD_DIR / relative


def delete_photo(relative: str | None) -> None:
    """Remove a stored photo file; cascades only delete rows, not files."""
    if not relative:
        return
    try:
        (UPLOAD_DIR / relative).unlink(missing_ok=True)
    except OSError:
        pass  # orphan files are untidy but harmless

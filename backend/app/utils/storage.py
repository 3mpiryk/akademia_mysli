from __future__ import annotations

import shutil
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

ROOT_DIR = Path(__file__).resolve().parents[1]
STORAGE_DIR = ROOT_DIR / "storage" / "attachments"


def save_upload(upload: UploadFile, attachment_id: UUID) -> tuple[str, int]:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(upload.filename or "").suffix
    filename = f"{attachment_id}{suffix}"
    target_path = STORAGE_DIR / filename
    with target_path.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return str(target_path.relative_to(ROOT_DIR)), target_path.stat().st_size


def resolve_storage_path(storage_key: str) -> Path:
    path = (ROOT_DIR / storage_key).resolve()
    if ROOT_DIR not in path.parents and path != ROOT_DIR:
        raise ValueError("Invalid storage key")
    return path

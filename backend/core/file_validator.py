import os
import uuid
from rest_framework import exceptions
from core.db import get_settings_col

MAGIC_SIGNATURES = {
    'pdf': [b'%PDF-'],
    'doc': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],
    'docx': [b'PK\x03\x04'],
}

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

MIME_TYPE_MAPPING = {
    'pdf': ['application/pdf'],
    'doc': ['application/msword', 'application/x-msword'],
    'docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/octet-stream'
    ],
    'txt': ['text/plain', 'text/x-log', 'application/octet-stream']
}

def get_system_file_config():
    """Retrieve dynamic settings from database or fallback to defaults."""
    settings_col = get_settings_col()
    cfg = settings_col.find_one({'key': 'global_config'}) or {}
    max_mb = cfg.get('max_file_size_mb', 10)
    allowed_exts = set(cfg.get('allowed_extensions', ['pdf', 'doc', 'docx', 'txt']))
    return max_mb, allowed_exts

def validate_uploaded_file(uploaded_file):
    """
    Comprehensive server-side validation:
    1. Size limit check
    2. Extension validation
    3. Magic byte signature check
    4. Text content check for .txt
    """
    max_mb, allowed_exts = get_system_file_config()
    max_bytes = max_mb * 1024 * 1024

    if uploaded_file.size > max_bytes:
        raise exceptions.ValidationError(
            f"File size exceeds the allowed limit of {max_mb} MB. (Provided: {uploaded_file.size / (1024*1024):.2f} MB)"
        )

    if uploaded_file.size == 0:
        raise exceptions.ValidationError("The uploaded file is empty.")

    original_name = uploaded_file.name
    # Path traversal defense: clean the filename
    basename = os.path.basename(original_name)
    parts = basename.rsplit('.', 1)
    if len(parts) < 2:
        raise exceptions.ValidationError("File must have a valid file extension (e.g. .pdf, .docx, .doc, .txt).")

    ext = parts[1].lower()
    if ext not in allowed_exts:
        raise exceptions.ValidationError(
            f"File extension '.{ext}' is not permitted. Allowed extensions: {', '.join(allowed_exts)}."
        )

    # Read first 512 bytes for magic signature validation
    uploaded_file.seek(0)
    header = uploaded_file.read(512)
    uploaded_file.seek(0)

    if ext in MAGIC_SIGNATURES:
        valid_magic = False
        for sig in MAGIC_SIGNATURES[ext]:
            if header.startswith(sig):
                valid_magic = True
                break
        if not valid_magic:
            raise exceptions.ValidationError(
                f"File signature mismatch: the file content does not match genuine .{ext} format."
            )
    elif ext == 'txt':
        # Text file validation: ensure no binary null bytes (like executables)
        if b'\x00' in header:
            raise exceptions.ValidationError("Invalid text file: binary characters detected.")
        # Try decoding as utf-8 or ascii or latin-1
        try:
            header.decode('utf-8')
        except UnicodeDecodeError:
            try:
                header.decode('latin-1')
            except Exception:
                raise exceptions.ValidationError("Text file contains invalid non-text encoding.")

    # Generate cryptographically secure randomized storage filename
    storage_filename = f"{uuid.uuid4().hex}_{datetime_slug()}.{ext}"
    
    return {
        'original_filename': basename,
        'storage_filename': storage_filename,
        'file_format': ext.upper(),
        'file_size': uploaded_file.size,
        'content_type': uploaded_file.content_type
    }

def datetime_slug():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')

import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3

S3 = boto3.client("s3")
UPLOAD_BUCKET = os.environ["UPLOAD_BUCKET"]
AWS_REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
URL_TTL = int(os.environ.get("URL_TTL", "600"))

ALLOWED_UPLOAD_TYPES = {"profile", "post"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type,authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(payload),
    }


def _safe_filename(file_name: str) -> str:
    name = (file_name or "").strip()
    if not name:
        return "upload.bin"
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def handler(event, _context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return _response(200, {"message": "ok"})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"message": "invalid_request_format", "data": None})

    file_name = _safe_filename(body.get("file_name"))
    file_type = body.get("file_type") or "application/octet-stream"
    upload_type = (body.get("upload_type") or "profile").strip().lower()

    if upload_type not in ALLOWED_UPLOAD_TYPES:
        return _response(400, {"message": "invalid_request_format", "data": {"detail": "upload_type is invalid"}})

    ext = os.path.splitext(file_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return _response(400, {"message": "invalid_request_format", "data": {"detail": "file extension is not allowed"}})

    now = datetime.now(timezone.utc)
    key = f"{upload_type}/{now:%Y/%m/%d}/{uuid.uuid4().hex}-{file_name}"

    upload_url = S3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": UPLOAD_BUCKET,
            "Key": key,
            "ContentType": file_type,
        },
        ExpiresIn=URL_TTL,
        HttpMethod="PUT",
    )

    image_url = f"https://{UPLOAD_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"

    return _response(
        200,
        {
            "message": "upload_url_created",
            "data": {
                "upload_url": upload_url,
                "image_url": image_url,
                "key": key,
                "expires_in": URL_TTL,
            },
        },
    )

from functools import lru_cache
from io import BytesIO

from minio import Minio

from app.config import get_settings


class ObjectStorage:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.minio_bucket
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    def put(self, object_key: str, content: bytes, content_type: str) -> None:
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
        self.client.put_object(
            self.bucket,
            object_key,
            BytesIO(content),
            length=len(content),
            content_type=content_type,
        )

    def remove(self, object_key: str) -> None:
        self.client.remove_object(self.bucket, object_key)

    def get(self, object_key: str) -> bytes:
        response = self.client.get_object(self.bucket, object_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()


@lru_cache
def get_object_storage() -> ObjectStorage:
    return ObjectStorage()

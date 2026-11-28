"""Database-backed uploads with read-only support for bundled legacy files."""
import uuid
from io import BytesIO
from pathlib import PurePosixPath

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage, Storage
from django.utils.encoding import filepath_to_uri


class DatabaseMediaStorage(Storage):
    prefix = 'db_uploads/'

    @property
    def legacy_storage(self):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

    def _open(self, name, mode='rb'):
        if not name.startswith(self.prefix):
            return self.legacy_storage.open(name, mode)
        from products.models import StoredMedia
        try:
            media = StoredMedia.objects.get(name=name)
        except StoredMedia.DoesNotExist as exc:
            raise FileNotFoundError(name) from exc
        return ContentFile(bytes(media.content), name=name)

    def _save(self, name, content):
        from products.models import StoredMedia
        original = PurePosixPath(name)
        filename = original.stem[:40] + original.suffix[:12]
        stored_name = f'{self.prefix}{uuid.uuid4().hex}/{filename}'
        data = BytesIO()
        for chunk in content.chunks():
            data.write(chunk)
        StoredMedia.objects.create(name=stored_name, content=data.getvalue())
        return stored_name

    def exists(self, name):
        if not name.startswith(self.prefix):
            return self.legacy_storage.exists(name)
        from products.models import StoredMedia
        return StoredMedia.objects.filter(name=name).exists()

    def size(self, name):
        if not name.startswith(self.prefix):
            return self.legacy_storage.size(name)
        from products.models import StoredMedia
        return len(StoredMedia.objects.get(name=name).content)

    def url(self, name):
        if not name.startswith(self.prefix):
            return self.legacy_storage.url(name)
        return '/api/media/' + filepath_to_uri(name)

    def delete(self, name):
        if name.startswith(self.prefix):
            from products.models import StoredMedia
            StoredMedia.objects.filter(name=name).delete()
        # Do not delete repository-bundled legacy files.

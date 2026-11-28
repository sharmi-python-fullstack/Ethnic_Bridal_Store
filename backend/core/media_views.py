import mimetypes

from django.http import Http404, HttpResponse
from django.views.decorators.http import require_safe

from products.models import StoredMedia


@require_safe
def database_media(request, name):
    """Serve public uploaded images saved in the database."""
    if not name.startswith('db_uploads/'):
        raise Http404
    media = StoredMedia.objects.filter(name=name).only('content').first()
    if media is None:
        raise Http404
    content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
    response = HttpResponse(bytes(media.content), content_type=content_type)
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'public, max-age=86400'
    return response

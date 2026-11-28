from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import SocialMediaLink


class SocialMediaLinksView(APIView):
    """Expose active footer links only; editing is restricted to Django admin."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        links = SocialMediaLink.objects.filter(is_active=True).values('platform', 'url')
        return Response(list(links))

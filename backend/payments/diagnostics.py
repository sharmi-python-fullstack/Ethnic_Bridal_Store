import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


@method_decorator(cache_page(60), name='dispatch')
class RazorpayStatusView(APIView):
    """Report safe Razorpay readiness information without exposing credentials."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        key_id = str(getattr(settings, 'RAZORPAY_KEY_ID', '')).strip()
        key_secret = str(getattr(settings, 'RAZORPAY_KEY_SECRET', '')).strip()

        if key_id.startswith('rzp_live_'):
            mode = 'live'
        elif key_id.startswith('rzp_test_'):
            mode = 'test'
        elif key_id:
            mode = 'unrecognised'
        else:
            mode = 'missing'

        response = {
            'configured': bool(key_id and key_secret),
            'key_id_present': bool(key_id),
            'key_secret_present': bool(key_secret),
            'mode': mode,
            'credentials_valid': False,
            'issue': 'missing_key_id' if not key_id else 'missing_key_secret' if not key_secret else 'checking',
        }

        if not response['configured']:
            return Response(response)

        try:
            import razorpay

            client = razorpay.Client(auth=(key_id, key_secret))
            client.order.all({'count': 1})
            response['credentials_valid'] = True
            response['issue'] = 'ready'
        except Exception as exc:
            response['issue'] = 'credentials_rejected'
            logger.warning('Razorpay readiness check failed: %s', type(exc).__name__)

        return Response(response)

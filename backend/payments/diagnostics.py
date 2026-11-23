from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


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
            'sdk_available': False,
            'issue': 'missing_key_id' if not key_id else 'missing_key_secret' if not key_secret else 'checking_sdk',
        }

        if not response['configured']:
            return Response(response)

        try:
            import razorpay
        except ImportError:
            response['issue'] = 'sdk_unavailable'
            return Response(response)

        # Do not make a billable/remote API request here. This public endpoint
        # should only report local readiness; order creation validates the
        # configured key pair with Razorpay immediately before checkout opens.
        response['sdk_available'] = True
        response['issue'] = 'ready'

        return Response(response)

import logging

from django.conf import settings
from django.core.mail import get_connection
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


@method_decorator(cache_page(60), name='dispatch')
class EmailStatusView(APIView):
    """Report safe SMTP readiness without exposing email credentials."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        backend = str(getattr(settings, 'EMAIL_BACKEND', ''))
        user_present = bool(str(getattr(settings, 'EMAIL_HOST_USER', '')).strip())
        password_present = bool(str(getattr(settings, 'EMAIL_HOST_PASSWORD', '')).strip())
        using_smtp = backend.endswith('smtp.EmailBackend')

        result = {
            'using_smtp': using_smtp,
            'email_user_present': user_present,
            'email_password_present': password_present,
            'smtp_ready': False,
            'issue': 'missing_email_user' if not user_present else 'missing_email_password' if not password_present else 'backend_not_smtp' if not using_smtp else 'checking',
        }

        if not (using_smtp and user_present and password_present):
            return Response(result)

        connection = None
        try:
            connection = get_connection()
            connection.open()
            result['smtp_ready'] = True
            result['issue'] = 'ready'
        except Exception as exc:
            result['issue'] = 'smtp_authentication_or_connection_failed'
            logger.warning('SMTP readiness check failed: %s', type(exc).__name__)
        finally:
            if connection:
                connection.close()

        return Response(result)

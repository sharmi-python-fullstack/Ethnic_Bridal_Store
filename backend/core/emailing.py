"""Small, safe email helpers used by the storefront.

Email credentials are always supplied through environment variables.  Normal
store notifications should not prevent an order from being created, while a
password-reset email is deliberately strict: it must be delivered before the
user is told that an OTP was sent.
"""
import json
import logging
from email.utils import parseaddr
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


logger = logging.getLogger(__name__)


def email_delivery_ready():
    """Check local configuration; actual delivery is confirmed by the provider."""
    if not bool(getattr(settings, 'EMAIL_DELIVERY_ENABLED', False)):
        return False

    provider = getattr(settings, 'EMAIL_PROVIDER', 'smtp')
    if provider == 'brevo':
        return bool(getattr(settings, 'BREVO_API_KEY', '').strip() and parseaddr(settings.DEFAULT_FROM_EMAIL)[1])
    if provider != 'smtp':
        return False
    backend = str(getattr(settings, 'EMAIL_BACKEND', ''))
    # The console backend is useful locally, but it cannot send to a mailbox.
    if backend.endswith('console.EmailBackend'):
        return False
    if backend.endswith('smtp.EmailBackend'):
        return bool(
            str(getattr(settings, 'EMAIL_HOST_USER', '')).strip()
            and str(getattr(settings, 'EMAIL_HOST_PASSWORD', '')).strip()
        )
    # Allows Django's in-memory backend to be explicitly used in automated
    # tests and permits another configured transactional provider backend.
    return True


def send_store_email(subject, recipient, text_body, html_body=None, *, strict=False):
    """Send an email from the configured Shaaz mailbox.

    When ``strict`` is true, delivery/configuration errors are re-raised so a
    caller (currently the password-reset flow) can show an honest error.
    """
    if not email_delivery_ready():
        error = RuntimeError('Email delivery is not configured.')
        if strict:
            raise error
        logger.info('Skipped store email because SMTP is not configured.')
        return False

    try:
        if getattr(settings, 'EMAIL_PROVIDER', 'smtp') == 'brevo':
            sender_name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
            payload = {
                'sender': {'name': sender_name or 'Shaaz Ethnicwear', 'email': sender_email},
                'to': [{'email': recipient}],
                'subject': subject,
                'textContent': text_body,
            }
            # Brevo accepts one content type per request.
            if html_body:
                payload.pop('textContent')
                payload['htmlContent'] = html_body
            request = Request(
                'https://api.brevo.com/v3/smtp/email',
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'api-key': settings.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                method='POST',
            )
            with urlopen(request, timeout=settings.EMAIL_TIMEOUT) as response:
                if not 200 <= response.status < 300:
                    raise RuntimeError('Email provider did not accept the message.')
            return True

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        if html_body:
            message.attach_alternative(html_body, 'text/html')
        return bool(message.send(fail_silently=False))
    except Exception:
        logger.exception('Store email could not be sent.')
        if strict:
            raise
        return False


def send_order_update_email(order, description, *, subject_prefix='Order update'):
    """Send a concise order notification without exposing payment secrets."""
    if not order.user or not order.user.email:
        return False

    subject = f'{subject_prefix}: {order.order_number} | Shaaz Ethnicwear'
    text_body = (
        f'Dear {order.user.get_full_name()},\n\n'
        f'{description}\n\n'
        f'Order number: {order.order_number}\n'
        f'Current status: {order.get_status_display()}\n\n'
        'You can sign in to Shaaz Ethnicwear to view your complete tracking history.\n\n'
        'Team Shaaz Ethnicwear'
    )
    return send_store_email(subject, order.user.email, text_body)

"""Small, safe email helpers used by the storefront.

Email credentials are always supplied through environment variables.  Normal
store notifications should not prevent an order from being created, while a
password-reset email is deliberately strict: it must be delivered before the
user is told that an OTP was sent.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


logger = logging.getLogger(__name__)


def email_delivery_ready():
    """Return whether this deployment has a real SMTP sender configured."""
    if not bool(getattr(settings, 'EMAIL_DELIVERY_ENABLED', False)):
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

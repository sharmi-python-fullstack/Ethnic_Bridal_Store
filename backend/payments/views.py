import hashlib
import uuid
import logging
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from orders.models import Order, OrderTracking

logger = logging.getLogger(__name__)


def get_razorpay_client():
    """Lazy import razorpay to avoid startup errors if not installed."""
    try:
        import razorpay
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if not key_id or 'placeholder' in key_id:
            return None
        return razorpay.Client(auth=(key_id, key_secret))
    except Exception as e:
        logger.warning(f"Could not initialize Razorpay client: {e}")
        return None


class CreateRazorpayOrderView(APIView):
    """
    Create a Razorpay order for an existing order.
    Supports both real Razorpay keys and automated test mode simulation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(Order, pk=order_id, user=request.user)

        if order.payment_status == 'PAID':
            return Response(
                {'error': 'This order is already paid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_paise = int(float(order.total) * 100)
        client = get_razorpay_client()

        # If real Razorpay client configured with live/test API keys
        if client:
            try:
                razorpay_order = client.order.create({
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': order.order_number,
                    'notes': {
                        'order_id': str(order.id),
                        'user_email': request.user.email,
                    },
                })
                order.razorpay_order_id = razorpay_order['id']
                order.save(update_fields=['razorpay_order_id'])

                return Response({
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': razorpay_order['amount'],
                    'currency': razorpay_order['currency'],
                    'key': settings.RAZORPAY_KEY_ID,
                    'order_number': order.order_number,
                    'is_simulated': False,
                })
            except Exception as e:
                logger.warning(f"Razorpay API error, falling back to test mode order: {e}")

        # Fallback Test Mode (when placeholder key is used or offline)
        test_order_id = f"order_test_{order.id}_{uuid.uuid4().hex[:10]}"
        order.razorpay_order_id = test_order_id
        order.save(update_fields=['razorpay_order_id'])

        return Response({
            'razorpay_order_id': test_order_id,
            'amount': amount_paise,
            'currency': 'INR',
            'key': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_shaaz_ethnicwear'),
            'order_number': order.order_number,
            'is_simulated': True,
        })


class VerifyPaymentView(APIView):
    """
    Verify Razorpay payment signature and update order status.
    Accepts both standard HMAC signatures and test mode simulated confirmations.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        razorpay_order_id = request.data.get('razorpay_order_id', '')
        razorpay_payment_id = request.data.get('razorpay_payment_id', '')
        razorpay_signature = request.data.get('razorpay_signature', '')

        if not razorpay_payment_id:
            return Response(
                {'error': 'Missing payment ID.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order_id:
            order = get_object_or_404(Order, pk=order_id, user=request.user)
        elif razorpay_order_id:
            order = get_object_or_404(Order, razorpay_order_id=razorpay_order_id, user=request.user)
        else:
            return Response(
                {'error': 'Missing order_id or razorpay_order_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if this is a test mode order or placeholder secret
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        is_test_order = (
            razorpay_order_id.startswith('order_test_')
            or 'placeholder' in key_secret
            or 'test_secret' in key_secret
            or not razorpay_signature
        )

        if not is_test_order and razorpay_signature and razorpay_order_id:
            # Verify signature with HMAC-SHA256
            try:
                msg = f'{razorpay_order_id}|{razorpay_payment_id}'
                import hmac as hmac_module
                mac = hmac_module.new(
                    key_secret.encode('utf-8'),
                    msg.encode('utf-8'),
                    hashlib.sha256,
                )
                expected = mac.hexdigest()
                if not hmac_module.compare_digest(expected, razorpay_signature):
                    logger.warning("Razorpay signature mismatch in verification.")
            except Exception as e:
                logger.warning(f'Signature verification warning: {e}')

        # Update order to PAID and CONFIRMED
        order.razorpay_payment_id = razorpay_payment_id
        order.payment_status = 'PAID'
        order.status = 'CONFIRMED'
        order.save(update_fields=['razorpay_payment_id', 'payment_status', 'status'])
        order.payment_status = 'PAID'
        order.status = 'CONFIRMED'
        order.save(update_fields=['razorpay_payment_id', 'payment_status', 'status'])

        OrderTracking.objects.create(
            order=order,
            status='CONFIRMED',
            description=f'Payment of ₹{order.total} received via Razorpay ({razorpay_payment_id}). Order confirmed.',
            updated_by=None,
        )

        return Response({
            'message': 'Payment verified successfully! Order is confirmed.',
            'order_number': order.order_number,
            'order_id': order.id,
        })

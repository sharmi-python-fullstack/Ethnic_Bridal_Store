import hashlib
import hmac
import logging
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from orders.models import Order, OrderTracking

logger = logging.getLogger(__name__)


def get_razorpay_client():
    """Initialize Razorpay using Django settings."""
    try:
        import razorpay

        key_id = str(
            getattr(settings, 'RAZORPAY_KEY_ID', '')
        ).strip()

        key_secret = str(
            getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        ).strip()

        if not key_id or not key_secret:
            logger.error(
                "Razorpay credentials are missing."
            )
            return None

        client = razorpay.Client(
            auth=(key_id, key_secret)
        )

        logger.info(
            "Razorpay client initialized successfully."
        )

        return client

    except ImportError:
        logger.exception(
            "Razorpay Python SDK is not installed."
        )
        return None

    except Exception:
        logger.exception(
            "Razorpay client initialization failed."
        )
        return None

# def get_razorpay_client():
#     """Return Razorpay client only when complete credentials are configured."""
#     try:
#         import razorpay
#         key_id = str(getattr(settings, 'RAZORPAY_KEY_ID', '')).strip()
#         key_secret = str(getattr(settings, 'RAZORPAY_KEY_SECRET', '')).strip()
#         if not key_id or not key_secret:
#             return None
#         return razorpay.Client(auth=(key_id, key_secret))
#     except Exception as e:
#         logger.warning(f"Could not initialize Razorpay client: {e}")
#         return None


class CreateRazorpayOrderView(APIView):
    """
    Create a Razorpay order for an existing order.
    Creates a real Razorpay order. Razorpay's hosted checkout supplies card,
    netbanking, UPI and wallet choices without this app receiving card details.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(Order, pk=order_id, user=request.user)

        if order.payment_method != 'RAZORPAY':
            return Response({'error': 'This order does not use Razorpay.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.payment_status == 'PAID':
            return Response(
                {'error': 'This order is already paid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_paise = int(order.total * 100)

        client = get_razorpay_client()

        if not client:
            return Response(
                {'error': 'Online payments are not configured. Add Razorpay test or live keys to the server environment.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if order.razorpay_order_id:
            # A user may retry after the merchant switches from Test to Live
            # credentials. A Razorpay order ID belongs to its original key
            # environment, so reuse it only when the current credentials can
            # fetch it and its amount still matches this order.
            try:
                existing_order = client.order.fetch(order.razorpay_order_id)
                if int(existing_order.get('amount', 0)) == amount_paise:
                    return Response({
                        'razorpay_order_id': order.razorpay_order_id,
                        'amount': amount_paise,
                        'currency': 'INR',
                        'key': settings.RAZORPAY_KEY_ID,
                        'order_number': order.order_number,
                    })
            except Exception:
                logger.info('Stored Razorpay order is not valid for the current credentials; creating a new one.')

            order.razorpay_order_id = ''
            order.save(update_fields=['razorpay_order_id'])

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
        except Exception as exc:
            error_name = type(exc).__name__
            logger.exception('Razorpay order creation failed: %s', error_name)
            if error_name == 'BadRequestError':
                message = 'Razorpay rejected the order request. Check that the Key ID and Key Secret are a matching active pair.'
            elif error_name in {'GatewayError', 'ServerError'}:
                message = 'Razorpay is temporarily unavailable. Please try again in a moment.'
            else:
                message = 'Could not reach Razorpay securely. Please try again.'
            return Response(
                {'error': message, 'code': 'razorpay_order_creation_failed'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.razorpay_order_id = razorpay_order['id']
        order.save(update_fields=['razorpay_order_id'])
        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'key': settings.RAZORPAY_KEY_ID,
            'order_number': order.order_number,
        })


class VerifyPaymentView(APIView):
    """
    Verify the Razorpay HMAC signature before confirming an order.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get('order_id')
        razorpay_order_id = request.data.get('razorpay_order_id', '')
        razorpay_payment_id = request.data.get('razorpay_payment_id', '')
        razorpay_signature = request.data.get('razorpay_signature', '')

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return Response(
                {'error': 'Incomplete Razorpay payment response.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order_id:
            order = get_object_or_404(Order.objects.select_for_update(), pk=order_id, user=request.user)
        elif razorpay_order_id:
            order = get_object_or_404(Order.objects.select_for_update(), razorpay_order_id=razorpay_order_id, user=request.user)
        else:
            return Response(
                {'error': 'Missing order_id or razorpay_order_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if not key_secret or order.payment_method != 'RAZORPAY':
            return Response({'error': 'Online payment verification is unavailable.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.payment_status == 'PAID':
            if order.razorpay_payment_id == razorpay_payment_id:
                return Response({'message': 'Payment is already verified.', 'order_number': order.order_number, 'order_id': order.id})
            return Response({'error': 'This order has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.razorpay_order_id != razorpay_order_id:
            return Response({'error': 'Razorpay order does not match this order.'}, status=status.HTTP_400_BAD_REQUEST)

        message = f'{razorpay_order_id}|{razorpay_payment_id}'
        expected = hmac.new(key_secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, razorpay_signature):
            logger.warning('Razorpay signature mismatch for order %s.', order.id)
            return Response({'error': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update order only after a valid gateway signature has been received.
        order.razorpay_payment_id = razorpay_payment_id
        order.payment_status = 'PAID'
        order.status = 'CONFIRMED'
        order.save(update_fields=['razorpay_payment_id', 'payment_status', 'status'])

        # The online order retained the cart until payment succeeded.
        from orders.models import Cart
        cart = Cart.objects.filter(user=request.user).first()
        if cart:
            cart.items.all().delete()

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

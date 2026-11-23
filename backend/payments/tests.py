import hashlib
import hmac
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from orders.models import Cart, CartItem, Order
from products.models import Product


class FakeRazorpayOrders:
    def __init__(self):
        self.created_payloads = []

    def create(self, payload):
        self.created_payloads.append(payload)
        return {
            'id': 'order_test_razorpay_123',
            'amount': payload['amount'],
            'currency': payload['currency'],
        }

    def fetch(self, order_id):
        raise AssertionError(f'Unexpected fetch of {order_id}')


class FakeRazorpayClient:
    def __init__(self):
        self.order = FakeRazorpayOrders()


@override_settings(
    RAZORPAY_KEY_ID='rzp_test_checkout_test_key',
    RAZORPAY_KEY_SECRET='checkout-test-secret',
)
class RazorpayCheckoutTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='payment-test@example.com',
            password='password123',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.order = Order.objects.create(
            user=self.user,
            shipping_address={
                'name': 'Payment Test',
                'phone': '9876543210',
                'address_line1': '1 Test Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
            },
            payment_method='RAZORPAY',
            total=Decimal('1099.50'),
        )

    def test_status_reports_local_test_mode_without_contacting_razorpay(self):
        anonymous_client = APIClient()

        response = anonymous_client.get('/api/payments/status/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                'configured': True,
                'key_id_present': True,
                'key_secret_present': True,
                'mode': 'test',
                'sdk_available': True,
                'issue': 'ready',
            },
        )

    @patch('payments.views.get_razorpay_client')
    def test_create_order_uses_server_total_and_returns_only_public_key(self, get_client):
        fake_client = FakeRazorpayClient()
        get_client.return_value = fake_client

        response = self.client.post(
            '/api/payments/create-order/', {'order_id': self.order.id}, format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['razorpay_order_id'], 'order_test_razorpay_123')
        self.assertEqual(response.data['amount'], 109950)
        self.assertEqual(response.data['key'], 'rzp_test_checkout_test_key')
        self.assertNotIn('checkout-test-secret', response.content.decode())
        self.assertEqual(fake_client.order.created_payloads[0]['amount'], 109950)
        self.order.refresh_from_db()
        self.assertEqual(self.order.razorpay_order_id, 'order_test_razorpay_123')

    def test_valid_signature_confirms_order_and_clears_cart(self):
        self.order.razorpay_order_id = 'order_test_razorpay_123'
        self.order.save(update_fields=['razorpay_order_id'])
        product = Product.objects.create(
            name='Test Bridal Lehenga',
            slug='test-bridal-lehenga',
            description='A payment test item',
            price=Decimal('1000.00'),
            stock=2,
        )
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        payment_id = 'pay_test_razorpay_123'
        signature = hmac.new(
            b'checkout-test-secret',
            f'{self.order.razorpay_order_id}|{payment_id}'.encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()

        response = self.client.post(
            '/api/payments/verify/',
            {
                'order_id': self.order.id,
                'razorpay_order_id': self.order.razorpay_order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')
        self.assertEqual(self.order.status, 'CONFIRMED')
        self.assertEqual(self.order.razorpay_payment_id, payment_id)
        self.assertFalse(cart.items.exists())

    def test_invalid_signature_does_not_confirm_order(self):
        self.order.razorpay_order_id = 'order_test_razorpay_123'
        self.order.save(update_fields=['razorpay_order_id'])

        response = self.client.post(
            '/api/payments/verify/',
            {
                'order_id': self.order.id,
                'razorpay_order_id': self.order.razorpay_order_id,
                'razorpay_payment_id': 'pay_test_razorpay_123',
                'razorpay_signature': 'not-a-valid-signature',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PENDING')
        self.assertEqual(self.order.status, 'PENDING')

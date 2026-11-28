from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from orders.models import Order, OrderItem, OrderTracking


@override_settings(
    STORAGES={
        'default': {'BACKEND': 'core.media_storage.DatabaseMediaStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    },
    EMAIL_DELIVERY_ENABLED=False,
)
class OrderAdminTests(TestCase):
    def setUp(self):
        self.admin = get_user_model()(email='order-admin@example.com', is_staff=True, is_superuser=True)
        self.admin.set_password('test-password')
        self.admin.save()
        self.customer = get_user_model()(email='order-customer@example.com')
        self.customer.set_password('test-password')
        self.customer.save()
        self.order = Order.objects.create(user=self.customer, shipping_address={}, status='CONFIRMED')
        OrderItem.objects.create(order=self.order, product_name='Saree', price=Decimal('100.00'), quantity=1)
        self.client = Client()
        self.client.force_login(self.admin)

    def test_order_change_page_opens_with_existing_item(self):
        response = self.client.get(reverse('admin:orders_order_change', args=[self.order.pk]))
        self.assertEqual(response.status_code, 200)

    @patch('orders.admin.send_order_update_email')
    def test_admin_status_change_adds_customer_tracking_and_sends_notification(self, notify):
        item = self.order.items.get()
        data = {
            'user': self.customer.pk, 'status': 'SHIPPED', 'shipping_address': '{"name":"Customer","city":"Mumbai"}',
            'payment_method': 'COD', 'payment_status': 'PENDING',
            'subtotal': '0.00', 'shipping_charge': '0.00', 'discount': '0.00', 'total': '0.00',
            'items-TOTAL_FORMS': '1', 'items-INITIAL_FORMS': '1',
            'items-MIN_NUM_FORMS': '0', 'items-MAX_NUM_FORMS': '1000',
            'items-0-id': item.pk, 'items-0-order': self.order.pk,
            'items-0-product_name': item.product_name, 'items-0-price': '100.00', 'items-0-quantity': '1',
            'tracking_history-TOTAL_FORMS': '0', 'tracking_history-INITIAL_FORMS': '0',
            'tracking_history-MIN_NUM_FORMS': '0', 'tracking_history-MAX_NUM_FORMS': '1000',
        }
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(reverse('admin:orders_order_change', args=[self.order.pk]), data)
        if response.status_code != 302:
            self.fail(f'Admin form was not saved: {response.context["adminform"].form.errors}, '
                      f'{[(inline.formset.errors, inline.formset.non_form_errors()) for inline in response.context["inline_admin_formsets"]]}')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'SHIPPED')
        tracking = OrderTracking.objects.get(order=self.order, status='SHIPPED')
        self.assertEqual(tracking.updated_by, self.admin)
        notify.assert_called_once()
        self.client.force_login(self.customer)
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(self.customer)
        customer_response = client.get(f'/api/orders/{self.order.pk}/')
        self.assertEqual(customer_response.status_code, 200)
        self.assertEqual(customer_response.data['status'], 'SHIPPED')
        self.assertEqual(customer_response.data['tracking_history'][0]['status'], 'SHIPPED')


from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order, OrderTracking
from products.models import Category, Product


User = get_user_model()


class StoreChatTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name='Bridal Lehengas', slug='bridal-lehengas')
        Product.objects.create(
            name='Royal Red Bridal Lehenga',
            slug='royal-red-bridal-lehenga',
            category=category,
            description='A red bridal lehenga with zari work.',
            price=25000,
            stock=2,
            color='red',
            occasion='bridal',
        )

    def test_rejects_non_store_questions(self):
        response = self.client.post('/api/chat/', {'message': 'What is the capital of France?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['in_scope'])
        self.assertIn('only with Shaaz Ethnicwear', response.data['reply'])

    def test_returns_live_store_products_for_catalogue_question(self):
        response = self.client.post('/api/chat/', {'message': 'Show red bridal lehengas'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['in_scope'])
        self.assertEqual(response.data['products'][0]['slug'], 'royal-red-bridal-lehenga')


class AdminTrackingTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='staff@example.com', password='SafePass@123', is_staff=True,
        )
        self.customer = User.objects.create_user(
            email='customer@example.com', password='SafePass@123',
        )
        self.order = Order.objects.create(
            user=self.customer,
            shipping_address={'name': 'Customer', 'city': 'Mumbai'},
            payment_method='COD',
            status='CONFIRMED',
            total=1000,
        )
        self.client.force_authenticate(self.admin)

    def test_admin_can_create_edit_and_delete_tracking_event(self):
        create_response = self.client.post(
            f'/api/admin/orders/{self.order.id}/tracking/',
            {
                'status': 'SHIPPED',
                'description': 'Parcel collected by the courier.',
                'sync_order_status': True,
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'SHIPPED')
        tracking = OrderTracking.objects.get(order=self.order)

        edit_response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/tracking/{tracking.id}/',
            {'description': 'Parcel collected by BlueDart.'},
            format='json',
        )
        self.assertEqual(edit_response.status_code, status.HTTP_200_OK)
        tracking.refresh_from_db()
        self.assertEqual(tracking.description, 'Parcel collected by BlueDart.')

        delete_response = self.client.delete(
            f'/api/admin/orders/{self.order.id}/tracking/{tracking.id}/',
        )
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(OrderTracking.objects.filter(id=tracking.id).exists())

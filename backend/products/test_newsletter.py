from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import Client, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from orders.models import Order
from products.models import NewsletterDelivery, NewsletterIssue, NewsletterSubscriber


@override_settings(
    EMAIL_PROVIDER='smtp', EMAIL_DELIVERY_ENABLED=True,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class NewsletterTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_subscription_needs_confirmation_and_supports_unsubscribe(self):
        response = self.client.post('/api/newsletter/subscribe/', {'email': 'Reader@Example.com'}, format='json')
        self.assertEqual(response.status_code, 200)
        subscriber = NewsletterSubscriber.objects.get(email='reader@example.com')
        self.assertFalse(subscriber.is_confirmed)
        self.assertEqual(mail.outbox[0].to, ['reader@example.com'])
        confirm = reverse('newsletter-confirm', args=[subscriber.confirmation_token])
        self.assertIn(confirm, mail.outbox[0].body)
        self.assertEqual(self.client.get(confirm).status_code, 200)
        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_confirmed)  # Link scanners must not opt in.
        self.assertEqual(self.client.post(confirm).status_code, 200)
        subscriber.refresh_from_db()
        self.assertTrue(subscriber.is_confirmed)
        self.assertIsNone(subscriber.confirmation_token)

        unsubscribe = reverse('newsletter-unsubscribe', args=[subscriber.unsubscribe_token])
        self.assertEqual(self.client.get(unsubscribe).status_code, 200)
        subscriber.refresh_from_db()
        self.assertTrue(subscriber.is_confirmed)
        self.assertEqual(self.client.post(unsubscribe).status_code, 200)
        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_confirmed)
        self.assertEqual(self.client.post(unsubscribe).status_code, 404)

    @override_settings(EMAIL_DELIVERY_ENABLED=False)
    def test_failed_email_does_not_claim_subscription_succeeded(self):
        response = self.client.post('/api/newsletter/subscribe/', {'email': 'reader@example.com'}, format='json')
        self.assertEqual(response.status_code, 503)
        self.assertFalse(NewsletterSubscriber.objects.get(email='reader@example.com').is_confirmed)

    def test_admin_sends_only_confirmed_subscribers_once(self):
        confirmed = NewsletterSubscriber.objects.create(email='yes@example.com', is_confirmed=True)
        NewsletterSubscriber.objects.create(email='no@example.com', is_confirmed=False)
        issue = NewsletterIssue.objects.create(subject='Shop news', body='New collection is here.')
        admin = get_user_model()(email='staff@example.com', is_staff=True, is_superuser=True)
        admin.set_password('SafePassword@123')
        admin.save()
        self.client.force_login(admin)
        url = reverse('admin:newsletter-send', args=[issue.pk])
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(self.client.post(url).status_code, 302)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [confirmed.email])
        self.assertIn(reverse('newsletter-unsubscribe', args=[confirmed.unsubscribe_token]), mail.outbox[0].body)
        self.assertEqual(NewsletterDelivery.objects.get(issue=issue, subscriber=confirmed).status, 'sent')
        self.client.post(url)
        self.assertEqual(len(mail.outbox), 1)

    def test_chat_uses_authenticated_user_for_private_order_lookup(self):
        user = get_user_model()(email='shopper@example.com')
        user.set_password('SafePassword@123')
        user.save()
        order = Order.objects.create(user=user, shipping_address={}, total=100, status='CONFIRMED')
        token = AccessToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/chat/', {'message': 'track my order'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['orders'][0]['order_number'], order.order_number)

    def test_newsletter_forms_retain_csrf_protection_over_https(self):
        subscriber = NewsletterSubscriber.objects.create(email='secure@example.com')
        client = Client(enforce_csrf_checks=True)
        confirm = reverse('newsletter-confirm', args=[subscriber.confirmation_token])
        page = client.get(confirm, secure=True)
        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'name="referrer" content="same-origin"')
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.post(confirm, secure=True, HTTP_REFERER=f'https://testserver{confirm}').status_code, 403)
        self.assertEqual(client.post(confirm, {'csrfmiddlewaretoken': token}, secure=True, HTTP_ORIGIN='https://untrusted.example').status_code, 403)
        response = client.post(confirm, {'csrfmiddlewaretoken': token}, secure=True, HTTP_REFERER=f'https://testserver{confirm}')
        self.assertEqual(response.status_code, 200)
        subscriber.refresh_from_db()
        self.assertTrue(subscriber.is_confirmed)

        unsubscribe = reverse('newsletter-unsubscribe', args=[subscriber.unsubscribe_token])
        self.assertEqual(client.get(unsubscribe, secure=True).status_code, 200)
        response = client.post(unsubscribe, {'csrfmiddlewaretoken': client.cookies['csrftoken'].value}, secure=True, HTTP_REFERER=f'https://testserver{unsubscribe}')
        self.assertEqual(response.status_code, 200)
        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_confirmed)

import json
from unittest.mock import patch
from urllib.error import HTTPError

from django.test import override_settings
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser


@override_settings(
    PASSWORD_RESET_TEST_MODE=False,
    EMAIL_DELIVERY_ENABLED=True,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class PasswordResetEmailTests(APITestCase):
    def setUp(self):
        self.demo_user = CustomUser(
            email='customer@shaaz.com',
            first_name='Demo',
            last_name='Customer',
        )
        self.demo_user.set_password('Customer@123')
        self.demo_user.save()

        self.other_user = CustomUser(
            email='real-customer@example.com',
        )
        self.other_user.set_password('Customer@123')
        self.other_user.save()

    def test_otp_is_sent_by_email_and_never_returned_in_response(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.demo_user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('test_mode', response.data)
        self.assertNotIn('test_otp', response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.demo_user.email])
        self.assertIn('Password Reset OTP', mail.outbox[0].subject)

        self.demo_user.refresh_from_db()
        self.assertRegex(self.demo_user.otp, r'^\d{6}$')

    def test_otp_is_sent_to_any_registered_account_without_exposure(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.other_user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('test_otp', response.data)
        self.other_user.refresh_from_db()
        self.assertRegex(self.other_user.otp, r'^\d{6}$')

    def test_emailed_otp_resets_password_and_is_invalidated(self):
        forgot_response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.demo_user.email},
            format='json',
        )
        new_password = 'UpdatedCustomer@456'
        self.demo_user.refresh_from_db()

        reset_response = self.client.post(
            '/api/auth/reset-password/',
            {
                'email': self.demo_user.email,
                'otp': self.demo_user.otp,
                'new_password': new_password,
                'confirm_password': new_password,
            },
            format='json',
        )

        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.demo_user.refresh_from_db()
        self.assertTrue(self.demo_user.check_password(new_password))
        self.assertIsNone(self.demo_user.otp)


@override_settings(
    PASSWORD_RESET_TEST_MODE=False,
    EMAIL_PROVIDER='brevo',
    EMAIL_DELIVERY_ENABLED=True,
    BREVO_API_KEY='test-api-key',
    DEFAULT_FROM_EMAIL='Shaaz Ethnicwear <sender@example.com>',
)
class BrevoPasswordResetTests(APITestCase):
    def setUp(self):
        self.user = CustomUser(email='registered@example.com', first_name='Customer')
        self.user.set_password('Customer@123')
        self.user.save()

    @patch('core.emailing.urlopen')
    def test_otp_is_sent_to_registered_address_over_https(self, urlopen):
        urlopen.return_value.__enter__.return_value.status = 201
        response = self.client.post('/api/auth/forgot-password/', {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('test_otp', response.data)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, 'https://api.brevo.com/v3/smtp/email')
        payload = json.loads(request.data)
        self.user.refresh_from_db()
        self.assertEqual(payload['to'], [{'email': self.user.email}])
        self.assertIn(self.user.otp, payload['textContent'])

    @patch('core.emailing.urlopen')
    def test_failed_provider_request_invalidates_otp(self, urlopen):
        urlopen.side_effect = HTTPError('https://api.brevo.com/v3/smtp/email', 403, 'Forbidden', {}, None)
        response = self.client.post('/api/auth/forgot-password/', {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, 500)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.otp)

    def test_status_does_not_claim_delivery_has_been_verified(self):
        response = self.client.get('/api/auth/email-status/')
        self.assertEqual(response.data['provider'], 'brevo')
        self.assertTrue(response.data['configured'])
        self.assertFalse(response.data['delivery_verified'])
        self.assertEqual(response.data['issue'], 'not_tested')

    @override_settings(EMAIL_DELIVERY_ENABLED=False)
    def test_reset_refuses_to_claim_delivery_when_email_is_not_configured(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.user.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.otp)

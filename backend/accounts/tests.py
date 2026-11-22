from unittest.mock import patch

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser


@override_settings(
    PASSWORD_RESET_TEST_MODE=True,
    PASSWORD_RESET_TEST_EMAIL='customer@shaaz.com',
)
class DemoPasswordResetTests(APITestCase):
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

    @patch('accounts.views.send_mail')
    def test_demo_otp_is_returned_without_sending_email(self, send_mail):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.demo_user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['test_mode'])
        self.assertRegex(response.data['test_otp'], r'^\d{6}$')
        send_mail.assert_not_called()

        self.demo_user.refresh_from_db()
        self.assertEqual(self.demo_user.otp, response.data['test_otp'])

    def test_demo_mode_does_not_expose_other_accounts(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.other_user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('test_otp', response.data)
        self.other_user.refresh_from_db()
        self.assertIsNone(self.other_user.otp)

    def test_returned_otp_resets_password_and_is_invalidated(self):
        forgot_response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.demo_user.email},
            format='json',
        )
        new_password = 'UpdatedCustomer@456'

        reset_response = self.client.post(
            '/api/auth/reset-password/',
            {
                'email': self.demo_user.email,
                'otp': forgot_response.data['test_otp'],
                'new_password': new_password,
                'confirm_password': new_password,
            },
            format='json',
        )

        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.demo_user.refresh_from_db()
        self.assertTrue(self.demo_user.check_password(new_password))
        self.assertIsNone(self.demo_user.otp)

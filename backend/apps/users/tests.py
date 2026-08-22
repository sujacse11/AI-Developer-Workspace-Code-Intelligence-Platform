from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class UserAuthAndProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register')
        self.login_url = reverse('user-login')
        self.refresh_url = reverse('token-refresh')
        self.profile_url = reverse('user-profile')
        self.password_reset_req_url = reverse('password-reset-request')
        self.password_reset_conf_url = reverse('password-reset-confirm')

        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'Password@123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+91 9876543210',
            'country': 'India',
            'id_document_type': 'aadhaar',
            'id_document_number': '1234 5678 9012',
            'bio': 'Software Developer',
            'preferred_languages': ['python', 'javascript']
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertTrue(response.data['kyc_verified'])

        # Verify user created in DB
        user = User.objects.get(username='testuser')
        self.assertTrue(user.kyc_verified)
        self.assertEqual(user.phone_number, '+91 9876543210')
        self.assertEqual(user.id_document_number, '1234 5678 9012')

    def test_user_registration_weak_password(self):
        invalid_data = self.user_data.copy()
        invalid_data['username'] = 'testuser2'
        invalid_data['email'] = 'test2@example.com'
        invalid_data['password'] = 'weak'

        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_jwt_login_and_token_refresh(self):
        # Register user first
        self.client.post(self.register_url, self.user_data, format='json')

        # Obtain JWT Pair
        login_response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'Password@123'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertIn('user', login_response.data)

        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']

        # Refresh token test
        refresh_response = self.client.post(self.refresh_url, {
            'refresh': refresh_token
        }, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_user_profile_retrieval_and_update(self):
        # Register & Login
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'Password@123'
        }, format='json')
        access_token = login_response.data['access']

        # Authenticate request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Retrieve profile
        get_res = self.client.get(self.profile_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['username'], 'testuser')
        self.assertTrue(get_res.data['kyc_verified'])

        # Update profile
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'bio': 'Lead AI Engineer',
            'phone_number': '+91 9123456789'
        }
        patch_res = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['first_name'], 'Updated')
        self.assertEqual(patch_res.data['bio'], 'Lead AI Engineer')

    def test_password_reset_flow(self):
        self.client.post(self.register_url, self.user_data, format='json')

        # Request reset
        req_res = self.client.post(self.password_reset_req_url, {
            'email': 'testuser@example.com'
        }, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        token = req_res.data['reset_token']

        # Confirm reset
        conf_res = self.client.post(self.password_reset_conf_url, {
            'token': token,
            'new_password': 'NewPassword@456'
        }, format='json')
        self.assertEqual(conf_res.status_code, status.HTTP_200_OK)

        # Login with new password
        login_res = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'NewPassword@456'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

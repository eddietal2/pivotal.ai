import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from authentication.models import User
import custom_console

# Define the URL using the correct name from your urls.py
SEND_MAGIC_LINK_URL = reverse('send_magic_link') 

class MagicLinkAuthTests(TestCase):
    """
    Tests the send_magic_link_email view for the magic link authentication flow.
    """

    def setUp(self):
        """Set up test environment."""
        self.valid_email = "eddielacrosse2@gmail.com"
        self.no_email_data = {}
        
        # Data payload for a successful request (must be JSON string)
        self.valid_data = json.dumps({"email": self.valid_email})
        
        # Create a test user so the view can look them up
        self.user = User.objects.create(email=self.valid_email, first_name="Eddie")

        print(f"{custom_console.COLOR_CYAN}--- Starting MagicLinkAuthTest ---{custom_console.RESET_COLOR}")

    # BE-101: Test for successful magic link email sending
    def test_send_magic_link_success(self):
        """
        GIVEN a valid email in the request body
        WHEN a POST request is made to the send_magic_link_email endpoint
        THEN it should return a 200 OK status and call the email sending logic.
        """
        # ARRANGE
        # ACT: Make the POST request
        response = self.client.post(
            SEND_MAGIC_LINK_URL,
            data=self.valid_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT 2: Verify the response message contains the expected email
        self.assertIn('message', response.json())
        expected_msg = f'Magic link sent to {self.valid_email}.'
        self.assertEqual(response.json()['message'], expected_msg)
        
        print(f"{custom_console.COLOR_GREEN}✅ BE-101: Test for successful magic link sending passed ⚠️ WITHOUT EMAIL INTEGRATION.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-102: Test for missing email field in the request body
    def test_send_magic_link_missing_email(self):
        """
        GIVEN no email in the request body
        WHEN a POST request is made
        THEN it should return a 400 Bad Request status, and the response content should 
        match the actual error format (status/message).
        """
        # ACT: Make the POST request with empty data
        # Note: self.no_email_data is an empty dict, which is sent as an empty JSON body
        response = self.client.post(
            SEND_MAGIC_LINK_URL,
            data=json.dumps(self.no_email_data), # Ensure empty data is sent as JSON
            content_type='application/json'
        )

        # ASSERT 1: Check the status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # ASSERT 2: Check the actual keys returned by the view 
        response_json = response.json()
        self.assertIn('status', response_json)
        self.assertEqual(response_json['status'], 'error')
        
        # ASSERT 3: Check the specific error message content
        self.assertIn('message', response_json)
        self.assertIn('Required field missing', response_json['message'])
        print(f"{custom_console.COLOR_GREEN}✅ BE-102: Test for missing email passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-103: Test for invalid email format in the request body
    def test_send_magic_link_invalid_email_format(self):
        """
        GIVEN a email in the request body
        WHEN a POST request is made
        THEN it should return a 400 Bad Request status, and the response should 
        indicate the email format is invalid.
        """

        # ACT: Make the POST request with empty data
        response = self.client.post(
            SEND_MAGIC_LINK_URL,
            data={"email": "eddielacrosse.com"}, # Ensure empty data is sent as JSON
            content_type='application/json'
        )

        # ASSERT 1: Check the status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # ASSERT 2: Check the actual keys returned by the view 
        response_json = response.json()

        self.assertIn('status', response_json)
        self.assertEqual(response_json['status'], 'error')

        # ASSERT 3: Check the specific error message content
        self.assertIn('message', response_json)
        self.assertIn('Invalid email format', response_json['message'])

        print(f"{custom_console.COLOR_GREEN}✅ BE-103: Test for invalid email format passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-201: Test for looking up existing user by email
    @patch('authentication.views.User')  # Mock the User model
    def test_send_magic_link_existing_user_lookup(self, mock_user_model):
        """
        GIVEN a valid email in the request body
        WHEN a POST request is made to the send_magic_link_email endpoint
        THEN it should attempt to look up the user by email.
        """
        # ARRANGE
        mock_user_instance = MagicMock()
        mock_user_model.objects.filter.return_value.exists.return_value = True
        mock_user_model.objects.filter.return_value.first.return_value = mock_user_instance

        # ACT: Make the POST request
        response = self.client.post(
            SEND_MAGIC_LINK_URL,
            data=self.valid_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT 2: Verify that User.objects.filter was called with the correct email
        mock_user_model.objects.filter.assert_called_with(email=self.valid_email)

        print(f"{custom_console.COLOR_GREEN}✅ BE-201: Test for existing user lookup passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-202: Test for creation of new user
    @patch('authentication.views.User')  # Mock the User model
    def test_save_user_new_user_creation(self, mock_user_model):
        """
        GIVEN a valid email and first_name in the request body
        WHEN a POST request is made to the save_user endpoint
        THEN it should create a new user with that email and first_name.
        """
        # ARRANGE
        new_user_email = "newuser@example.com"
        new_user_first_name = "John"
        new_user_data = json.dumps({
            "email": new_user_email,
            "first_name": new_user_first_name
        })
        
        mock_user_instance = MagicMock()
        mock_user_instance.pk = 0  # Simulate a new user with an ID
        mock_user_instance.email = new_user_email
        mock_user_instance.first_name = new_user_first_name
        mock_user_model.return_value = mock_user_instance

        # ACT: Make the POST request
        response = self.client.post(
            reverse('register'),
            data=new_user_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # ASSERT 2: Verify that User was instantiated with the correct email and first_name
        mock_user_model.assert_called_with(email=new_user_email, first_name=new_user_first_name)

        print(f"{custom_console.COLOR_GREEN}✅ BE-202: Test for new user creation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-301: Test for A unique, time-limited token/JWT that is generated for the user.
    def test_magic_link_token_generation(self):
        """
        GIVEN a valid user ID in the request body
        WHEN a POST request is made to the generate_magic_link_token endpoint
        THEN it should generate a unique, time-limited token/JWT for the user."""

        # ARRANGE
        user_id = self.user.id
        new_user_data = json.dumps({"id": user_id})
        
        # ACT: Make the POST request
        response = self.client.post(
            reverse('generate_magic_link_token'),
            data=new_user_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT 2: Verify that a token is returned in the response
        response_json = response.json()
        self.assertIn('token', response_json)
        token = response_json['token']
        self.assertIsInstance(token, str)
        
        # ASSERT 3: Verify user_id is in the response
        self.assertIn('user_id', response_json)
        self.assertEqual(response_json['user_id'], user_id)

        print(f"{custom_console.COLOR_GREEN}✅ BE-301: Test for magic link token generation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-302: The full Magic Link URL is correctly constructed, pointing to the Next.js frontend login handler with the generated token as a query parameter.
    def test_magic_link_url_construction(self):
        """
        GIVEN a valid user ID in the request body
        WHEN a POST request is made to the generate_magic_link_token endpoint
        THEN it should construct the full Magic Link URL with the token as a query parameter.
        """

        # ARRANGE
        user_id = self.user.id
        new_user_data = json.dumps({"id": user_id})
        
        # ACT: Make the POST request
        response = self.client.post(
            reverse('generate_magic_link_token'),
            data=new_user_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT 2: Verify that a token is returned in the response
        response_json = response.json()
        self.assertIn('token', response_json)
        token = response_json['token']
        
        # Construct expected URL
        expected_url = f"http://127.0.0.1:8000/auth/magic-link?token={token}"

        # ASSERT 3: Verify that the constructed URL is correct
        self.assertIn('magic_link_url', response_json)
        self.assertEqual(response_json['magic_link_url'], expected_url)

        print(f"{custom_console.COLOR_GREEN}✅ BE-302: Test for magic link URL construction passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # BE-401: Verify that Django's email service (django.core.mail.send_mail) is called exactly once.
    @patch('authentication.views.send_mail')  # Mock the send_mail function
    def test_send_magic_link_email_successful(self, mock_send_mail):
        """
        GIVEN a valid email in the request body
        WHEN a POST request is made to the send_magic_link_email endpoint
        THEN it should call Django's email service exactly once to send the magic link email.
        """
        # ARRANGE
        mock_send_mail.return_value = 1  # Simulate successful email sending

        # ACT: Make the POST request
        response = self.client.post(
            reverse('send_magic_link'),
            data=self.valid_data,
            content_type='application/json'
        )

        # ASSERT 1: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT 2: Verify that send_mail was called exactly once
        mock_send_mail.assert_called_once()

        print(f"{custom_console.COLOR_GREEN}✅ BE-401: Test for email service call passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

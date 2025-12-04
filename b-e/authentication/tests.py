import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework import status

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

    
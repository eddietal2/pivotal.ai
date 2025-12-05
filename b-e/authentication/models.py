from django.db import models

class User(models.Model):
    email = models.TextField(max_length=255, unique=True)
    first_name = models.TextField(max_length=255)
    
    @property
    def is_authenticated(self):
        """
        Always return True. This is a way to tell if the user has been authenticated.
        Required for Django REST Framework's IsAuthenticated permission.
        """
        return True
    
    @property
    def is_anonymous(self):
        """
        Always return False. This is a way to tell if the user is anonymous.
        Required for Django's authentication system compatibility.
        """
        return False
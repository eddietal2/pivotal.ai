from django.db import models

class User(models.Model):
    email = models.TextField(max_length=255, unique=True)
    username = models.TextField(max_length=255)
    is_deleted = models.BooleanField(default=False)
    theme = models.CharField(max_length=10, default='light')  # 'light' or 'dark'
    
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
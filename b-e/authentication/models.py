from django.db import models

class User(models.Model):
    email = models.TextField(max_length=255, unique=True)
    first_name = models.TextField(max_length=255)
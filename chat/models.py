from django.contrib.auth.models import User
from django.db import models


class Room(models.Model):
    name = models.CharField(max_length=255)
    online = models.ManyToManyField(to=User, blank=True)

    def get_online_count(self):
        return self.online.count()

    def join(self, user):
        self.online.add(user)

    def leave(self, user):
        self.online.remove(user)

    def __str__(self):
        return f'{self.name}'


class Message(models.Model):
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)
    room = models.ForeignKey(to=Room, on_delete=models.CASCADE)
    content = models.CharField(max_length=512)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username}: {self.content} [{self.timestamp}]'


class Profile(models.Model):
    username = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(default='default.jpg', upload_to='profile_images')

    def __str__(self):
        return self.username

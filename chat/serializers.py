from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Room, Profile


class RoomSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Room
        fields = ('name', 'id')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'id', 'first_name')


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    user = UserSerializer(many=False)

    class Meta:
        model = Profile
        fields = ('user', 'avatar', 'id')


from rest_framework import viewsets
import django_filters.rest_framework
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated

from .serializers import RoomSerializer, ProfileSerializer, UserSerializer
from .models import Room, Profile


class RoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Room.objects.all().order_by('name')
    serializer_class = RoomSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filter_fields = ["user__username"]


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    model = User
    queryset = User.objects.all()
    serializer_class = UserSerializer


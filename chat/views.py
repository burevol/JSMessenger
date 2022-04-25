from rest_framework import viewsets
import django_filters.rest_framework

from .serializers import RoomSerializer, ProfileSerializer
from .models import Room, Profile


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('name')
    serializer_class = RoomSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all().order_by('username')
    serializer_class = ProfileSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filter_fields = ["username"]

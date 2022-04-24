from rest_framework import viewsets

from .serializers import RoomSerializer
from .models import Room


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('name')
    serializer_class = RoomSerializer

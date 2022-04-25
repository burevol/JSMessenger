from django.urls import path, include
from rest_framework import routers

from .views import RoomViewSet, ProfileViewSet

router = routers.DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'profiles', ProfileViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
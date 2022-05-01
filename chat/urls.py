from django.urls import path, include
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token

from .views import RoomViewSet, ProfileViewSet, UserViewSet

router = routers.DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth-token/', obtain_auth_token, name='rest_auth_token'),
]
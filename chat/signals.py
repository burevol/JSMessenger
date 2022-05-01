import channels.layers
from asgiref.sync import async_to_sync

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User

from .models import Profile, Room


@receiver(post_delete, sender=Room)
@receiver(post_save, sender=Room)
def send_update_rooms(sender, *args, **kwargs):
    channel_layer = channels.layers.get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "all-users",
        {
            'type': 'update_rooms',
            'text': 'update_rooms'
        }
    )


@receiver(post_delete, sender=User)
@receiver(post_save, sender=User)
def send_update_profiles(sender, *args, **kwargs):
    channel_layer = channels.layers.get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "all-users",
        {
            'type': 'update_profiles',
            'text': 'update_profiles'
        }
    )


@receiver(post_save, sender=User)
def update_profile_signal(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()


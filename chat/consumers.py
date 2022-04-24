import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Room, Message


class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_name = None
        self.room_group_name = None
        self.room = None
        self.user = None
        self.user_inbox = None

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.room = await self.get_room()
        self.user = self.scope['user']
        self.user_inbox = f'inbox_{self.user.username}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        user_list = await self.get_user_list()
        await self.send(json.dumps({
            'type': 'user_list',
            'users': user_list
        }))

        if self.user.is_authenticated:
            await self.channel_layer.group_add(
                self.user_inbox,
                self.channel_name
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'user': self.user.username
                })
            await self.add_user_to_room()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.user.is_authenticated:
            self.channel_layer.group_discard(
                self.user_inbox,
                self.channel_name
            )

            self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.user.username
                }
            )
            await self.remove_user_from_room()

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        if not self.user.is_authenticated:
            return

        if message.startswith('/pm'):
            split = message.split(' ', 2)
            target = split[1]
            target_msg = split[2]
            await self.channel_layer.group_send(
                f'inbox_{target}',
                {
                    'type': 'private_message',
                    'user': self.user.username,
                    'message': target_msg
                }
            )
            await self.send(json.dumps({
                'type': 'private_message_delivered',
                'target': target,
                'message': target_msg
            }))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'user': self.user.username,
                'message': message
            }
        )
        await self.save_message(message)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_join(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps(event))

    async def private_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def private_message_delivered(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_room(self):
        return Room.objects.get(name=self.room_name)

    @database_sync_to_async
    def save_message(self, message):
        Message.objects.create(user=self.user, room=self.room, content=message)

    @database_sync_to_async
    def get_user_list(self):
        return [user.username for user in self.room.online.all()]

    @database_sync_to_async
    def add_user_to_room(self):
        self.room.online.add(self.user)

    @database_sync_to_async
    def remove_user_from_room(self):
        self.room.online.remove(self.user)

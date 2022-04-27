import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Profile


class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.username = None
        self.user_inbox = None

    async def connect(self):
        await self.accept()

    async def disconnect(self, code):
        logging.info('Disconnect')
        if self.room_group_name is not None:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_discard(
                'all-users',
                self.channel_name
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.username
                }
            )

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        command = text_data_json['command']

        if command == 'auth':
            self.username = await self.get_user_name(message)
            self.user_inbox = f'inbox_{self.username}'
            await self.channel_layer.group_add(
                self.user_inbox,
                self.channel_name
            )
            await self.channel_layer.group_add(
                'all-users',
                self.channel_name
            )

        elif command == 'message':
            if self.room_group_name is not None:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'user': self.username,
                        'message': message
                    }
                )
        elif command == 'enter_private':
            self.leave_room()
            self.room_group_name = f'inbox_{message}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

        elif command == 'enter_room':
            self.leave_room()
            self.room_group_name = f'chat_{message}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'user': self.username
                })

    async def leave_room(self):
        if self.room_group_name is not None:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.username
                }
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            self.room_group_name = None

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def update_rooms(self, event):
        await self.send(text_data=json.dumps(event))

    async def update_profiles(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_join(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_name(self, user_id):
        return Profile.objects.get(id=int(user_id)).username

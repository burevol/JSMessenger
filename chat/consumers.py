import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Room, Profile


class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_name = None
        self.room_group_name = None
        # self.room = None
        self.username = None
        # self.user_inbox = None

    async def connect(self):
        # self.user = self.scope['user']
        # self.user_inbox = f'inbox_{self.user.username}'
        #
        # await self.channel_layer.group_add(
        #     self.room_group_name,
        #     self.channel_name
        # )
        logging.info('Connected successfully')
        await self.accept()

        # user_list = await self.get_user_list()
        # await self.send(json.dumps({
        #     'type': 'user_list',
        #     'users': user_list
        # }))

        # await self.channel_layer.group_add(
        #     self.user_inbox,
        #     self.channel_name
        # )
        # await self.channel_layer.group_send(
        #     self.room_group_name,
        #     {
        #         'type': 'user_join',
        #         'user': self.user.username
        #     })

    async def disconnect(self, code):
        logging.info('Disconnect')
        if self.room_group_name is not None:
            await self.channel_layer.group_discard(
                self.room_group_name,
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
            logging.info(f'User {message} authenticated')
            self.username = await self.get_user_name(message)
        elif command == 'message':
            logging.info(f'Message {message} received')
            if self.room_group_name is not None:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'user': self.username,
                        'message': message
                    }
                )
        elif command == 'enter_room':
            logging.info(f'Enter {message} room')
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
            self.room_name = message
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

            # if message.startswith('/pm'):
            #     split = message.split(' ', 2)
            #     target = split[1]
            #     target_msg = split[2]
            #     await self.channel_layer.group_send(
            #         f'inbox_{target}',
            #         {
            #             'type': 'private_message',
            #             'user': self.user.username,
            #             'message': target_msg
            #         }
            #     )
            #     await self.send(json.dumps({
            #         'type': 'private_message_delivered',
            #         'target': target,
            #         'message': target_msg
            #     }))
            #     return

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
    def get_user_list(self):
        return [user.username for user in self.room.online.all()]

    @database_sync_to_async
    def add_user_to_room(self):
        self.room.online.add(self.user)

    @database_sync_to_async
    def remove_user_from_room(self):
        self.room.online.remove(self.user)

    @database_sync_to_async
    def get_user_name(self, user_id):
        return Profile.objects.get(id=int(user_id)).username

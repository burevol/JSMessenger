from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from rest_framework.authtoken.models import Token


@database_sync_to_async
def get_user(header):
    try:
        token_name, token_key = header.decode().split('=')
        if token_name == 'token':
            token = Token.objects.get(key=token_key)
            return token.user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if "query_string" in scope:
            header = scope['query_string']
            if header:
                scope['user'] = await get_user(header)
        return await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner): return TokenAuthMiddleware(
    AuthMiddlewareStack(inner))

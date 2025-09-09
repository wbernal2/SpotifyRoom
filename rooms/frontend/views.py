from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.


def index(request, *args, **kwargs):
    return render(request, 'frontend/index.html')


def websocket_test(request):
    with open('/Users/williambernal/Documents/GitHub/SpotifyRoom/rooms/websocket_test.html', 'r') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/html')
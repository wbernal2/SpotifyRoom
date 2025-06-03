# rooms/frontend/urls.py
from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    # When someone visits "/", serve your React template:
    path('', TemplateView.as_view(template_name='frontend/index.html'), name='react-home'),
]

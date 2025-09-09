from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),  # API endpoints
    path("spotify/", include("spotify.urls")),  # Spotify integration endpoints
    # Add specific paths for frontend routes that might conflict
    path("room/<str:code>/", TemplateView.as_view(template_name="index.html")),
    path("join/", TemplateView.as_view(template_name="index.html")),
    path("create/", TemplateView.as_view(template_name="index.html")),
    # Only catch-all for the root and undefined routes
    re_path(r"^$", TemplateView.as_view(template_name="index.html")),  # Root path
    re_path(r"^(?!api/|spotify/|admin/|static/).*$", TemplateView.as_view(template_name="index.html")),  # Everything else except API paths
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

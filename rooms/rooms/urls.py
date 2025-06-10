from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),  # Django handles only /api/
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),  # Everything else → React
]

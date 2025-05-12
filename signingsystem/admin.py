from django.contrib import admin
from .models import Event
from .models import Registration



admin.site.register(Event)

admin.site.register(Registration)

from .models import UserProfile
admin.site.register(UserProfile)

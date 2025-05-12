from django.apps import AppConfig


class SigningsystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'signingsystem'

    def ready(self):
        import signingsystem.signals  # 👈 加這行才會生效！

from django.urls import path, include #定義一條網址路由/把路由處理權轉交給別的模組
from . import views
from .views import cancel_registration
 
urlpatterns = [
    path('', views.homepage, name='homepage'), # 當有人訪問 / → 執行 views.homepage()aka設一條 API 路徑
    path('api/list/events/', views.event_list_api, name='event_api'),  #如果有人請求 api/list/events/，就去跑 views.event_list_api 這個函式
    path('api/login/', views.login_api, name='login_api'),
    path('api/register/', views.register_event, name='register_event'),
    path('auth/', include('social_django.urls', namespace='social')), #掛進去一整包 Google/Facebook 等登入會用到的網址，這些網址都從 /auth/ 開頭，然後我用 'social' 當它們的分類名。
    path('post-login/', views.post_login_redirect, name='post_login_redirect'),
    path('api/complete-profile/', views.complete_profile_api,name='complete-profile'),
    path('api/check-profile/', views.check_profile_status),
    path('api/cancel/', cancel_registration),


]



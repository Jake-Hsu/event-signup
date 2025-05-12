#====首頁顯示活動資訊/關鍵字搜尋====#
from django.shortcuts import render
from django.http import JsonResponse
from .models import Event, Registration
def homepage(request): 
    events = Event.objects.all()
    return render(request, 'index.html', {'events': events,'username': request.user.username if request.user.is_authenticated else None})

from django.http import JsonResponse
from .models import Event
from django.db.models import Q  
def event_list_api(request):
    if request.method == 'GET':
        query = request.GET.get('q', '')  # 取得搜尋參數
        if query:
            events = Event.objects.filter(
                Q(name__icontains=query) |
                Q(location__icontains=query) |
                Q(organizer__icontains=query)
            )
        else:
            events = Event.objects.all()

        data = []# 準備一個空 list，等等放每一筆活動的資料
        for event in events: # 把每一個 event 變成一個字典，放到 data list 裡
            data.append({
                "id" : event.id,
                "name": event.name,
                "date": event.date,
                "location": event.location,
                "organizer": event.organizer,
                "photo": event.photo.url if event.photo else ""
        })

        return JsonResponse(data, safe=False)
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

#====活動報名====#
@csrf_exempt
def register_event(request): 
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'message': '未登入，不能報名'}, status=401)

        import json
        body = json.loads(request.body)
        event_id = body.get('event_id')

        try:
            event = Event.objects.get(id=event_id)
            Registration.objects.create(user=request.user, event=event)
            return JsonResponse({'success': True, 'message': '報名成功'})
        except Event.DoesNotExist:
            return JsonResponse({'success': False, 'message': '找不到活動'}, status=404)
    else:
        return JsonResponse({'success': False, 'message': '只接受 POST 方法'}, status=405)    

#====使用者相關====#

#檢查使用者資料是否完整
def is_profile_complete(user):
    try:
        profile = user.userprofile
        required_fields = [profile.name, profile.gender, profile.identity, profile.phone, profile.region]

        # 如果是學生，還要檢查 school 和 student_id
        if profile.identity in ['高中職', '大專院校']:
            required_fields += [profile.school, profile.student_id]

        return all(required_fields)
    except:
        return False

#帳號登入 
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
def login_api(request): 
    if request.method == 'POST':
        import json
        body = json.loads(request.body)
        username = body.get('username')
        password = body.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'message': '登入成功', 'username': user.username})
        else:
            return JsonResponse({'message': '帳號或密碼錯誤'}, status=401)
    else:
        return JsonResponse({'message': '只接受 POST 方法'}, status=405)

#登入後導向
from django.contrib.auth.decorators import login_required  
from django.shortcuts import redirect

@login_required
def post_login_redirect(request):
    user = request.user

    # 假設你要補 username（Django User 本來就有）
    # 假設你還有另外的欄位例如電話存在 user.profile.phone，要這樣寫：
    if not is_profile_complete(user):
        return redirect('/#register?incomplete=1')
    return redirect('/')  # 否則跳到活動頁

#補填使用者資料（含更新密碼）
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import UserProfile
import json
@csrf_exempt
@login_required
def complete_profile_api(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = request.user
        password = data.get('password')
        if password:
            user.set_password(password)
            user.save()
            
            # ✅ 避免被登出
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.name = data.get('name')
        profile.gender = data.get('gender')
        profile.identity = data.get('identity')
        profile.school = data.get('school', '')
        profile.student_id = data.get('student_id', '')
        profile.phone = data.get('phone')
        profile.region = data.get('region')

        profile.save()

        return JsonResponse({'message': '資料已成功補齊'})
    else:
        return JsonResponse({'message': '只接受 POST'}, status=405)
    
def check_profile_status(request):
    from .views import is_profile_complete  # 如果分開的話
    return JsonResponse({'complete': is_profile_complete(request.user)})


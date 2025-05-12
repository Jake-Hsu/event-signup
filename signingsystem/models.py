#====Event 活動表====#
from django.db import models
from django.contrib.auth.models import User

class Event(models.Model): #開一張「活動」表格，裡面有欄位：名稱、時間、地點。
    photo = models.ImageField(upload_to='event_photos/', blank=True, null=True)  # 活動照片（上傳用）
    name = models.CharField(max_length=100) #活動名稱
    date = models.DateField()#活動日期
    location = models.CharField(max_length=100)#活動地點
    organizer = models.CharField(max_length=100)  # 主辦單位
    description = models.TextField(blank=True)    # 活動介紹
    
    def __str__(self): #活動在後台列表時，顯示活動名稱
        return self.name
    
#==== Registration 報名紀錄表 ====#
class Registration(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) #每一筆報名資料都會對應到一個「使用者」
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} 報名 {self.event.name}"
    
#====UserProfile 使用者資料補充表====#
from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, null=True, blank=True)
    identity = models.CharField(max_length=20)
    school = models.CharField(max_length=100, blank=True, null=True)
    student_id = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20)
    region = models.CharField(max_length=20)

    def __str__(self):
        return self.user.username

     

    



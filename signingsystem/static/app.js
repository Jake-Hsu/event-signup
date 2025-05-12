//====共用函式====//
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// ====頁面切換與側欄邏輯====//
showSection = function (sectionId) {
  const sections = document.querySelectorAll(".section");//抓出所有class為section的區塊
  sections.forEach((sec) => (sec.style.display = "none"));//把他們隱藏起來
  document.getElementById(sectionId).style.display = "block";//找到網頁中 id 是 sectionId 的元素，讓它顯示出來

  // 如果點的是活動列表，就載入活動
  if (sectionId === "events") {
        loadEvents();
  }

  document.getElementById("sideMenu").classList.remove("open");

};

function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

//====首頁搜尋====//
function submitHomeSearch() {
    const keyword = document.getElementById("homeSearchInput").value.trim();
    if (keyword) {
        // 把網址後面的 hash（#開頭的部分）改成 #events?q=關鍵字
        window.location.hash = `events?q=${encodeURIComponent(keyword)}`;
    } else {
        window.location.hash = `events`;
    }
}

window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const sectionId = hash.split('?')[0].substring(1); // 例如 #events?q=武嶺 → 取出 events
    showSection(sectionId);
});




function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlParams.get(param);
}

//====首頁輪播====//
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const dots = document.querySelectorAll('.dot');
    const images = [
      '/static/img/bike-hero0.jpg',
      '/static/img/bike-hero1.jpg',
      '/static/img/bike-hero2.jpg',
      '/static/img/bike-hero3.jpg',
      '/static/img/bike-hero4.jpg',

    ];
    let current = 0;
    let intervalId = null;
  
    function showSlide(index) {
      hero.style.backgroundImage = `url('${images[index]}')`;
  
      dots.forEach(dot => dot.classList.remove('active'));
      dots[index].classList.add('active');
    }
  
    function startAutoSlide() {
        intervalId = setInterval(() => {
          current = (current + 1) % images.length;
          showSlide(current);
        }, 4000);
      }

      function resetTimer() {
        clearInterval(intervalId);  // 停掉原本的輪播
        startAutoSlide();          // 重新啟動輪播計時器
      }
   
    dots.forEach((dot, idx) => { // 自動輪播
      dot.addEventListener('click', () => {
        current = idx;
        showSlide(current);
        resetTimer(); // 👈 這行超關鍵
      });
    });

    showSlide(current); // 自動輪播
    startAutoSlide(); 
    
  });
  



//====活動列表====//
function loadEvents() {
    const keyword = getQueryParam('q') || '';
    const eventContainer = document.getElementById("events-content");//找到放活動卡片的地方
    if (!eventContainer) return;

    fetch(`http://127.0.0.1:8000/api/list/events/?q=${encodeURIComponent(keyword)}`)//從 Django 後端的 API 讀取所有活動的資料
        .then(response => response.json()) //等資料回來，轉成 JSON (JavaScript Object Notation)
        .then(events => {
            eventContainer.innerHTML = ""; // 清空舊資料

            events.forEach(event => {// 把每個 event 顯示在網頁上
                const card = document.createElement("div");
                card.className = "event-card";//對每個活動都創建一個 div，class 叫 event-card
                card.innerHTML = `
                    ${event.photo ? `
                    <img src="${event.photo}" alt="活動照片" style="width:100%; height:auto; border-radius:8px 8px 0 0;">` : ''}
                    <div style="padding: 10px;">
                        <h2>${event.name}</h2>
                        <p>地點：${event.location}</p>
                        <p>日期：${event.date}</p> 
                        <p>主辦單位：${event.organizer ? event.organizer : '暫無資料'}</p>
                        
                    </div>
                `;
                const button = document.createElement("button");
                button.textContent = "我要報名";
                button.style.marginTop = "10px";
                button.addEventListener("click", () => registerEvent(event));//傳整個物件
                card.appendChild(button);
                eventContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error("載入活動失敗：", error);//如果 fetch 發生錯誤，就印出錯誤訊息
        });
        console.log("目前 loadEvents() 抓到的 keyword 是：", keyword);

}

//====報名活動====//
let myRegistrations = [];//宣告一個空的陣列，名稱叫做 myRegistrations，用來儲存報名過的活動。

registerEvent = function (event) {
  if (myRegistrations.some(e => e.id === event.id)) {// 檢查是否已經報名過
      alert("你已經報名過這個活動囉！");
      return;
  }
  fetch('/api/check-profile/', {
    credentials: 'include'
  })
  .then(res => res.json())// fetch 拿到的原始 HTTP 回應（response）轉成一個 真正可用的 JavaScript 物件
  .then(profile => {
    if (!profile.complete) {
      alert("請先補齊個人資料再報名活動！");
      showSection('register');  // 可選：自動跳到補資料區
      return;
    }
    
    fetch('http://127.0.0.1:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 要帶 session
      body: JSON.stringify({ event_id: event.id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || "報名成功！");
            myRegistrations.push(event);  // 成功後才加入報名清單
            updateMyEvents();             // 更新畫面
        } else {
            alert(data.message || "報名失敗！");
        }
    })
    .catch(error => {
        console.error('報名失敗', error);
    });
  });
};

//====我的報名====//
function updateMyEvents() {
    const container = document.getElementById("my");
    container.innerHTML = "";

    myRegistrations.forEach(event => {
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
      ${event.photo ? `
        <img src="${event.photo}" alt="活動照片" style="width:100%; height:auto; border-radius:8px 8px 0 0;">` : ''}
        <div style="padding: 10px;">
        <h2>${event.name}</h2>
        <p>地點：${event.location}</p>
        <p>日期：${event.date}</p> 
        <p>主辦單位：${event.organizer ? event.organizer : '暫無資料'}</p>
            
        </div>
      
    `;
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "取消報名";
    cancelButton.style.marginTop = "10px";
    cancelButton.style.backgroundColor = "#e74c3c";
    cancelButton.style.color = "white";
    cancelButton.onclick = () => cancelRegistration(event.id);

    card.appendChild(cancelButton);

    container.appendChild(card);
    });
}

//====取消報名====//
function cancelRegistration(eventId) {
  if (!confirm("確定要取消報名這個活動嗎？")) return;

  fetch(`/api/cancel/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ event_id: eventId })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    if (data.success) {
      // 從 myRegistrations 移除該活動
      myRegistrations = myRegistrations.filter(e => e.id !== eventId);
      updateMyEvents(); // 重新渲染我的報名
    }
  })
  .catch(error => {
    console.error("取消報名時發生錯誤：", error);
  });
}


//====一鍵註冊====//
function googleOAuthLogin() {
    window.location.href = "/auth/login/google-oauth2/";
}

//====補填資料====//
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;//取得網址中的 hash 值
    const sectionId = hash.split('?')[0].substring(1);//把 `#register?incomplete=1` 拆掉 `?` 後面的參數，只留下 `register`  然後去掉 `#` 符號
    if (sectionId) {
        showSection(sectionId);
    }
});

document.addEventListener('DOMContentLoaded', function () {
  const identitySelect = document.getElementById('identity');
  const schoolSection = document.getElementById('schoolSection');

  identitySelect.addEventListener('change', function () {
    const selected = this.value;
    if (selected === '高中職' || selected === '大專院校') {
      schoolSection.style.display = 'block';
      document.getElementById('school').required = true;
      document.getElementById('student_id').required = true;
    } else {
      schoolSection.style.display = 'none';
      document.getElementById('school').required = false;
      document.getElementById('student_id').required = false;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('preRegisterForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      gender: document.getElementById('gender').value,
      identity: document.getElementById('identity').value,
      school: document.getElementById('school').value,
      student_id: document.getElementById('student_id').value,
      phone: document.getElementById('phone').value,
      region: document.getElementById('region').value
    };

    const response = await fetch('/api/complete-profile/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'), 
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    alert(result.message);
    if (result.message === '資料已成功補齊') {
        document.getElementById('mySignupLink').style.display = 'block';
    }   

    
  });
});
fetch('/api/check-profile/', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  if (data.complete) {
    document.getElementById('mySignupLink').style.display = 'block';
  }
});

//====登入====//
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'  // 保留 Django session
            })
            .then(response => response.json())
            .then(data => {
                if (data.username) {
                    document.getElementById('loginResult').innerText = `登入成功！歡迎 ${data.username}`;
                    document.getElementById('mySignupLink').style.display = 'block';
                    
                } else {
                    document.getElementById('loginResult').innerText = data.message;
                }
            })
            .catch(error => {
                console.error('登入錯誤', error);
            });
        });
    }
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');


    
});










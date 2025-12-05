// DOM Elementleri
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const submitLogin = document.getElementById('submitLogin');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const postForm = document.getElementById('postForm');
const addPostBtn = document.getElementById('addPostBtn');
const postNameInput = document.getElementById('postName');
const postDescInput = document.getElementById('postDesc');
const postsContainer = document.getElementById('postsContainer');
const adminPanel = document.getElementById('adminPanel');
const deleteAllBtn = document.getElementById('deleteAllBtn');

// Firebase v9+ referansları
const { database, ref, push, onValue, remove, set } = window.firebaseTools;

// Kullanıcı durumu
let currentUser = null;
const ADMIN_CREDENTIALS = {
    username: "Admin",
    password: "32685"
};

// Modal aç/kapa
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
    usernameInput.focus();
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
    clearLoginForm();
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        clearLoginForm();
    }
});

// Giriş formunu temizle
function clearLoginForm() {
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
}

// Enter tuşu ile giriş
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitLogin.click();
    }
});

// Giriş yap
submitLogin.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Admin girişi başarılı
        loginError.textContent = '';
        loginError.style.color = '#00ff00';
        loginError.textContent = '✓ Admin olarak giriş yapıldı';
        
        setTimeout(() => {
            loginModal.style.display = 'none';
            currentUser = { username: 'Admin', isAdmin: true };
            updateUIForUser();
            loadPosts();
            clearLoginForm();
        }, 800);
        
    } else if (username && password) {
        // Normal kullanıcı girişi
        loginError.textContent = '';
        loginError.style.color = '#00ff00';
        loginError.textContent = `✓ ${username} olarak giriş yapıldı`;
        
        setTimeout(() => {
            loginModal.style.display = 'none';
            currentUser = { username: username, isAdmin: false };
            updateUIForUser();
            loadPosts();
            clearLoginForm();
        }, 800);
        
    } else {
        loginError.style.color = '#ff0000';
        loginError.textContent = '✗ Lütfen tüm alanları doldurun!';
    }
});

// Çıkış yap
logoutBtn.addEventListener('click', () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        currentUser = null;
        updateUIForUser();
        postsContainer.innerHTML = '<p class="no-posts">Gönderileri görmek için giriş yapın.</p>';
    }
});

// Kullanıcı arayüzünü güncelle
function updateUIForUser() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        postForm.style.display = 'block';
        
        if (currentUser.isAdmin) {
            adminPanel.style.display = 'block';
            document.querySelector('.admin-note').innerHTML = 
                '<strong>👑 Admin Yetkileri:</strong><br>' +
                '• Tüm gönderileri silebilir<br>' +
                '• Gönderi ekleyebilir<br>' +
                '• Diğer kullanıcılar sadece gönderi ekleyebilir';
        } else {
            adminPanel.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        postForm.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

// Gönderi ekle
addPostBtn.addEventListener('click', () => {
    const name = postNameInput.value.trim();
    const desc = postDescInput.value.trim();
    
    if (!name || !desc) {
        alert('Lütfen hem isim hem açıklama girin!');
        return;
    }
    
    if (!currentUser) {
        alert('Önce giriş yapmalısınız!');
        return;
    }
    
    const postData = {
        name: name,
        description: desc,
        author: currentUser.username,
        timestamp: Date.now(),
        isAdmin: currentUser.isAdmin
    };
    
    // Firebase'e gönderi ekle
    const postsRef = ref(database, 'posts');
    push(postsRef, postData)
        .then(() => {
            postNameInput.value = '';
            postDescInput.value = '';
            postNameInput.focus();
            
            // Başarı mesajı
            const successMsg = document.createElement('div');
            successMsg.textContent = '✓ Gönderi eklendi!';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #00ff00;
                color: #000;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
                font-weight: bold;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => successMsg.remove(), 300);
            }, 2000);
        })
        .catch(error => {
            console.error('Gönderi eklenemedi:', error);
            alert('Gönderi eklenemedi: ' + error.message);
        });
});

// Gönderileri yükle
function loadPosts() {
    const postsRef = ref(database, 'posts');
    
    onValue(postsRef, (snapshot) => {
        postsContainer.innerHTML = '';
        const posts = snapshot.val();
        
        if (posts) {
            // Gönderileri ID'ye göre sırala (yeniden eskiye)
            const postsArray = Object.entries(posts).map(([key, post]) => ({
                id: key,
                ...post
            })).sort((a, b) => b.timestamp - a.timestamp);
            
            postsArray.forEach(post => {
                const postElement = createPostElement(post.id, post);
                postsContainer.appendChild(postElement);
            });
            
            // Gönderi sayısını göster
            const countElement = document.querySelector('main h2');
            if (countElement) {
                countElement.textContent = `Gönderiler (${postsArray.length})`;
            }
            
        } else {
            postsContainer.innerHTML = `
                <div class="no-posts" style="
                    text-align: center;
                    padding: 40px;
                    color: #888;
                    font-style: italic;
                    grid-column: 1 / -1;
                ">
                    📝 Henüz gönderi yok. İlk gönderiyi ekleyin!
                </div>
            `;
        }
    });
}

// Gönderi elementi oluştur
function createPostElement(key, post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.dataset.key = key;
    
    const canDelete = currentUser && (currentUser.isAdmin || currentUser.username === post.author);
    const date = new Date(post.timestamp);
    const formattedDate = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Admin gönderisi için özel işaret
    const adminBadge = post.isAdmin ? ' 👑' : '';
    
    postDiv.innerHTML = `
        <div class="post-header">
            <h3 class="post-name">${post.name}${adminBadge}</h3>
            ${canDelete ? `<button class="delete-post" data-key="${key}">Sil</button>` : ''}
        </div>
        <p class="post-desc">${post.description}</p>
        <div class="post-meta">
            <span class="post-author">👤 ${post.author}</span>
            <span class="post-date">📅 ${formattedDate}</span>
        </div>
    `;
    
    // Sil butonu event listener
    if (canDelete) {
        const deleteBtn = postDiv.querySelector('.delete-post');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePost(key);
        });
    }
    
    return postDiv;
}

// Gönderi sil
function deletePost(key) {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) {
        return;
    }
    
    const postRef = ref(database, `posts/${key}`);
    remove(postRef)
        .then(() => {
            console.log('Gönderi silindi:', key);
        })
        .catch(error => {
            console.error('Silme hatası:', error);
            alert('Gönderi silinemedi: ' + error.message);
        });
}

// Tüm gönderileri sil (sadece admin)
deleteAllBtn.addEventListener('click', () => {
    if (!currentUser || !currentUser.isAdmin) {
        alert('Bu işlem için admin yetkisi gereklidir!');
        return;
    }
    
    if (!confirm('TÜM GÖNDERİLERİ SİLMEK ÜZERESİNİZ!\n\nBu işlem geri alınamaz!\n\nDevam etmek istiyor musunuz?')) {
        return;
    }
    
    const postsRef = ref(database, 'posts');
    remove(postsRef)
        .then(() => {
            alert('✓ Tüm gönderiler silindi!');
        })
        .catch(error => {
            console.error('Tüm gönderiler silinemedi:', error);
            alert('Silme hatası: ' + error.message);
        });
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Başlangıçta kullanıcı yok
    currentUser = null;
    updateUIForUser();
    
    // Firebase bağlantısını kontrol et
    setTimeout(() => {
        if (window.firebaseTools && window.firebaseTools.database) {
            console.log('Firebase bağlantısı başarılı');
        } else {
            console.error('Firebase bağlantısı kurulamadı');
            alert('⚠️ Firebase bağlantı hatası! Lütfen config bilgilerini kontrol edin.');
        }
    }, 1000);
});

// Enter tuşu ile gönderi ekle
postNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        postDescInput.focus();
    }
});

postDescInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addPostBtn.click();
    }
});

// Sayfa kapatılırken uyarı
window.addEventListener('beforeunload', (e) => {
    if (currentUser) {
        e.preventDefault();
        e.returnValue = 'Çıkış yapılmadı. Sayfadan ayrılmak istediğinize emin misiniz?';
    }
});

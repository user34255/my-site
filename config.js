// ── Supabase SDK ────────────────────────────────────────
const SUPA_URL  = 'https://itojlitujiabyigwnda.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2ppbGl0dWppYWJ5aWd3bmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTYwMjYsImV4cCI6MjA5OTg5MjAyNn0.kRSV1fvB88HGBxEdmCfi9af6t1uwLmPHFG9tjYk_sZY';
const IK_ENDPOINT = 'https://ik.imagekit.io/4fsc9mrry';

const { createClient } = supabase;
const db = createClient(SUPA_URL, SUPA_ANON);

// ── Текущий пользователь ────────────────────────────────
function getCurrentUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

function getRole() {
    return localStorage.getItem('role');
}

// ── Плавный переход ─────────────────────────────────────
function goTo(page) {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = page; }, 310);
}

// ── Время назад ─────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'только что';
    if (m < 60) return m + ' мин. назад';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ч. назад';
    return Math.floor(h / 24) + ' дн. назад';
}

// ── Сжатие изображения ──────────────────────────────────
function compressImage(file, maxWidth = 1200) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ── Загрузка фото в Supabase Storage ───────────────────
async function uploadPhoto(file) {
    const compressed = await compressImage(file);
    const ext  = 'jpg';
    const name = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await db.storage.from('photos').upload(name, compressed, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = db.storage.from('photos').getPublicUrl(name);
    return urlData.publicUrl;
}

// ── Аватар по умолчанию (SVG data URI) ─────────────────
const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%2300969d' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E`;

// ── Навигация: перехватить все ссылки ──────────────────
function initNavLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
            if (href === 'create.html' && getRole() === 'viewer') {
                e.preventDefault();
                if (typeof openKeyPopup === 'function') openKeyPopup();
                return;
            }
            e.preventDefault();
            goTo(href);
        });
    });
}

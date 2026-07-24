// ── Ключи ─────────────────────────────────────────────
const CONFIG = {
    supabase: {
        url:  'https://itojilitujiabyigwnda.supabase.co',
        anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2ppbGl0dWppYWJ5aWd3bmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTYwMjYsImV4cCI6MjA5OTg5MjAyNn0.kRSV1fvB88HGBxEdmCfi9af6t1uwLmPHFG9tjYk_sZY'
    },
    imagekit: {
        endpoint:  'https://ik.imagekit.io/4fsc9mrry',
        publicKey: 'public_SHUz6tu8gp5OvHHNoN/4J03ccWU='
    }
};

// ── Прямые fetch-запросы к Supabase REST API ──────────
// Никакого SDK — только встроенный fetch браузера

async function sbFetch(path, options = {}) {
    const url = CONFIG.supabase.url + '/rest/v1/' + path;
    const headers = {
        'apikey':        CONFIG.supabase.anon,
        'Authorization': 'Bearer ' + CONFIG.supabase.anon,
        'Content-Type':  'application/json',
        'Prefer':        options.prefer !== undefined ? options.prefer : 'return=representation'
    };
    const res = await fetch(url, {
        method:  options.method  || 'GET',
        headers: headers,
        body:    options.body    || undefined
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error('HTTP ' + res.status + ': ' + txt);
    }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : [];
}

function sbSelect(table, query) {
    return sbFetch(table + (query ? '?' + query : ''));
}

function sbInsert(table, data) {
    return sbFetch(table, { method: 'POST', body: JSON.stringify(data) });
}

function sbUpdate(table, query, data) {
    return sbFetch(table + '?' + query, { method: 'PATCH', body: JSON.stringify(data) });
}

function sbDelete(table, query) {
    return sbFetch(table + '?' + query, { method: 'DELETE', prefer: '' });
}

// ── Загрузка фото в Supabase Storage ─────────────────
async function uploadPhotoToStorage(file, folder) {
    folder = folder || 'posts';
    const user     = getCurrentUser();
    const compressed = await compressImage(file, 1200);
    const fileName = folder + '/' + (user ? user.id + '_' : '') + Date.now() + '.jpg';
    const url      = CONFIG.supabase.url + '/storage/v1/object/photos/' + fileName;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + CONFIG.supabase.anon,
            'apikey':        CONFIG.supabase.anon,
            'Content-Type':  'image/jpeg',
            'x-upsert':      'true'
        },
        body: compressed
    });
    if (!res.ok) throw new Error('Storage upload failed: ' + await res.text());
    return CONFIG.supabase.url + '/storage/v1/object/public/photos/' + fileName;
}

// ── Сжатие изображения ────────────────────────────────
function compressImage(file, maxWidth) {
    maxWidth = maxWidth || 800;
    return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var w = img.width, h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(resolve, 'image/jpeg', 0.82);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ── Текущий пользователь ──────────────────────────────
function getCurrentUser() {
    var raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

// ── Плавный переход ───────────────────────────────────
function goTo(page) {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity    = '0';
    setTimeout(function() { window.location.href = page; }, 310);
}

// ── Время «N минут назад» ─────────────────────────────
function timeAgo(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var m = Math.floor(diff / 60000);
    if (m < 1)  return 'только что';
    if (m < 60) return m + ' мин. назад';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' ч. назад';
    return Math.floor(h / 24) + ' дн. назад';
}

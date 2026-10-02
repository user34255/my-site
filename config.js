// ── Конфигурация Supabase ──────────────────────────────
const SUPABASE_URL = 'sb_publishable_AMwHCecCyAc_yyTRd7Ssqg_5lYXvteL'; 
const SUPABASE_ANON_KEY = 'sb_secret_rGqeDV0uFqJbAV-awgMx3g_WVwRm_5n';

// Инициализация глобального клиента Supabase
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Получение текущего пользователя
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        return null;
    }
}

// Навигация
function goTo(url) {
    window.location.href = url;
}

// Относительное время (например, "5 мин. назад")
function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'только что';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин. назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU');
}

// Вспомогательные методы для старых вызовов (для совместимости)
async function sbSelect(table, queryStr = '') {
    if (!db) return [];
    try {
        const { data, error } = await db.from(table).select('*');
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('sbSelect error:', e);
        return [];
    }
}

async function sbInsert(table, data) {
    if (!db) return null;
    const { data: res, error } = await db.from(table).insert(data).select();
    if (error) throw error;
    return res;
}

async function sbUpdate(table, filterStr, data) {
    if (!db) return null;
    const { data: res, error } = await db.from(table).update(data);
    if (error) throw error;
    return res;
}

async function sbDelete(table, filterStr) {
    if (!db) return null;
    const { data: res, error } = await db.from(table).delete();
    if (error) throw error;
    return res;
}
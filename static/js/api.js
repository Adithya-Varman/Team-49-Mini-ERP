// API Helper - all fetch calls with JWT
const API_BASE = '/api';

function getToken() { return localStorage.getItem('erp_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('erp_user')); } catch { return null; } }

async function apiRequest(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();

    if (!res.ok) {
        const msg = typeof data.detail === 'string' ? data.detail :
                    (data.detail?.message || JSON.stringify(data.detail) || 'Request failed');
        throw { status: res.status, message: msg, data: data.detail?.data || null };
    }
    return data;
}

const api = {
    get: (endpoint) => apiRequest('GET', endpoint),
    post: (endpoint, body) => apiRequest('POST', endpoint, body),
    put: (endpoint, body) => apiRequest('PUT', endpoint, body),
    del: (endpoint) => apiRequest('DELETE', endpoint),
};

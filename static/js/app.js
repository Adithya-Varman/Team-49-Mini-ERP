// Main App - Router, Auth, Navigation
const MENU_CONFIG = {
    ADMIN: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'inventory', label: 'Inventory', icon: '🏭' },
        { id: 'customers', label: 'Customers', icon: '🤝' },
        { id: 'suppliers', label: 'Suppliers', icon: '🚚' },
        { id: 'bom', label: 'BoM', icon: '📋' },
        { id: 'sales', label: 'Sales Orders', icon: '💰' },
        { id: 'purchase', label: 'Purchase Orders', icon: '🛒' },
        { id: 'manufacturing', label: 'Manufacturing', icon: '⚙️' },
        { id: 'audit', label: 'Audit Logs', icon: '📝' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
    ],
    SALES: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'inventory', label: 'Inventory', icon: '🏭' },
        { id: 'customers', label: 'Customers', icon: '🤝' },
        { id: 'sales', label: 'Sales Orders', icon: '💰' },
        { id: 'audit', label: 'My Audit Logs', icon: '📝' },
    ],
    PURCHASE: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'inventory', label: 'Inventory', icon: '🏭' },
        { id: 'suppliers', label: 'Suppliers', icon: '🚚' },
        { id: 'purchase', label: 'Purchase Orders', icon: '🛒' },
        { id: 'audit', label: 'My Audit Logs', icon: '📝' },
    ],
    MANUFACTURING: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'inventory', label: 'Inventory', icon: '🏭' },
        { id: 'bom', label: 'BoM', icon: '📋' },
        { id: 'manufacturing', label: 'Manufacturing', icon: '⚙️' },
        { id: 'audit', label: 'My Audit Logs', icon: '📝' },
    ],
};

let currentPage = 'dashboard';
let notifCount = 0;

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Modal
function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Status badge
function statusBadge(status) {
    const cls = status.toLowerCase().replace(/_/g, '-');
    return `<span class="badge badge-${cls}">${status}</span>`;
}

// Init
function initApp() {
    // Always land on the login page first on a fresh page load.
    // Clear any persisted session so the entry point is the sign-in screen.
    // (erp_remember_email is preserved so the email field still prefills.)
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    showLogin();
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    const user = getUser();
    document.getElementById('user-role-badge').textContent = user.role;
    document.getElementById('user-name-display').textContent = user.name;
    renderNav();
    navigate('dashboard');
    loadNotifCount();
}

function renderNav() {
    const user = getUser();
    const menu = MENU_CONFIG[user.role] || [];
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = menu.map(m =>
        `<div class="nav-item${m.id === currentPage ? ' active' : ''}" data-page="${m.id}">${m.icon} ${m.label}${m.id === 'notifications' ? `<span class="notif-count" id="nav-notif-count" style="display:none">0</span>` : ''}</div>`
    ).join('');
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigate(item.dataset.page));
    });
    // attach the macOS-dock magnification once; it re-queries items on each frame
    setupNavMagnification();
}

// ============================================================
// macOS-style dock magnification for the sidebar nav links.
// Applied ONLY to .nav-item elements inside #sidebar-nav,
// so the top logo and bottom profile/Logout are untouched.
//
// Algorithm: on mousemove, for each item we measure the
// vertical distance from the cursor to the item's centre and
// map it through a cosine falloff over INFLUENCE px. The
// hovered item peaks at MAX_SCALE; neighbours taper smoothly
// to 1 → a clean fisheye wave.
// ============================================================
let _navMagInit = false;
function setupNavMagnification() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav || _navMagInit) return;
    _navMagInit = true;

    // read tunables from CSS so JS + CSS stay in sync
    const css = getComputedStyle(document.documentElement);
    const MAX_SCALE = parseFloat(css.getPropertyValue('--nav-dock-peak')) || 1.25;
    const INFLUENCE = 72;   // ~1.8 × item height → gives neighbours ≈ 1.1×

    let pointerY = null;
    let rafId = null;

    function applyCurve() {
        rafId = null;
        const items = nav.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (pointerY === null) { item.style.setProperty('--scale', 1); return; }
            const r = item.getBoundingClientRect();
            const center = r.top + r.height / 2;
            const dist = Math.abs(pointerY - center);
            let s = 1;
            if (dist < INFLUENCE) {
                const falloff = Math.cos((dist / INFLUENCE) * (Math.PI / 2));
                s = 1 + (MAX_SCALE - 1) * falloff;
            }
            item.style.setProperty('--scale', s.toFixed(3));
        });
    }
    function schedule() { if (rafId === null) rafId = requestAnimationFrame(applyCurve); }

    nav.addEventListener('mousemove', (e) => { pointerY = e.clientY; schedule(); });
    nav.addEventListener('mouseleave', () => { pointerY = null; schedule(); });
}

async function loadNotifCount() {
    try {
        const data = await api.get('/notifications/unread-count');
        notifCount = data.count;
        const badge = document.getElementById('nav-notif-count');
        if (badge) {
            badge.textContent = notifCount;
            badge.style.display = notifCount > 0 ? 'inline' : 'none';
        }
    } catch(e) {}
}

function navigate(page) {
    currentPage = page;
    renderNav();
    document.getElementById('page-title').textContent = getPageTitle(page);
    document.getElementById('header-actions').innerHTML = '';
    const content = document.getElementById('page-content');
    content.innerHTML = '<p>Loading...</p>';

    const pages = {
        dashboard: renderDashboard,
        users: renderUsers,
        products: renderProducts,
        inventory: renderInventory,
        customers: renderCustomers,
        suppliers: renderSuppliers,
        bom: renderBom,
        sales: renderSales,
        purchase: renderPurchase,
        manufacturing: renderManufacturing,
        audit: renderAudit,
        notifications: renderNotifications,
    };

    if (pages[page]) pages[page]();
}

function getPageTitle(page) {
    const titles = { dashboard:'Dashboard', users:'User Management', products:'Products', inventory:'Inventory', customers:'Customers', suppliers:'Suppliers', bom:'Bill of Materials', sales:'Sales Orders', purchase:'Purchase Orders', manufacturing:'Manufacturing Orders', audit:'Audit Logs', notifications:'Notifications' };
    return titles[page] || page;
}

// Prefill remembered email
(function () {
    const remembered = localStorage.getItem('erp_remember_email');
    if (remembered) {
        const emailInput = document.getElementById('login-email');
        const rememberBox = document.getElementById('login-remember');
        if (emailInput) emailInput.value = remembered;
        if (rememberBox) rememberBox.checked = true;
    }
})();

// Login handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;
    try {
        const data = await api.post('/auth/login', { email, password });
        if (remember) localStorage.setItem('erp_remember_email', email);
        else localStorage.removeItem('erp_remember_email');
        localStorage.setItem('erp_token', data.access_token);
        localStorage.setItem('erp_user', JSON.stringify({
            role: data.role,
            name: email.split('@')[0],
            email: email
        }));
        showMainApp();
    } catch(err) {
        document.getElementById('login-error').textContent = err.message || 'Login failed';
    }
});

// Forgot password (client-side prompt; no backend change)
document.getElementById('forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        errEl.textContent = 'Enter your email above, then click "Forgot password?"';
        return;
    }
    errEl.textContent = '';
    showToast(`Password reset link sent to ${email}`, 'success');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    showLogin();
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Boot
initApp();

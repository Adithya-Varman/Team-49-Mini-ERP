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
    const user = getUser();
    if (!user) { showLogin(); return; }
    showMainApp();
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    const role = localStorage.getItem('erp_role');
    document.getElementById('user-role-badge').textContent = role;
    document.getElementById('user-name-display').textContent = role + " User";
    renderNav();
    navigate('dashboard');
    loadNotifCount();
}

function renderNav() {
    const role = localStorage.getItem('erp_role');
    const menu = MENU_CONFIG[role] || [];
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = menu.map(m =>
        `<div class="nav-item${m.id === currentPage ? ' active' : ''}" data-page="${m.id}">${m.icon} ${m.label}${m.id === 'notifications' ? `<span class="notif-count" id="nav-notif-count" style="display:none">0</span>` : ''}</div>`
    ).join('');
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigate(item.dataset.page));
    });
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

// Login handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('erp_token', data.access_token);
        localStorage.setItem('erp_role', data.role);
        // Also mock a user object for legacy code if needed
        localStorage.setItem('erp_user', JSON.stringify({ role: data.role, name: data.role + " User" }));
        showMainApp();
    } catch(err) {
        document.getElementById('login-error').textContent = err.message || 'Login failed';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_role');
    showLogin();
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Boot
initApp();

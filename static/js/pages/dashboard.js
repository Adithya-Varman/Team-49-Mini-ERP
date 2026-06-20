// Dashboard Page

// --- minimalist inline icons (lucide-style) ---
const _svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const DASH_ICONS = {
    products: _svg('<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
    customers: _svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    suppliers: _svg('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
    sales: _svg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
    purchase: _svg('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
    manufacturing: _svg('<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>'),
    bell: _svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
    alert: _svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
    audit: _svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'),
};

function dashKpi(cls, icon, value, label) {
    return `<div class="stat-card ${cls}">
        <span class="stat-icon">${icon}</span>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
    </div>`;
}

function dashActionBadge(action) {
    const map = { CREATE: 'completed', UPDATE: 'confirmed', DELETE: 'cancelled', DELIVER: 'partially-delivered', RECEIVE: 'confirmed' };
    return `<span class="badge badge-${map[action] || 'draft'}">${action}</span>`;
}

async function renderDashboard() {
    const content = document.getElementById('page-content');
    try {
        const data = await api.get('/dashboard');
        const user = getUser();
        if (user.role === 'ADMIN') {
            // requested KPIs use existing endpoints (/customers, /suppliers) + existing /sales-orders & /notifications
            const [customers, suppliers, salesOrders, notifications] = await Promise.all([
                api.get('/customers'), api.get('/suppliers'), api.get('/sales-orders'), api.get('/notifications'),
            ]);

            const recentOrders = [...salesOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
            const ordersHtml = recentOrders.length ? `<div class="table-wrapper"><table>
                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>${recentOrders.map(o => {
                    const t = o.items.reduce((s, i) => s + i.quantity * i.price, 0);
                    return `<tr><td><strong>${o.id}</strong></td><td>${o.customer_name}</td><td>$${t.toFixed(2)}</td><td>${statusBadge(o.status)}</td></tr>`;
                }).join('')}</tbody></table></div>` : '<div class="dash-empty">No recent orders</div>';

            const recentNotifs = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
            const notifDot = { LOW_STOCK: '#e11d48', AUTO_PROCUREMENT: '#2563eb' };
            const notifBadge = (t) => t === 'LOW_STOCK' ? 'cancelled' : t === 'AUTO_PROCUREMENT' ? 'confirmed' : 'draft';
            const notifsHtml = recentNotifs.length ? `<div class="dash-list">${recentNotifs.map(n => `
                <div class="dash-list-item">
                    <span class="di-dot" style="background:${notifDot[n.type] || '#94a3b8'}"></span>
                    <div class="di-main">
                        <div class="di-title">${n.title}</div>
                        <div class="di-msg">${n.message}</div>
                        <div class="di-meta"><span class="badge badge-${notifBadge(n.type)}">${n.type}</span><span>${new Date(n.timestamp).toLocaleString()}</span></div>
                    </div>
                </div>`).join('')}</div>` : '<div class="dash-empty">No notifications</div>';

            const low = data.low_stock_alerts || [];
            const lowHtml = low.length ? `<div class="table-wrapper"><table>
                <thead><tr><th>Product</th><th>On Hand</th><th>Min</th><th>Type</th></tr></thead>
                <tbody>${low.map(a => `<tr><td>${a.product_name}</td><td class="text-danger"><strong>${a.on_hand}</strong></td><td>${a.min_stock}</td><td>${statusBadge(a.type)}</td></tr>`).join('')}</tbody></table></div>`
                : '<div class="dash-empty">All stock levels are healthy</div>';

            const logs = data.recent_audit_logs || [];
            const auditHtml = logs.length ? `<div class="table-wrapper"><table>
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th></tr></thead>
                <tbody>${logs.map(l => `<tr><td>${new Date(l.timestamp).toLocaleString()}</td><td>${l.user_name}</td><td>${dashActionBadge(l.action)}</td><td class="text-muted">${l.entity_type}</td></tr>`).join('')}</tbody></table></div>`
                : '<div class="dash-empty">No audit activity</div>';

            content.innerHTML = `
                <div class="stats-grid">
                    ${dashKpi('kpi-blue', DASH_ICONS.products, data.total_products, 'Total Products')}
                    ${dashKpi('kpi-violet', DASH_ICONS.customers, customers.length, 'Total Customers')}
                    ${dashKpi('kpi-cyan', DASH_ICONS.suppliers, suppliers.length, 'Total Suppliers')}
                    ${dashKpi('kpi-green', DASH_ICONS.sales, data.sales_orders, 'Total Sales Orders')}
                    ${dashKpi('kpi-amber', DASH_ICONS.purchase, data.purchase_orders, 'Total Purchase Orders')}
                    ${dashKpi('kpi-rose', DASH_ICONS.manufacturing, data.manufacturing_orders, 'Total Manufacturing Orders')}
                </div>

                <div class="dash-row split">
                    <div class="card">
                        <div class="card-header"><span class="card-title">${DASH_ICONS.sales} Recent Orders</span><span class="badge badge-draft">${recentOrders.length}</span></div>
                        ${ordersHtml}
                    </div>
                    <div class="card">
                        <div class="card-header"><span class="card-title">${DASH_ICONS.bell} Notifications</span><span class="badge badge-draft">${recentNotifs.length}</span></div>
                        ${notifsHtml}
                    </div>
                </div>

                <div class="dash-row two">
                    <div class="card">
                        <div class="card-header"><span class="card-title">${DASH_ICONS.alert} Low Stock Alerts</span><span class="badge badge-${low.length ? 'cancelled' : 'completed'}">${low.length}</span></div>
                        ${lowHtml}
                    </div>
                    <div class="card">
                        <div class="card-header"><span class="card-title">${DASH_ICONS.audit} Recent Audit Logs</span><span class="badge badge-draft">${logs.length}</span></div>
                        ${auditHtml}
                    </div>
                </div>`;
        } else if (user.role === 'SALES') {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${data.total_orders}</div><div class="stat-label">Total Orders</div></div>
                    <div class="stat-card"><div class="stat-value">${data.confirmed_orders}</div><div class="stat-label">Confirmed</div></div>
                    <div class="stat-card"><div class="stat-value">${data.partial_deliveries}</div><div class="stat-label">Partial Delivery</div></div>
                    <div class="stat-card"><div class="stat-value">${data.completed_deliveries}</div><div class="stat-label">Delivered</div></div>
                </div>`;
        } else if (user.role === 'PURCHASE') {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${data.total_orders}</div><div class="stat-label">Total POs</div></div>
                    <div class="stat-card"><div class="stat-value">${data.pending_receipts}</div><div class="stat-label">Pending Receipt</div></div>
                    <div class="stat-card"><div class="stat-value">${data.completed_receipts}</div><div class="stat-label">Received</div></div>
                    <div class="stat-card"><div class="stat-value text-danger">${data.low_stock_alerts.length}</div><div class="stat-label">Low Stock</div></div>
                </div>`;
        } else if (user.role === 'MANUFACTURING') {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${data.total_orders}</div><div class="stat-label">Total MOs</div></div>
                    <div class="stat-card"><div class="stat-value">${data.in_progress}</div><div class="stat-label">In Progress</div></div>
                    <div class="stat-card"><div class="stat-value">${data.completed}</div><div class="stat-label">Completed</div></div>
                </div>`;
        }
    } catch(e) { content.innerHTML = `<p class="text-danger">Error loading dashboard: ${e.message}</p>`; }
}

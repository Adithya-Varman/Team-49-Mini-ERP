// Dashboard Page
async function renderDashboard() {
    const content = document.getElementById('page-content');
    try {
        const data = await api.get('/dashboard');
        const user = getUser();
        if (user.role === 'ADMIN') {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${data.total_users}</div><div class="stat-label">Users</div></div>
                    <div class="stat-card"><div class="stat-value">${data.total_products}</div><div class="stat-label">Products</div></div>
                    <div class="stat-card"><div class="stat-value">${data.sales_orders}</div><div class="stat-label">Sales Orders</div></div>
                    <div class="stat-card"><div class="stat-value">${data.purchase_orders}</div><div class="stat-label">Purchase Orders</div></div>
                    <div class="stat-card"><div class="stat-value">${data.manufacturing_orders}</div><div class="stat-label">Mfg Orders</div></div>
                    <div class="stat-card"><div class="stat-value text-danger">${data.low_stock_alerts.length}</div><div class="stat-label">Low Stock</div></div>
                </div>
                ${data.low_stock_alerts.length > 0 ? `<div class="card"><div class="card-title mb-2">⚠️ Low Stock Alerts</div><table><thead><tr><th>Product</th><th>On Hand</th><th>Minimum</th><th>Type</th></tr></thead><tbody>${data.low_stock_alerts.map(a=>`<tr><td>${a.product_name}</td><td class="text-danger">${a.on_hand}</td><td>${a.min_stock}</td><td>${a.type}</td></tr>`).join('')}</tbody></table></div>` : ''}
                <div class="card"><div class="card-title mb-2">Recent Audit Logs</div><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th></tr></thead><tbody>${(data.recent_audit_logs||[]).map(l=>`<tr><td>${new Date(l.timestamp).toLocaleString()}</td><td>${l.user_name}</td><td>${l.action}</td><td>${l.entity_type}</td></tr>`).join('')}</tbody></table></div>`;
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

// Audit Logs Page
async function renderAudit() {
    const content = document.getElementById('page-content');
    try {
        const logs = await api.get('/audit-logs');
        content.innerHTML = `<div class="search-bar"><input id="audit-search" placeholder="Search..." oninput="filterAudit()">
        <select id="audit-entity" onchange="filterAudit()"><option value="">All Entities</option><option value="User">User</option><option value="Product">Product</option><option value="Customer">Customer</option><option value="Supplier">Supplier</option><option value="SalesOrder">Sales Order</option><option value="PurchaseOrder">Purchase Order</option><option value="ManufacturingOrder">Mfg Order</option><option value="BoM">BoM</option></select></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Reference</th></tr></thead>
        <tbody id="audit-tbody">${auditRows(logs)}</tbody></table></div></div>`;
        window._allAudit = logs;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function auditRows(logs) {
    return logs.map(l=>`<tr><td>${new Date(l.timestamp).toLocaleString()}</td><td>${l.user_name}</td><td>${l.action}</td><td>${statusBadge(l.entity_type)}</td><td class="text-muted">${l.reference_id}</td></tr>`).join('');
}
function filterAudit() {
    const q=document.getElementById('audit-search').value.toLowerCase(),e=document.getElementById('audit-entity').value;
    let f=window._allAudit||[];
    if(q)f=f.filter(l=>l.action.toLowerCase().includes(q)||l.user_name.toLowerCase().includes(q));
    if(e)f=f.filter(l=>l.entity_type===e);
    document.getElementById('audit-tbody').innerHTML=auditRows(f);
}

// Notifications Page
async function renderNotifications() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-secondary" onclick="markAllRead()">Mark All Read</button>';
    try {
        const notifs = await api.get('/notifications');
        content.innerHTML = notifs.length ? notifs.map(n=>`<div class="card" style="${n.is_read?'opacity:0.6':'border-left:3px solid #4361ee'}">
            <div class="flex-between"><strong>${n.title}</strong><span class="text-muted" style="font-size:11px">${new Date(n.timestamp).toLocaleString()}</span></div>
            <p class="mt-2" style="font-size:13px">${n.message}</p>
            <div class="mt-2"><span class="badge badge-${n.type==='LOW_STOCK'?'cancelled':n.type==='AUTO_PROCUREMENT'?'confirmed':'draft'}">${n.type}</span>
            ${!n.is_read?`<button class="btn btn-sm btn-secondary" style="margin-left:8px" onclick="markRead('${n.id}')">Mark Read</button>`:''}</div>
        </div>`).join('') : '<p class="text-muted">No notifications</p>';
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
async function markRead(id){try{await api.post(`/notifications/${id}/read`);renderNotifications();loadNotifCount();}catch(e){}}
async function markAllRead(){try{await api.post('/notifications/mark-all-read');renderNotifications();loadNotifCount();showToast('All read','success');}catch(e){}}

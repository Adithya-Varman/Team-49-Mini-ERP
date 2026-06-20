// Inventory Page — manufacturing ERP dashboard

const invSvg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const INV_ICONS = {
    skus: invSvg('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>'),
    alert: invSvg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
    onhand: invSvg('<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
    reserved: invSvg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    raw: invSvg('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
    semi: invSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    finished: invSvg('<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>'),
};

function invStatusBadge(i) {
    if (i.on_hand_qty <= 0) return '<span class="badge badge-cancelled">Out of Stock</span>';
    if (i.on_hand_qty < i.min_stock) return '<span class="badge badge-in-progress">Low Stock</span>';
    return '<span class="badge badge-completed">In Stock</span>';
}

function invSummary(all) {
    const totalSku = all.length;
    const lowCount = all.filter((i) => i.on_hand_qty < i.min_stock).length;
    const onHand = all.reduce((s, i) => s + i.on_hand_qty, 0);
    const reserved = all.reduce((s, i) => s + i.reserved_qty, 0);
    return `<div class="stats-grid">
        <div class="stat-card kpi-blue"><span class="stat-icon">${INV_ICONS.skus}</span><div class="stat-value">${totalSku}</div><div class="stat-label">Total SKUs</div></div>
        <div class="stat-card kpi-rose"><span class="stat-icon">${INV_ICONS.alert}</span><div class="stat-value">${lowCount}</div><div class="stat-label">Low Stock Items</div></div>
        <div class="stat-card kpi-green"><span class="stat-icon">${INV_ICONS.onhand}</span><div class="stat-value">${onHand}</div><div class="stat-label">Units On Hand</div></div>
        <div class="stat-card kpi-amber"><span class="stat-icon">${INV_ICONS.reserved}</span><div class="stat-value">${reserved}</div><div class="stat-label">Units Reserved</div></div>
    </div>`;
}

function invSearchBar(q, t) {
    return `<div class="search-bar">
        <input id="inv-search" placeholder="Search by name or SKU..." value="${q || ''}" oninput="filterInventory()">
        <select id="inv-type" onchange="filterInventory()">
            <option value="">All Types</option>
            <option value="RAW"${t === 'RAW' ? ' selected' : ''}>RAW</option>
            <option value="SEMI_FINISHED"${t === 'SEMI_FINISHED' ? ' selected' : ''}>SEMI FINISHED</option>
            <option value="FINISHED"${t === 'FINISHED' ? ' selected' : ''}>FINISHED</option>
        </select></div>`;
}

function invTable(items) {
    if (!items.length) return '<div class="dash-empty">No items in this category</div>';
    return `<div class="table-wrapper"><table>
        <thead><tr><th>Product</th><th>Type</th><th>Unit</th><th>On Hand</th><th>Reserved</th><th>Free To Use</th><th>Min Stock</th><th>Status</th><th>Ledger</th></tr></thead>
        <tbody>${items.map((i) => {
            const cls = i.on_hand_qty <= 0 ? 'inv-row-out' : (i.on_hand_qty < i.min_stock ? 'inv-row-low' : '');
            const name = String(i.name).replace(/'/g, "\\'");
            return `<tr class="${cls}">
                <td><strong>${i.name}</strong><div class="text-muted" style="font-size:11px">${i.sku}</div></td>
                <td>${statusBadge(i.type)}</td>
                <td>${i.unit}</td>
                <td>${i.on_hand_qty}</td>
                <td>${i.reserved_qty}</td>
                <td><strong>${i.free_to_use_qty}</strong></td>
                <td>${i.min_stock}</td>
                <td>${invStatusBadge(i)}</td>
                <td><button class="btn btn-sm btn-info" onclick="viewLedger('${i.id}','${name}')">Ledger</button></td>
            </tr>`;
        }).join('')}</tbody></table></div>`;
}

function invSection(icon, title, items) {
    return `<div class="card">
        <div class="card-header"><span class="card-title">${icon} ${title}</span><span class="badge badge-draft">${items.length}</span></div>
        ${invTable(items)}
    </div>`;
}

function invSections(all, q, t) {
    let items = all;
    if (q) { const s = q.toLowerCase(); items = items.filter((i) => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)); }
    if (t) items = items.filter((i) => i.type === t);
    const raw = items.filter((i) => i.type === 'RAW');
    const semi = items.filter((i) => i.type === 'SEMI_FINISHED');
    const fin = items.filter((i) => i.type === 'FINISHED');
    return `${invSection(INV_ICONS.raw, 'Raw Materials', raw)}
        ${invSection(INV_ICONS.semi, 'Semi-Finished Goods', semi)}
        ${invSection(INV_ICONS.finished, 'Finished Goods', fin)}`;
}

async function renderInventory() {
    const content = document.getElementById('page-content');
    try {
        const inv = await api.get('/inventory');
        window._allInv = inv;
        content.innerHTML = `${invSummary(inv)}${invSearchBar('', '')}<div id="inv-sections">${invSections(inv, '', '')}</div>`;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}

function filterInventory() {
    const q = document.getElementById('inv-search').value;
    const t = document.getElementById('inv-type').value;
    document.getElementById('inv-sections').innerHTML = invSections(window._allInv || [], q, t);
}

async function viewLedger(productId, productName) {
    try {
        const entries = await api.get(`/stock-ledger?product_id=${productId}`);
        openModal(`Stock Ledger: ${productName}`, entries.length ? `<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Change</th><th>Reason</th><th>Reference</th><th>User</th></tr></thead>
        <tbody>${entries.map((e) => `<tr><td>${new Date(e.date).toLocaleString()}</td><td class="${e.change > 0 ? 'text-success' : 'text-danger'}"><strong>${e.change > 0 ? '+' : ''}${e.change}</strong></td><td>${e.reason}</td><td class="text-muted">${e.reference}</td><td>${e.user_name}</td></tr>`).join('')}</tbody></table></div>` : '<div class="dash-empty">No ledger entries yet</div>');
    } catch(e) { showToast(e.message, 'error'); }
}

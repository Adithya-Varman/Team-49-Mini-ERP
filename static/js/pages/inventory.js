// Inventory Page
async function renderInventory() {
    const content = document.getElementById('page-content');
    try {
        const inv = await api.get('/inventory');
        const raw = inv.filter(i=>i.type==='RAW'), semi = inv.filter(i=>i.type==='SEMI_FINISHED'), fin = inv.filter(i=>i.type==='FINISHED');
        content.innerHTML = `
        <div class="search-bar"><input id="inv-search" placeholder="Search..." oninput="filterInventory()">
        <select id="inv-type" onchange="filterInventory()"><option value="">All</option><option value="RAW">RAW</option><option value="SEMI_FINISHED">SEMI FINISHED</option><option value="FINISHED">FINISHED</option></select></div>
        <div class="card"><div class="card-header"><span class="card-title">📦 Raw Materials (${raw.length})</span></div><div class="table-wrapper">${invTable(raw)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">🔧 Semi-Finished (${semi.length})</span></div><div class="table-wrapper">${invTable(semi)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">✅ Finished Goods (${fin.length})</span></div><div class="table-wrapper">${invTable(fin)}</div></div>`;
        window._allInv = inv;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function invTable(items) {
    if (!items.length) return '<p class="text-muted" style="padding:8px">No items</p>';
    return `<table><thead><tr><th>Name</th><th>SKU</th><th>On Hand</th><th>Reserved</th><th>Free</th><th>Unit</th><th>Min Stock</th><th>Strategy</th><th>Ledger</th></tr></thead>
    <tbody>${items.map(i=>{
        const low = i.on_hand_qty < i.min_stock;
        return `<tr style="${low?'background:#fff3cd':''}"><td>${i.name}</td><td>${i.sku}</td><td>${i.on_hand_qty}</td><td>${i.reserved_qty}</td><td><strong>${i.free_to_use_qty}</strong></td><td>${i.unit}</td><td>${i.min_stock}</td><td>${i.procurement_strategy}</td>
        <td><button class="btn btn-sm btn-info" onclick="viewLedger('${i.id}','${i.name}')">View</button></td></tr>`;
    }).join('')}</tbody></table>`;
}
function filterInventory() {
    const q = document.getElementById('inv-search').value.toLowerCase();
    const t = document.getElementById('inv-type').value;
    let items = window._allInv || [];
    if (q) items = items.filter(i=>i.name.toLowerCase().includes(q)||i.sku.toLowerCase().includes(q));
    if (t) items = items.filter(i=>i.type===t);
    const raw=items.filter(i=>i.type==='RAW'),semi=items.filter(i=>i.type==='SEMI_FINISHED'),fin=items.filter(i=>i.type==='FINISHED');
    document.getElementById('page-content').innerHTML = `
        <div class="search-bar"><input id="inv-search" placeholder="Search..." value="${q}" oninput="filterInventory()">
        <select id="inv-type" onchange="filterInventory()"><option value="">All</option><option value="RAW"${t==='RAW'?' selected':''}>RAW</option><option value="SEMI_FINISHED"${t==='SEMI_FINISHED'?' selected':''}>SEMI FINISHED</option><option value="FINISHED"${t==='FINISHED'?' selected':''}>FINISHED</option></select></div>
        <div class="card"><div class="card-header"><span class="card-title">📦 Raw Materials (${raw.length})</span></div><div class="table-wrapper">${invTable(raw)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">🔧 Semi-Finished (${semi.length})</span></div><div class="table-wrapper">${invTable(semi)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">✅ Finished Goods (${fin.length})</span></div><div class="table-wrapper">${invTable(fin)}</div></div>`;
}
async function viewLedger(productId, productName) {
    try {
        const entries = await api.get(`/stock-ledger?product_id=${productId}`);
        openModal(`Stock Ledger: ${productName}`, entries.length ? `<table><thead><tr><th>Date</th><th>Change</th><th>Reason</th><th>Reference</th><th>User</th></tr></thead>
        <tbody>${entries.map(e=>`<tr><td>${new Date(e.date).toLocaleString()}</td><td class="${e.change>0?'text-success':'text-danger'}">${e.change>0?'+':''}${e.change}</td><td>${e.reason}</td><td>${e.reference}</td><td>${e.user_name}</td></tr>`).join('')}</tbody></table>` : '<p class="text-muted">No entries yet</p>');
    } catch(e) { showToast(e.message,'error'); }
}

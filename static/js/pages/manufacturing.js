// Manufacturing Orders Page
const moIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>';

function moBomRef(o) {
    const b = (window._moBomMap || {})[o.product_id];
    return b ? `<span class="badge badge-confirmed">${b}</span>` : '<span class="text-muted">No BoM</span>';
}
function moProgress(o) {
    const pct = o.quantity ? Math.round((o.completed_qty / o.quantity) * 100) : 0;
    return `<div class="mo-status-cell">${statusBadge(o.status)}
        <div class="progress-mini"><div class="progress-mini-fill" style="width:${pct}%"></div></div>
        <span class="cell-sub">${o.completed_qty}/${o.quantity} produced</span></div>`;
}

async function renderManufacturing() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateMOModal()">+ New MO</button>';
    try {
        const [orders, boms] = await Promise.all([api.get('/manufacturing-orders'), api.get('/bom')]);
        window._allMO = orders;
        window._moBomMap = {};
        boms.forEach(b => { window._moBomMap[b.product_id] = b.id; });
        content.innerHTML = `
        <div class="search-bar">
            <input id="mo-search" placeholder="Search by MO ID or product..." oninput="filterMO()">
            <select id="mo-status" onchange="filterMO()"><option value="">All Status</option><option value="DRAFT">Draft</option><option value="CONFIRMED">Confirmed</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select>
        </div>
        <div class="card">
            <div class="card-header"><span class="card-title">${moIcon} Manufacturing Orders</span><span class="badge badge-draft" id="mo-count">${orders.length}</span></div>
            <div class="table-wrapper"><table>
                <thead><tr><th>MO</th><th>Product</th><th>Quantity</th><th>BoM Reference</th><th>Source</th><th>Production Status</th><th>Actions</th></tr></thead>
                <tbody id="mo-tbody">${moRows(orders)}</tbody></table></div>
        </div>`;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function moRows(orders) {
    if (!orders.length) return '<tr><td colspan="7"><div class="dash-empty">No manufacturing orders found</div></td></tr>';
    return orders.map(o=>`<tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.product_name}</td>
        <td>${o.quantity}</td>
        <td>${moBomRef(o)}</td>
        <td>${o.auto_generated?'<span class="badge badge-auto-procurement">Auto</span>':'<span class="badge badge-draft">Manual</span>'}</td>
        <td>${moProgress(o)}</td>
        <td><div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="viewMO('${o.id}')">View</button>
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmMO('${o.id}')">Confirm</button>`:''}
            ${o.status==='CONFIRMED'?`<button class="btn btn-sm btn-warning" onclick="startMO('${o.id}')">Start</button>`:''}
            ${o.status==='IN_PROGRESS'?`<button class="btn btn-sm btn-primary" onclick="showCompleteMOModal('${o.id}',${o.quantity-o.completed_qty})">Complete</button>`:''}
            ${o.status!=='COMPLETED'&&o.status!=='CANCELLED'?`<button class="btn btn-sm btn-danger" onclick="cancelMO('${o.id}')">Cancel</button>`:''}
        </div></td></tr>`).join('');
}
function viewMO(id) {
    const o = (window._allMO || []).find(x => x.id === id);
    if (!o) { showToast('Order not found', 'error'); return; }
    const bom = (window._moBomMap || {})[o.product_id];
    const pct = o.quantity ? Math.round((o.completed_qty / o.quantity) * 100) : 0;
    openModal(`Manufacturing Order ${o.id}`, `<div class="detail-grid">
        <div class="detail-item"><label>Product</label><span>${o.product_name}</span></div>
        <div class="detail-item"><label>Quantity</label><span>${o.quantity}</span></div>
        <div class="detail-item"><label>BoM Reference</label><span>${bom || 'No BoM linked'}</span></div>
        <div class="detail-item"><label>Source</label><span>${o.auto_generated?'Auto procurement':'Manual'}</span></div>
        <div class="detail-item"><label>Production Status</label><span>${statusBadge(o.status)}</span></div>
        <div class="detail-item"><label>Completed</label><span>${o.completed_qty}/${o.quantity}</span></div>
    </div><div class="progress-mini mt-4"><div class="progress-mini-fill" style="width:${pct}%"></div></div>
    <p class="cell-sub mt-2">${pct}% complete</p>`);
}
function filterMO() {
    const q=document.getElementById('mo-search').value.toLowerCase(),s=document.getElementById('mo-status').value;
    let f=window._allMO||[];
    if(q)f=f.filter(o=>o.id.toLowerCase().includes(q)||o.product_name.toLowerCase().includes(q));
    if(s)f=f.filter(o=>o.status===s);
    document.getElementById('mo-tbody').innerHTML=moRows(f);
}
async function showCreateMOModal() {
    const products = await api.get('/products');
    const mfg = products.filter(p=>p.type==='FINISHED'||p.type==='SEMI_FINISHED');
    openModal('Create Manufacturing Order', `<form id="cmo-form">
        <div class="form-group"><label>Product</label><select id="cmo-prod">${mfg.map(p=>`<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}</select></div>
        <div class="form-group"><label>Quantity</label><input type="number" id="cmo-qty" min="1" required></div>
        <button type="submit" class="btn btn-primary btn-block">Create</button></form>`);
    document.getElementById('cmo-form').onsubmit = async(e)=>{
        e.preventDefault();
        try{const r=await api.post('/manufacturing-orders',{product_id:document.getElementById('cmo-prod').value,quantity:+document.getElementById('cmo-qty').value});closeModal();showToast('MO created: '+r.id,'success');renderManufacturing();}catch(err){showToast(err.message,'error');}
    };
}
async function confirmMO(id){try{const r=await api.post(`/manufacturing-orders/${id}/confirm`);showToast(r.message,'success');renderManufacturing();}catch(e){showToast(e.message,'error');}}
async function startMO(id){
    try{const r=await api.post(`/manufacturing-orders/${id}/start`);showToast(r.message,'success');renderManufacturing();}
    catch(e){showToast(e.message,'error');if(e.data&&e.data.shortages){let msg='Component shortages:\n';e.data.shortages.forEach(s=>{msg+=`${s.component_name}: need ${s.needed}, have ${s.available}\n`;});alert(msg);}}
}
function showCompleteMOModal(id, remaining) {
    openModal('Complete Production', `<form id="comp-form">
        <div class="form-group"><label>Completed Quantity (max: ${remaining})</label><input type="number" id="comp-qty" min="1" max="${remaining}" value="${remaining}" required></div>
        <button type="submit" class="btn btn-primary btn-block">Complete</button></form>`);
    document.getElementById('comp-form').onsubmit = async(e)=>{
        e.preventDefault();
        try{await api.post(`/manufacturing-orders/${id}/complete`,{completed_qty:+document.getElementById('comp-qty').value});closeModal();showToast('Production completed','success');renderManufacturing();}catch(err){showToast(err.message,'error');}
    };
}
async function cancelMO(id){if(!confirm('Cancel?'))return;try{await api.post(`/manufacturing-orders/${id}/cancel`);showToast('Cancelled','success');renderManufacturing();}catch(e){showToast(e.message,'error');}}

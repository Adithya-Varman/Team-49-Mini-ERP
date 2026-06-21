// Purchase Orders Page
const poIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

async function renderPurchase() {
    const content = document.getElementById('page-content');
    window._showPOHistory = window._showPOHistory || false;
    document.getElementById('header-actions').innerHTML = `
        <button class="btn ${window._showPOHistory ? 'btn-warning' : 'btn-secondary'}" onclick="togglePOHistory()" id="po-history-btn">${window._showPOHistory ? 'Back to Active' : '📜 History'}</button>
        <button class="btn btn-primary" onclick="showCreatePurchaseModal()">+ New PO</button>
    `;
    try {
        const orders = await api.get('/purchase-orders');
        window._allPO = orders;
        content.innerHTML = `
        <div class="search-bar">
            <input id="po-search" placeholder="Search by PO ID or supplier..." oninput="filterPO()">
            <select id="po-status" onchange="filterPO()"><option value="">All Status</option><option value="DRAFT">Draft</option><option value="CONFIRMED">Confirmed</option><option value="PARTIALLY_RECEIVED">Partially Received</option><option value="FULLY_RECEIVED">Received</option><option value="CANCELLED">Cancelled</option></select>
        </div>
        <div class="card">
            <div class="card-header"><span class="card-title">${poIcon} Purchase Orders ${window._showPOHistory ? '(History)' : '(Active)'}</span><span class="badge badge-draft" id="po-count">${orders.length}</span></div>
            <div class="table-wrapper"><table>
                <thead><tr><th>PO</th><th>Supplier</th><th>Items</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody id="po-tbody">${poRows([])}</tbody></table></div>
        </div>`;
        filterPO();
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function poRows(orders) {
    if (!orders.length) return '<tr><td colspan="6"><div class="dash-empty">No purchase orders found</div></td></tr>';
    return orders.map(o=>`<tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.supplier_name}</td>
        <td><div class="cell-items">${o.items.map(i=>`<span class="item-chip">${i.quantity}× ${i.product_name}</span>`).join('')}</div></td>
        <td>${o.auto_generated?'<span class="badge badge-auto-procurement">Auto</span>':'<span class="badge badge-draft">Manual</span>'}</td>
        <td>${statusBadge(o.status)}</td>
        <td><div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="viewPurchaseOrder('${o.id}')">View</button>
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmPO('${o.id}')">Confirm</button>`:''}
            ${o.status==='CONFIRMED'||o.status==='PARTIALLY_RECEIVED'?`<button class="btn btn-sm btn-primary" onclick="showReceiveModal('${o.id}')">Receive</button>`:''}
            ${o.status!=='FULLY_RECEIVED'&&o.status!=='CANCELLED'?`<button class="btn btn-sm btn-danger" onclick="cancelPO('${o.id}')">Cancel</button>`:''}
        </div></td></tr>`).join('');
}
async function viewPurchaseOrder(id) {
    const o = await api.get(`/purchase-orders/${id}`);
    openModal(`Purchase Order ${o.id}`, `<div class="detail-grid">
        <div class="detail-item"><label>Supplier</label><span>${o.supplier_name}</span></div>
        <div class="detail-item"><label>Status</label><span>${statusBadge(o.status)}</span></div>
        <div class="detail-item"><label>Source</label><span>${o.auto_generated?'Auto procurement':'Manual'}</span></div>
        <div class="detail-item"><label>Line Items</label><span>${o.items.length}</span></div>
    </div><div class="table-wrapper mt-4"><table><thead><tr><th>Product</th><th>Ordered</th><th>Received</th></tr></thead>
    <tbody>${o.items.map(i=>`<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>${i.received_qty}/${i.quantity}</td></tr>`).join('')}</tbody></table></div>`);
}
function togglePOHistory() {
    window._showPOHistory = !window._showPOHistory;
    const btn = document.getElementById('po-history-btn');
    if (btn) {
        btn.innerHTML = window._showPOHistory ? 'Back to Active' : '📜 History';
        btn.className = window._showPOHistory ? 'btn btn-warning' : 'btn btn-secondary';
    }
    filterPO();
}
function filterPO() {
    const q=document.getElementById('po-search').value.toLowerCase(),s=document.getElementById('po-status').value;
    let f=window._allPO||[];
    
    const finishedStatuses = ['FULLY_RECEIVED', 'CANCELLED'];
    if (window._showPOHistory) {
        f = f.filter(o => finishedStatuses.includes(o.status));
    } else {
        f = f.filter(o => !finishedStatuses.includes(o.status));
    }
    
    if(q)f=f.filter(o=>o.id.toLowerCase().includes(q)||o.supplier_name.toLowerCase().includes(q));
    if(s)f=f.filter(o=>o.status===s);
    document.getElementById('po-tbody').innerHTML=poRows(f);
}
async function showCreatePurchaseModal() {
    const suppliers = await api.get('/suppliers');
    const products = await api.get('/products');
    window._poProducts = products;
    openModal('Create Purchase Order', `<form id="cpo-form">
        <div class="form-group"><label>Supplier</label><select id="cpo-sup">${suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <label>Items:</label><div id="cpo-items"></div>
        <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addPOItemRow()">+ Add</button>
        <button type="submit" class="btn btn-primary btn-block mt-4">Create</button></form>`);
    addPOItemRow();
    document.getElementById('cpo-form').onsubmit = async(e)=>{
        e.preventDefault();
        const items=Array.from(document.getElementById('cpo-items').querySelectorAll('.order-item-row')).map(r=>({product_id:r.querySelector('.po-prod').value,quantity:+r.querySelector('.po-qty').value})).filter(i=>i.quantity>0);
        try{const r=await api.post('/purchase-orders',{supplier_id:document.getElementById('cpo-sup').value,items});closeModal();showToast('PO created: '+r.id,'success');renderPurchase();}catch(err){showToast(err.message,'error');}
    };
}
function addPOItemRow() {
    const p=window._poProducts||[];const div=document.createElement('div');div.className='order-item-row';
    div.innerHTML=`<select class="po-prod">${p.map(x=>`<option value="${x.id}">${x.name} (${x.sku})</option>`).join('')}</select>
        <input type="number" class="po-qty" placeholder="Qty" min="1" required>
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('cpo-items').appendChild(div);
}
async function confirmPO(id){try{await api.post(`/purchase-orders/${id}/confirm`);showToast('Confirmed','success');renderPurchase();}catch(e){showToast(e.message,'error');}}
async function showReceiveModal(id) {
    const order = await api.get(`/purchase-orders/${id}`);
    openModal('Receive Items', `<form id="rcv-form">
        ${order.items.map(i=>{const rem=i.quantity-i.received_qty;return rem>0?`<div class="form-group"><label>${i.product_name} (Remaining: ${rem})</label><input type="number" class="rcv-qty" data-pid="${i.product_id}" max="${rem}" min="0" value="${rem}"></div>`:''}).join('')}
        <button type="submit" class="btn btn-primary btn-block">Process Receipt</button></form>`);
    document.getElementById('rcv-form').onsubmit = async(e)=>{
        e.preventDefault();
        const items=Array.from(document.querySelectorAll('.rcv-qty')).map(el=>({product_id:el.dataset.pid,receive_qty:+el.value})).filter(i=>i.receive_qty>0);
        try{await api.post(`/purchase-orders/${id}/receive`,{items});closeModal();showToast('Received','success');renderPurchase();}catch(err){showToast(err.message,'error');}
    };
}
async function cancelPO(id){if(!confirm('Cancel?'))return;try{await api.post(`/purchase-orders/${id}/cancel`);showToast('Cancelled','success');renderPurchase();}catch(e){showToast(e.message,'error');}}

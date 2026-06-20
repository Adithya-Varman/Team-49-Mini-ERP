// Purchase Orders Page
async function renderPurchase() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreatePurchaseModal()">+ New PO</button>';
    try {
        const orders = await api.get('/purchase-orders');
        content.innerHTML = `<div class="search-bar"><input id="po-search" placeholder="Search..." oninput="filterPO()">
        <select id="po-status" onchange="filterPO()"><option value="">All</option><option value="DRAFT">DRAFT</option><option value="CONFIRMED">CONFIRMED</option><option value="PARTIALLY_RECEIVED">PARTIAL</option><option value="FULLY_RECEIVED">RECEIVED</option><option value="CANCELLED">CANCELLED</option></select></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>ID</th><th>Supplier</th><th>Items</th><th>Auto</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="po-tbody">${poRows(orders)}</tbody></table></div></div>`;
        window._allPO = orders;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function poRows(orders) {
    return orders.map(o=>`<tr><td><strong>${o.id}</strong></td><td>${o.supplier_name}</td>
        <td>${o.items.map(i=>`${i.quantity}x ${i.product_name}`).join(', ')}</td>
        <td>${o.auto_generated?'⚡ Auto':'Manual'}</td><td>${statusBadge(o.status)}</td>
        <td><div class="btn-group">
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmPO('${o.id}')">Confirm</button>`:''}
            ${o.status==='CONFIRMED'||o.status==='PARTIALLY_RECEIVED'?`<button class="btn btn-sm btn-primary" onclick="showReceiveModal('${o.id}')">Receive</button>`:''}
            ${o.status!=='FULLY_RECEIVED'&&o.status!=='CANCELLED'?`<button class="btn btn-sm btn-danger" onclick="cancelPO('${o.id}')">Cancel</button>`:''}
        </div></td></tr>`).join('');
}
function filterPO() {
    const q=document.getElementById('po-search').value.toLowerCase(),s=document.getElementById('po-status').value;
    let f=window._allPO||[];
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

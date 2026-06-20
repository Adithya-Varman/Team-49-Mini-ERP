// Sales Orders Page
async function renderSales() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateSalesModal()">+ New Sales Order</button>';
    try {
        const orders = await api.get('/sales-orders');
        content.innerHTML = `<div class="search-bar"><input id="so-search" placeholder="Search..." oninput="filterSales()">
        <select id="so-status" onchange="filterSales()"><option value="">All Status</option><option value="DRAFT">DRAFT</option><option value="CONFIRMED">CONFIRMED</option><option value="PARTIALLY_DELIVERED">PARTIAL</option><option value="FULLY_DELIVERED">DELIVERED</option><option value="CANCELLED">CANCELLED</option></select></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="so-tbody">${salesRows(orders)}</tbody></table></div></div>`;
        window._allSO = orders;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function salesRows(orders) {
    return orders.map(o => {
        const total = o.items.reduce((s,i)=>s+i.quantity*i.price,0);
        return `<tr><td><strong>${o.id}</strong></td><td>${o.customer_name}</td>
        <td>${o.items.map(i=>`${i.quantity}x ${i.product_name}`).join(', ')}</td>
        <td>$${total.toFixed(2)}</td><td>${statusBadge(o.status)}</td>
        <td><div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="viewSalesOrder('${o.id}')">View</button>
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmSO('${o.id}')">Confirm</button>`:''}
            ${o.status==='CONFIRMED'||o.status==='PARTIALLY_DELIVERED'?`<button class="btn btn-sm btn-primary" onclick="showDeliverModal('${o.id}')">Deliver</button>`:''}
            ${o.status!=='FULLY_DELIVERED'&&o.status!=='CANCELLED'?`<button class="btn btn-sm btn-danger" onclick="cancelSO('${o.id}')">Cancel</button>`:''}
        </div></td></tr>`;
    }).join('');
}
function filterSales() {
    const q = document.getElementById('so-search').value.toLowerCase();
    const s = document.getElementById('so-status').value;
    let f = window._allSO||[];
    if(q) f=f.filter(o=>o.id.toLowerCase().includes(q)||o.customer_name.toLowerCase().includes(q));
    if(s) f=f.filter(o=>o.status===s);
    document.getElementById('so-tbody').innerHTML = salesRows(f);
}
async function showCreateSalesModal() {
    const customers = await api.get('/customers');
    const products = await api.get('/products');
    window._soProducts = products.filter(p=>p.type==='FINISHED');
    openModal('Create Sales Order', `<form id="cso-form">
        <div class="form-group"><label>Customer</label><select id="cso-cust">${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <label>Items:</label><div id="cso-items"></div>
        <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addSOItemRow()">+ Add Item</button>
        <button type="submit" class="btn btn-primary btn-block mt-4">Create Order</button></form>`);
    addSOItemRow();
    document.getElementById('cso-form').onsubmit = async(e)=>{
        e.preventDefault();
        const items = collectSOItems();
        if(!items.length){showToast('Add items','error');return;}
        try{const r=await api.post('/sales-orders',{customer_id:document.getElementById('cso-cust').value,items});closeModal();showToast('Sales Order created: '+r.id,'success');renderSales();}catch(err){showToast(err.message,'error');}
    };
}
function addSOItemRow() {
    const p = window._soProducts||[];
    const div = document.createElement('div');div.className='order-item-row';
    div.innerHTML = `<select class="so-prod">${p.map(x=>`<option value="${x.id}" data-price="${x.sales_price}">${x.name} ($${x.sales_price})</option>`).join('')}</select>
        <input type="number" class="so-qty" placeholder="Qty" min="1" required>
        <input type="number" class="so-price" placeholder="Price" step="0.01" required>
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('cso-items').appendChild(div);
    div.querySelector('.so-prod').onchange = function(){div.querySelector('.so-price').value=this.selectedOptions[0].dataset.price;};
    div.querySelector('.so-prod').dispatchEvent(new Event('change'));
}
function collectSOItems() {
    return Array.from(document.getElementById('cso-items').querySelectorAll('.order-item-row')).map(r=>({product_id:r.querySelector('.so-prod').value,quantity:+r.querySelector('.so-qty').value,price:+r.querySelector('.so-price').value})).filter(i=>i.quantity>0);
}
async function confirmSO(id) {
    try{const r=await api.post(`/sales-orders/${id}/confirm`);showToast(r.message,'success');if(r.auto_procurements)showToast('Auto procurement triggered!','info');renderSales();}
    catch(err){showToast(err.message,'error');if(err.data&&err.data.shortages){let msg='Shortages:\n';err.data.shortages.forEach(s=>{msg+=`${s.product_name}: need ${s.needed}, have ${s.available}\n`;});alert(msg);}}
}
async function showDeliverModal(id) {
    const order = await api.get(`/sales-orders/${id}`);
    openModal('Deliver Items', `<form id="del-form">
        ${order.items.map(i=>{const rem=i.quantity-i.delivered_qty;return rem>0?`<div class="form-group"><label>${i.product_name} (Remaining: ${rem})</label><input type="number" class="del-qty" data-pid="${i.product_id}" min="0" value="${rem}"></div>`:''}).join('')}
        <button type="submit" class="btn btn-primary btn-block">Process Delivery</button></form>`);
    document.getElementById('del-form').onsubmit = async(e)=>{
        e.preventDefault();
        const items=Array.from(document.querySelectorAll('.del-qty')).map(el=>({product_id:el.dataset.pid,deliver_qty:+el.value})).filter(i=>i.deliver_qty>0);
        try{await api.post(`/sales-orders/${id}/deliver`,{items});closeModal();showToast('Delivered','success');renderSales();}catch(err){showToast(err.message,'error');}
    };
}
async function viewSalesOrder(id) {
    const o = await api.get(`/sales-orders/${id}`);
    const total = o.items.reduce((s,i)=>s+i.quantity*i.price,0);
    openModal(`Sales Order: ${o.id}`, `<div class="detail-grid">
        <div class="detail-item"><label>Customer</label><span>${o.customer_name}</span></div>
        <div class="detail-item"><label>Status</label><span>${statusBadge(o.status)}</span></div>
        <div class="detail-item"><label>Total</label><span>$${total.toFixed(2)}</span></div>
        <div class="detail-item"><label>Created</label><span>${new Date(o.created_at).toLocaleString()}</span></div>
    </div><table class="mt-4"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Delivered</th></tr></thead>
    <tbody>${o.items.map(i=>`<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.price}</td><td>${i.delivered_qty}/${i.quantity}</td></tr>`).join('')}</tbody></table>`);
}
async function cancelSO(id){if(!confirm('Cancel this order?'))return;try{await api.post(`/sales-orders/${id}/cancel`);showToast('Cancelled','success');renderSales();}catch(e){showToast(e.message,'error');}}

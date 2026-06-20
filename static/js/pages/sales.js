// Sales Orders Page
const soIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';

async function renderSales() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateSalesModal()">+ New Sales Order</button>';
    try {
        const orders = await api.get('/sales-orders');
        window._allSO = orders;
        content.innerHTML = `
        <div class="search-bar">
            <input id="so-search" placeholder="Search by order ID or customer..." oninput="filterSales()">
            <select id="so-status" onchange="filterSales()"><option value="">All Status</option><option value="DRAFT">Draft</option><option value="DELAYED">Delayed</option><option value="CONFIRMED">Confirmed</option><option value="PARTIALLY_DELIVERED">Partially Delivered</option><option value="FULLY_DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select>
        </div>
        <div class="card">
            <div class="card-header"><span class="card-title">${soIcon} Sales Orders</span><span class="badge badge-draft" id="so-count">${orders.length}</span></div>
            <div class="table-wrapper"><table>
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody id="so-tbody">${salesRows(orders)}</tbody></table></div>
        </div>`;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function salesRows(orders) {
    if (!orders.length) return '<tr><td colspan="6"><div class="dash-empty">No sales orders found</div></td></tr>';
    return orders.map(o => {
        const total = o.items.reduce((s,i)=>s+i.quantity*i.price,0);
        return `<tr>
        <td><strong>${o.id}</strong>${o.created_at?`<div class="cell-sub">${new Date(o.created_at).toLocaleDateString()}</div>`:''}</td>
        <td>${o.customer_name}</td>
        <td><div class="cell-items">${o.items.map(i=>`<span class="item-chip">${i.quantity}× ${i.product_name}</span>`).join('')}</div></td>
        <td><strong>$${total.toFixed(2)}</strong></td><td>${statusBadge(o.status)}</td>
        <td><div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="viewSalesOrder('${o.id}')">View</button>
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmSO('${o.id}')">Confirm</button>`:''}
            ${o.status==='DELAYED'?`<button class="btn btn-sm btn-warning" onclick="confirmSO('${o.id}')">Re-Check Stock</button>`:''}
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
    try{const r=await api.post(`/sales-orders/${id}/confirm`);showToast(r.message,r.message.includes('delayed')?'warning':'success');if(r.auto_procurements)showToast('Auto procurement triggered!','info');renderSales();}
    catch(err){showToast(err.message,'error');if(err.data&&err.data.shortages){let msg='Shortages:\n';err.data.shortages.forEach(s=>{msg+=`${s.product_name}: need ${s.needed}, have ${s.available}\n`;});alert(msg);}}
}
async function showDeliverModal(id) {
    const order = await api.get(`/sales-orders/${id}`);
    openModal('Deliver Items', `<form id="del-form">
        ${order.items.map(i=>{const rem=i.quantity-i.delivered_qty;return rem>0?`<div class="form-group"><label>${i.product_name} (Remaining: ${rem})</label><input type="number" class="del-qty" data-pid="${i.product_id}" max="${rem}" min="0" value="${rem}"></div>`:''}).join('')}
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
    openModal(`Sales Order ${o.id}`, `<div class="detail-grid">
        <div class="detail-item"><label>Customer</label><span>${o.customer_name}</span></div>
        <div class="detail-item"><label>Status</label><span>${statusBadge(o.status)}</span></div>
        <div class="detail-item"><label>Total</label><span><strong>$${total.toFixed(2)}</strong></span></div>
        <div class="detail-item"><label>Created</label><span>${o.created_at?new Date(o.created_at).toLocaleString():'—'}</span></div>
    </div><div class="table-wrapper mt-4"><table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Line Total</th><th>Delivered</th></tr></thead>
    <tbody>${o.items.map(i=>`<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.price}</td><td>$${(i.quantity*i.price).toFixed(2)}</td><td>${i.delivered_qty}/${i.quantity}</td></tr>`).join('')}</tbody></table></div>`);
}
async function cancelSO(id){if(!confirm('Cancel this order?'))return;try{await api.post(`/sales-orders/${id}/cancel`);showToast('Cancelled','success');renderSales();}catch(e){showToast(e.message,'error');}}

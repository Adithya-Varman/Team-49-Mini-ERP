// Manufacturing Orders Page
async function renderManufacturing() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateMOModal()">+ New MO</button>';
    try {
        const orders = await api.get('/manufacturing-orders');
        content.innerHTML = `<div class="search-bar"><input id="mo-search" placeholder="Search..." oninput="filterMO()">
        <select id="mo-status" onchange="filterMO()"><option value="">All</option><option value="DRAFT">DRAFT</option><option value="CONFIRMED">CONFIRMED</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></select></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Completed</th><th>Auto</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="mo-tbody">${moRows(orders)}</tbody></table></div></div>`;
        window._allMO = orders;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function moRows(orders) {
    return orders.map(o=>`<tr><td><strong>${o.id}</strong></td><td>${o.product_name}</td><td>${o.quantity}</td><td>${o.completed_qty}/${o.quantity}</td>
        <td>${o.auto_generated?'⚡ Auto':'Manual'}</td><td>${statusBadge(o.status)}</td>
        <td><div class="btn-group">
            ${o.status==='DRAFT'?`<button class="btn btn-sm btn-success" onclick="confirmMO('${o.id}')">Confirm</button>`:''}
            ${o.status==='CONFIRMED'?`<button class="btn btn-sm btn-warning" onclick="startMO('${o.id}')">Start</button>`:''}
            ${o.status==='IN_PROGRESS'?`<button class="btn btn-sm btn-primary" onclick="showCompleteMOModal('${o.id}',${o.quantity-o.completed_qty})">Complete</button>`:''}
            ${o.status!=='COMPLETED'&&o.status!=='CANCELLED'?`<button class="btn btn-sm btn-danger" onclick="cancelMO('${o.id}')">Cancel</button>`:''}
        </div></td></tr>`).join('');
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
        <div class="form-group"><label>Completed Quantity (remaining: ${remaining})</label><input type="number" id="comp-qty" min="1" value="${remaining}" required></div>
        <button type="submit" class="btn btn-primary btn-block">Complete</button></form>`);
    document.getElementById('comp-form').onsubmit = async(e)=>{
        e.preventDefault();
        try{await api.post(`/manufacturing-orders/${id}/complete`,{completed_qty:+document.getElementById('comp-qty').value});closeModal();showToast('Production completed','success');renderManufacturing();}catch(err){showToast(err.message,'error');}
    };
}
async function cancelMO(id){if(!confirm('Cancel?'))return;try{await api.post(`/manufacturing-orders/${id}/cancel`);showToast('Cancelled','success');renderManufacturing();}catch(e){showToast(e.message,'error');}}

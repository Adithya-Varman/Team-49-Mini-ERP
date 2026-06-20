// BoM Page
async function renderBom() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateBomModal()">+ New BoM</button>';
    try {
        const boms = await api.get('/bom');
        content.innerHTML = `<div class="card"><div class="table-wrapper"><table><thead><tr><th>Product</th><th>Components</th><th>Actions</th></tr></thead>
        <tbody>${boms.map(b=>`<tr><td><strong>${b.product_name}</strong></td>
            <td>${b.items.map(i=>`${i.quantity} x ${i.component_name} (${i.component_unit})`).join('<br>')}</td>
            <td><div class="btn-group"><button class="btn btn-sm btn-warning" onclick="showEditBomModal('${b.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBom('${b.id}')">Del</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
async function showCreateBomModal() {
    const products = await api.get('/products');
    const finished = products.filter(p=>p.type==='FINISHED'||p.type==='SEMI_FINISHED');
    const components = products.filter(p=>p.type==='RAW'||p.type==='SEMI_FINISHED');
    openModal('Create BoM', `<form id="cbom-form">
        <div class="form-group"><label>Product</label><select id="cbom-product">${finished.map(p=>`<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}</select></div>
        <label>Components:</label><div id="cbom-items"></div>
        <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addBomItemRow('cbom-items')">+ Add Component</button>
        <button type="submit" class="btn btn-primary btn-block mt-4">Create</button></form>`);
    window._bomComponents = components;
    addBomItemRow('cbom-items');
    document.getElementById('cbom-form').onsubmit = async(e)=>{
        e.preventDefault();
        const items = collectBomItems('cbom-items');
        if(!items.length){showToast('Add components','error');return;}
        try{await api.post('/bom',{product_id:document.getElementById('cbom-product').value,items});closeModal();showToast('BoM created','success');renderBom();}catch(err){showToast(err.message,'error');}
    };
}
function addBomItemRow(containerId) {
    const c = window._bomComponents||[];
    const div = document.createElement('div');
    div.className = 'bom-item-row';
    div.innerHTML = `<select class="bom-comp">${c.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
        <input type="number" class="bom-qty" placeholder="Qty" min="0.01" step="0.01" required>
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById(containerId).appendChild(div);
}
function collectBomItems(containerId) {
    const rows = document.getElementById(containerId).querySelectorAll('.bom-item-row');
    return Array.from(rows).map(r=>({component_id:r.querySelector('.bom-comp').value,quantity:+r.querySelector('.bom-qty').value})).filter(i=>i.quantity>0);
}
async function showEditBomModal(id) {
    const bom = await api.get(`/bom/${id}`);
    const products = await api.get('/products');
    const components = products.filter(p=>p.type==='RAW'||p.type==='SEMI_FINISHED');
    window._bomComponents = components;
    openModal('Edit BoM', `<form id="ebom-form">
        <div class="form-group"><label>Product</label><input value="${bom.product_name}" disabled></div>
        <label>Components:</label><div id="ebom-items"></div>
        <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addBomItemRow('ebom-items')">+ Add</button>
        <button type="submit" class="btn btn-primary btn-block mt-4">Update</button></form>`);
    bom.items.forEach(item=>{
        const div = document.createElement('div');div.className='bom-item-row';
        div.innerHTML = `<select class="bom-comp">${components.map(p=>`<option value="${p.id}"${p.id===item.component_id?' selected':''}>${p.name}</option>`).join('')}</select>
            <input type="number" class="bom-qty" value="${item.quantity}" min="0.01" step="0.01" required>
            <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">×</button>`;
        document.getElementById('ebom-items').appendChild(div);
    });
    document.getElementById('ebom-form').onsubmit = async(e)=>{
        e.preventDefault();const items=collectBomItems('ebom-items');
        try{await api.put(`/bom/${id}`,{items});closeModal();showToast('Updated','success');renderBom();}catch(err){showToast(err.message,'error');}
    };
}
async function deleteBom(id){if(!confirm('Delete BoM?'))return;try{await api.del(`/bom/${id}`);showToast('Deleted','success');renderBom();}catch(e){showToast(e.message,'error');}}

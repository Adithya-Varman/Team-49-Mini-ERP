// Suppliers Page
async function renderSuppliers() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateSupplierModal()">+ New Supplier</button>';
    try {
        const suppliers = await api.get('/suppliers');
        content.innerHTML = `<div class="search-bar"><input id="sup-search" placeholder="Search..." oninput="filterSuppliers()"></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody id="suppliers-tbody">${suppliersRows(suppliers)}</tbody></table></div></div>`;
        window._allSuppliers = suppliers;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function suppliersRows(list) {
    return list.map(s => `<tr><td>${s.name}</td><td>${s.phone}</td><td>${s.email}</td><td>${s.address}</td>
        <td><div class="btn-group"><button class="btn btn-sm btn-warning" onclick="showEditSupplierModal('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${s.id}')">Del</button></div></td></tr>`).join('');
}
function filterSuppliers() {
    const q = document.getElementById('sup-search').value.toLowerCase();
    const f = (window._allSuppliers||[]).filter(s => s.name.toLowerCase().includes(q)||s.email.toLowerCase().includes(q));
    document.getElementById('suppliers-tbody').innerHTML = suppliersRows(f);
}
function showCreateSupplierModal() {
    openModal('Create Supplier', `<form id="cs-form"><div class="form-group"><label>Name</label><input id="cs-name" required></div>
        <div class="form-group"><label>Phone</label><input id="cs-phone"></div><div class="form-group"><label>Email</label><input id="cs-email"></div>
        <div class="form-group"><label>Address</label><textarea id="cs-addr" rows="2"></textarea></div>
        <button type="submit" class="btn btn-primary btn-block">Create</button></form>`);
    document.getElementById('cs-form').onsubmit = async(e)=>{e.preventDefault();try{await api.post('/suppliers',{name:document.getElementById('cs-name').value,phone:document.getElementById('cs-phone').value,email:document.getElementById('cs-email').value,address:document.getElementById('cs-addr').value});closeModal();showToast('Created','success');renderSuppliers();}catch(err){showToast(err.message,'error');}};
}
async function showEditSupplierModal(id) {
    const s = await api.get(`/suppliers/${id}`);
    openModal('Edit Supplier', `<form id="es-form"><div class="form-group"><label>Name</label><input id="es-name" value="${s.name}" required></div>
        <div class="form-group"><label>Phone</label><input id="es-phone" value="${s.phone}"></div><div class="form-group"><label>Email</label><input id="es-email" value="${s.email}"></div>
        <div class="form-group"><label>Address</label><textarea id="es-addr" rows="2">${s.address}</textarea></div>
        <button type="submit" class="btn btn-primary btn-block">Update</button></form>`);
    document.getElementById('es-form').onsubmit = async(e)=>{e.preventDefault();try{await api.put(`/suppliers/${id}`,{name:document.getElementById('es-name').value,phone:document.getElementById('es-phone').value,email:document.getElementById('es-email').value,address:document.getElementById('es-addr').value});closeModal();showToast('Updated','success');renderSuppliers();}catch(err){showToast(err.message,'error');}};
}
async function deleteSupplier(id){if(!confirm('Delete?'))return;try{await api.del(`/suppliers/${id}`);showToast('Deleted','success');renderSuppliers();}catch(e){showToast(e.message,'error');}}

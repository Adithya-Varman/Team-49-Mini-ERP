// Customers Page
async function renderCustomers() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateCustomerModal()">+ New Customer</button>';
    try {
        const customers = await api.get('/customers');
        content.innerHTML = `<div class="search-bar"><input id="cust-search" placeholder="Search..." oninput="filterCustomers()"></div>
        <div class="card"><div class="table-wrapper"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody id="customers-tbody">${customersRows(customers)}</tbody></table></div></div>`;
        window._allCustomers = customers;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
function customersRows(list) {
    return list.map(c => `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td><td>${c.address}</td>
        <td><div class="btn-group"><button class="btn btn-sm btn-warning" onclick="showEditCustomerModal('${c.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${c.id}')">Del</button></div></td></tr>`).join('');
}
function filterCustomers() {
    const q = document.getElementById('cust-search').value.toLowerCase();
    const f = (window._allCustomers||[]).filter(c => c.name.toLowerCase().includes(q)||c.email.toLowerCase().includes(q));
    document.getElementById('customers-tbody').innerHTML = customersRows(f);
}
function showCreateCustomerModal() {
    openModal('Create Customer', `<form id="cc-form"><div class="form-group"><label>Name</label><input id="cc-name" required></div>
        <div class="form-group"><label>Phone</label><input id="cc-phone"></div><div class="form-group"><label>Email</label><input id="cc-email"></div>
        <div class="form-group"><label>Address</label><textarea id="cc-addr" rows="2"></textarea></div>
        <button type="submit" class="btn btn-primary btn-block">Create</button></form>`);
    document.getElementById('cc-form').onsubmit = async(e)=>{e.preventDefault();try{await api.post('/customers',{name:document.getElementById('cc-name').value,phone:document.getElementById('cc-phone').value,email:document.getElementById('cc-email').value,address:document.getElementById('cc-addr').value});closeModal();showToast('Created','success');renderCustomers();}catch(err){showToast(err.message,'error');}};
}
async function showEditCustomerModal(id) {
    const c = await api.get(`/customers/${id}`);
    openModal('Edit Customer', `<form id="ec-form"><div class="form-group"><label>Name</label><input id="ec-name" value="${c.name}" required></div>
        <div class="form-group"><label>Phone</label><input id="ec-phone" value="${c.phone}"></div><div class="form-group"><label>Email</label><input id="ec-email" value="${c.email}"></div>
        <div class="form-group"><label>Address</label><textarea id="ec-addr" rows="2">${c.address}</textarea></div>
        <button type="submit" class="btn btn-primary btn-block">Update</button></form>`);
    document.getElementById('ec-form').onsubmit = async(e)=>{e.preventDefault();try{await api.put(`/customers/${id}`,{name:document.getElementById('ec-name').value,phone:document.getElementById('ec-phone').value,email:document.getElementById('ec-email').value,address:document.getElementById('ec-addr').value});closeModal();showToast('Updated','success');renderCustomers();}catch(err){showToast(err.message,'error');}};
}
async function deleteCustomer(id){if(!confirm('Delete?'))return;try{await api.del(`/customers/${id}`);showToast('Deleted','success');renderCustomers();}catch(e){showToast(e.message,'error');}}

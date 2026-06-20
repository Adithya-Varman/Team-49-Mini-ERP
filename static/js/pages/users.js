// Users Page
async function renderUsers() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateUserModal()">+ New User</button>';
    try {
        const users = await api.get('/users');
        content.innerHTML = `<div class="card"><div class="table-wrapper"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>${users.map(u => `<tr>
                <td>${u.name}</td><td>${u.email}</td><td>${statusBadge(u.role)}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-warning" onclick="showEditUserModal('${u.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Delete</button>
                </div></td>
            </tr>`).join('')}</tbody></table></div></div>`;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}

function showCreateUserModal() {
    openModal('Create User', `<form id="create-user-form">
        <div class="form-group"><label>Name</label><input id="cu-name" required></div>
        <div class="form-group"><label>Email</label><input type="email" id="cu-email" required></div>
        <div class="form-group"><label>Password</label><input type="password" id="cu-password" required></div>
        <div class="form-group"><label>Role</label><select id="cu-role">
            <option value="ADMIN">ADMIN</option><option value="SALES">SALES</option>
            <option value="PURCHASE">PURCHASE</option><option value="MANUFACTURING">MANUFACTURING</option>
        </select></div>
        <button type="submit" class="btn btn-primary btn-block">Create</button>
    </form>`);
    document.getElementById('create-user-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', { name: document.getElementById('cu-name').value, email: document.getElementById('cu-email').value, password: document.getElementById('cu-password').value, role: document.getElementById('cu-role').value });
            closeModal(); showToast('User created', 'success'); renderUsers();
        } catch(err) { showToast(err.message, 'error'); }
    };
}

async function showEditUserModal(userId) {
    const users = await api.get('/users');
    const u = users.find(x => x.id === userId);
    if (!u) return;
    openModal('Edit User', `<form id="edit-user-form">
        <div class="form-group"><label>Name</label><input id="eu-name" value="${u.name}" required></div>
        <div class="form-group"><label>Email</label><input type="email" id="eu-email" value="${u.email}" required></div>
        <div class="form-group"><label>Password (leave blank to keep)</label><input type="password" id="eu-password"></div>
        <div class="form-group"><label>Role</label><select id="eu-role">
            ${['ADMIN','SALES','PURCHASE','MANUFACTURING'].map(r=>`<option value="${r}"${r===u.role?' selected':''}>${r}</option>`).join('')}
        </select></div>
        <button type="submit" class="btn btn-primary btn-block">Update</button>
    </form>`);
    document.getElementById('edit-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = { name: document.getElementById('eu-name').value, email: document.getElementById('eu-email').value, role: document.getElementById('eu-role').value };
        const pw = document.getElementById('eu-password').value;
        if (pw) data.password = pw;
        try {
            await api.put(`/users/${userId}`, data);
            closeModal(); showToast('User updated', 'success'); renderUsers();
        } catch(err) { showToast(err.message, 'error'); }
    };
}

async function deleteUser(userId) {
    if (!confirm('Delete this user?')) return;
    try { await api.del(`/users/${userId}`); showToast('User deleted', 'success'); renderUsers(); }
    catch(err) { showToast(err.message, 'error'); }
}

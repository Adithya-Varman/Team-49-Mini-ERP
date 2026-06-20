// Products Page
async function renderProducts() {
    const content = document.getElementById('page-content');
    document.getElementById('header-actions').innerHTML = '<button class="btn btn-primary" onclick="showCreateProductModal()">+ New Product</button>';
    try {
        const products = await api.get('/products');
        content.innerHTML = `
        <div class="search-bar"><input id="prod-search" placeholder="Search by name or SKU..." oninput="filterProducts()"><select id="prod-type-filter" onchange="filterProducts()"><option value="">All Types</option><option value="RAW">RAW</option><option value="SEMI_FINISHED">SEMI FINISHED</option><option value="FINISHED">FINISHED</option></select></div>
        <div class="card"><div class="table-wrapper"><table>
            <thead><tr><th>SKU</th><th>Name</th><th>Type</th><th>Unit</th><th>On Hand</th><th>Reserved</th><th>Free</th><th>Strategy</th><th>Actions</th></tr></thead>
            <tbody id="products-tbody">${productsTableRows(products)}</tbody></table></div></div>`;
        window._allProducts = products;
    } catch(e) { content.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}

function productsTableRows(products) {
    return products.map(p => `<tr>
        <td>${p.sku}</td><td>${p.name}</td><td>${statusBadge(p.type)}</td><td>${p.unit}</td>
        <td>${p.on_hand_qty}</td><td>${p.reserved_qty}</td><td><strong>${p.free_to_use_qty}</strong></td>
        <td>${p.procurement_strategy}</td>
        <td><div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="showProductDetail('${p.id}')">View</button>
            <button class="btn btn-sm btn-warning" onclick="showEditProductModal('${p.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Del</button>
        </div></td></tr>`).join('');
}

function filterProducts() {
    const search = document.getElementById('prod-search').value.toLowerCase();
    const type = document.getElementById('prod-type-filter').value;
    let filtered = window._allProducts || [];
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    if (type) filtered = filtered.filter(p => p.type === type);
    document.getElementById('products-tbody').innerHTML = productsTableRows(filtered);
}

async function showProductDetail(id) {
    const p = await api.get(`/products/${id}`);
    openModal(p.name, `<div class="detail-grid">
        <div class="detail-item"><label>SKU</label><span>${p.sku}</span></div>
        <div class="detail-item"><label>Type</label><span>${p.type}</span></div>
        <div class="detail-item"><label>Unit</label><span>${p.unit}</span></div>
        <div class="detail-item"><label>Sales Price</label><span>${p.sales_price}</span></div>
        <div class="detail-item"><label>Cost Price</label><span>${p.cost_price}</span></div>
        <div class="detail-item"><label>Min Stock</label><span>${p.min_stock}</span></div>
        <div class="detail-item"><label>On Hand</label><span>${p.on_hand_qty}</span></div>
        <div class="detail-item"><label>Reserved</label><span>${p.reserved_qty}</span></div>
        <div class="detail-item"><label>Free To Use</label><span><strong>${p.free_to_use_qty}</strong></span></div>
        <div class="detail-item"><label>Strategy</label><span>${p.procurement_strategy}</span></div>
        <div class="detail-item"><label>Procure On Demand</label><span>${p.procure_on_demand ? 'Yes' : 'No'}</span></div>
        <div class="detail-item"><label>Procurement Type</label><span>${p.procurement_type}</span></div>
    </div><p class="mt-4 text-muted">${p.description || 'No description'}</p>`);
}

async function showCreateProductModal() {
    const suppliers = await api.get('/suppliers');
    openModal('Create Product', `<form id="create-product-form">
        <div class="detail-grid">
            <div class="form-group"><label>SKU</label><input id="cp-sku" required></div>
            <div class="form-group"><label>Name</label><input id="cp-name" required></div>
        </div>
        <div class="form-group"><label>Description</label><textarea id="cp-desc" rows="2"></textarea></div>
        <div class="detail-grid">
            <div class="form-group"><label>Type</label><select id="cp-type"><option value="RAW">RAW</option><option value="SEMI_FINISHED">SEMI FINISHED</option><option value="FINISHED">FINISHED</option></select></div>
            <div class="form-group"><label>Unit</label><select id="cp-unit"><option value="pcs">pcs</option><option value="kg">kg</option><option value="L">L</option><option value="m">m</option></select></div>
            <div class="form-group"><label>Sales Price</label><input type="number" id="cp-sprice" value="0" step="0.01"></div>
            <div class="form-group"><label>Cost Price</label><input type="number" id="cp-cprice" value="0" step="0.01"></div>
            <div class="form-group"><label>Min Stock</label><input type="number" id="cp-minstock" value="0"></div>
            <div class="form-group"><label>On Hand Qty</label><input type="number" id="cp-onhand" value="0"></div>
            <div class="form-group"><label>Strategy</label><select id="cp-strategy"><option value="MTS">MTS</option><option value="MTO">MTO</option></select></div>
            <div class="form-group"><label>Procure On Demand</label><select id="cp-pod"><option value="false">No</option><option value="true">Yes</option></select></div>
            <div class="form-group"><label>Procurement Type</label><select id="cp-ptype"><option value="PURCHASE">PURCHASE</option><option value="MANUFACTURING">MANUFACTURING</option></select></div>
            <div class="form-group"><label>Default Supplier</label><select id="cp-supplier"><option value="">None</option>${suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-2">Create</button>
    </form>`);
    document.getElementById('create-product-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', {
                sku: document.getElementById('cp-sku').value, name: document.getElementById('cp-name').value,
                description: document.getElementById('cp-desc').value, type: document.getElementById('cp-type').value,
                unit: document.getElementById('cp-unit').value, sales_price: +document.getElementById('cp-sprice').value,
                cost_price: +document.getElementById('cp-cprice').value, min_stock: +document.getElementById('cp-minstock').value,
                on_hand_qty: +document.getElementById('cp-onhand').value, reserved_qty: 0,
                procurement_strategy: document.getElementById('cp-strategy').value,
                procure_on_demand: document.getElementById('cp-pod').value === 'true',
                procurement_type: document.getElementById('cp-ptype').value,
                default_supplier_id: document.getElementById('cp-supplier').value || null,
            });
            closeModal(); showToast('Product created', 'success'); renderProducts();
        } catch(err) { showToast(err.message, 'error'); }
    };
}

async function showEditProductModal(id) {
    const p = await api.get(`/products/${id}`);
    const suppliers = await api.get('/suppliers');
    openModal('Edit Product', `<form id="edit-product-form">
        <div class="detail-grid">
            <div class="form-group"><label>SKU</label><input id="ep-sku" value="${p.sku}" required></div>
            <div class="form-group"><label>Name</label><input id="ep-name" value="${p.name}" required></div>
        </div>
        <div class="form-group"><label>Description</label><textarea id="ep-desc" rows="2">${p.description||''}</textarea></div>
        <div class="detail-grid">
            <div class="form-group"><label>Type</label><select id="ep-type">${['RAW','SEMI_FINISHED','FINISHED'].map(t=>`<option value="${t}"${t===p.type?' selected':''}>${t}</option>`).join('')}</select></div>
            <div class="form-group"><label>Unit</label><select id="ep-unit">${['pcs','kg','L','m'].map(u=>`<option value="${u}"${u===p.unit?' selected':''}>${u}</option>`).join('')}</select></div>
            <div class="form-group"><label>Sales Price</label><input type="number" id="ep-sprice" value="${p.sales_price}" step="0.01"></div>
            <div class="form-group"><label>Cost Price</label><input type="number" id="ep-cprice" value="${p.cost_price}" step="0.01"></div>
            <div class="form-group"><label>Min Stock</label><input type="number" id="ep-minstock" value="${p.min_stock}"></div>
            <div class="form-group"><label>Strategy</label><select id="ep-strategy">${['MTS','MTO'].map(s=>`<option value="${s}"${s===p.procurement_strategy?' selected':''}>${s}</option>`).join('')}</select></div>
            <div class="form-group"><label>Procure On Demand</label><select id="ep-pod"><option value="false"${!p.procure_on_demand?' selected':''}>No</option><option value="true"${p.procure_on_demand?' selected':''}>Yes</option></select></div>
            <div class="form-group"><label>Procurement Type</label><select id="ep-ptype">${['PURCHASE','MANUFACTURING'].map(t=>`<option value="${t}"${t===p.procurement_type?' selected':''}>${t}</option>`).join('')}</select></div>
            <div class="form-group"><label>Default Supplier</label><select id="ep-supplier"><option value="">None</option>${suppliers.map(s=>`<option value="${s.id}"${s.id===p.default_supplier_id?' selected':''}>${s.name}</option>`).join('')}</select></div>
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-2">Update</button>
    </form>`);
    document.getElementById('edit-product-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/products/${id}`, {
                sku: document.getElementById('ep-sku').value, name: document.getElementById('ep-name').value,
                description: document.getElementById('ep-desc').value, type: document.getElementById('ep-type').value,
                unit: document.getElementById('ep-unit').value, sales_price: +document.getElementById('ep-sprice').value,
                cost_price: +document.getElementById('ep-cprice').value, min_stock: +document.getElementById('ep-minstock').value,
                procurement_strategy: document.getElementById('ep-strategy').value,
                procure_on_demand: document.getElementById('ep-pod').value === 'true',
                procurement_type: document.getElementById('ep-ptype').value,
                default_supplier_id: document.getElementById('ep-supplier').value || null,
            });
            closeModal(); showToast('Product updated', 'success'); renderProducts();
        } catch(err) { showToast(err.message, 'error'); }
    };
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try { await api.del(`/products/${id}`); showToast('Product deleted', 'success'); renderProducts(); }
    catch(err) { showToast(err.message, 'error'); }
}

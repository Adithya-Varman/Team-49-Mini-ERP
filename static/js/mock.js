// ============================================================================
// MOCK BACKEND — testing only (no FastAPI server required)
// Overrides the api.* methods with an in-memory store so every page renders.
// Remove the <script src="/js/mock.js"> tag in index.html to use the real API.
// ============================================================================
(function () {
  const now = () => new Date().toISOString();
  const iso = (d) => new Date(d).toISOString();

  // ----------------------------- Seed data --------------------------------
  const db = {
    users: [
      { id: 'U1', name: 'Aditi Admin', email: 'admin@erp.com', role: 'ADMIN', created_at: iso('2026-01-04') },
      { id: 'U2', name: 'Sam Sales', email: 'sales@erp.com', role: 'SALES', created_at: iso('2026-02-11') },
      { id: 'U3', name: 'Pat Purchase', email: 'purchase@erp.com', role: 'PURCHASE', created_at: iso('2026-03-02') },
      { id: 'U4', name: 'Manu Maker', email: 'mfg@erp.com', role: 'MANUFACTURING', created_at: iso('2026-03-20') },
    ],
    products: [
      { id: 'P1', sku: 'FRM-001', name: 'Carbon Frame', description: 'Lightweight carbon fiber frame', type: 'FINISHED', unit: 'pcs', sales_price: 420, cost_price: 300, min_stock: 10, on_hand_qty: 8, reserved_qty: 2, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'MANUFACTURING', default_supplier_id: null },
      { id: 'P2', sku: 'LED-002', name: 'LED Headlight', description: 'High-lumen LED headlight', type: 'FINISHED', unit: 'pcs', sales_price: 35, cost_price: 20, min_stock: 20, on_hand_qty: 50, reserved_qty: 10, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'PURCHASE', default_supplier_id: 'S1' },
      { id: 'P3', sku: 'BAT-003', name: 'E-Bike Battery Pack', description: '48V lithium battery pack', type: 'FINISHED', unit: 'pcs', sales_price: 880, cost_price: 600, min_stock: 5, on_hand_qty: 12, reserved_qty: 3, procurement_strategy: 'MTO', procure_on_demand: true, procurement_type: 'MANUFACTURING', default_supplier_id: null },
      { id: 'P4', sku: 'WHL-004', name: 'Wheel Assembly', description: 'Complete wheel assembly', type: 'SEMI_FINISHED', unit: 'pcs', sales_price: 150, cost_price: 90, min_stock: 15, on_hand_qty: 6, reserved_qty: 0, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'MANUFACTURING', default_supplier_id: null },
      { id: 'P5', sku: 'BRK-005', name: 'Brake Caliper', description: 'Hydraulic brake caliper', type: 'RAW', unit: 'pcs', sales_price: 60, cost_price: 30, min_stock: 40, on_hand_qty: 120, reserved_qty: 20, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'PURCHASE', default_supplier_id: 'S2' },
      { id: 'P6', sku: 'STL-006', name: 'Steel Tube', description: 'Cr-Mo steel tubing', type: 'RAW', unit: 'm', sales_price: 8, cost_price: 4, min_stock: 100, on_hand_qty: 80, reserved_qty: 0, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'PURCHASE', default_supplier_id: 'S3' },
      { id: 'P7', sku: 'CTL-007', name: 'Control Board', description: 'Motor controller PCB', type: 'RAW', unit: 'pcs', sales_price: 210, cost_price: 140, min_stock: 10, on_hand_qty: 25, reserved_qty: 5, procurement_strategy: 'MTS', procure_on_demand: false, procurement_type: 'PURCHASE', default_supplier_id: 'S1' },
    ],
    customers: [
      { id: 'C1', name: 'Acme Corp', phone: '555-0101', email: 'orders@acme.com', address: '12 Industrial Ave, Detroit' },
      { id: 'C2', name: 'Globex Industries', phone: '555-0102', email: 'buy@globex.com', address: '88 Market St, Chicago' },
      { id: 'C3', name: 'Initech LLC', phone: '555-0103', email: 'po@initech.com', address: '4 Tech Park, Austin' },
      { id: 'C4', name: 'Umbrella Co', phone: '555-0104', email: 'supply@umbrella.com', address: '1 Raccoon Plaza' },
      { id: 'C5', name: 'Wayne Enterprises', phone: '555-0105', email: 'procure@wayne.com', address: '1007 Mountain Dr, Gotham' },
      { id: 'C6', name: 'Stark Mobility', phone: '555-0106', email: 'parts@stark.com', address: '10880 Malibu Point' },
    ],
    suppliers: [
      { id: 'S1', name: 'BrightParts Co', phone: '555-0201', email: 'sales@brightparts.com', address: '500 Supplier Rd, San Jose' },
      { id: 'S2', name: 'MetalWorks Ltd', phone: '555-0202', email: 'orders@metalworks.com', address: '210 Forge Ln, Pittsburgh' },
      { id: 'S3', name: 'TubeTech Supply', phone: '555-0203', email: 'hello@tubetech.com', address: '34 Mill St, Cleveland' },
      { id: 'S4', name: 'CircuitHub', phone: '555-0204', email: 'sales@circuithub.com', address: '9 Silicon Way, Santa Clara' },
    ],
    boms: [
      { id: 'B1', product_id: 'P1', items: [ { component_id: 'P5', quantity: 2 }, { component_id: 'P6', quantity: 4 } ] },
      { id: 'B2', product_id: 'P4', items: [ { component_id: 'P6', quantity: 3 } ] },
    ],
    salesOrders: [
      { id: 'SO-1001', customer_id: 'C1', status: 'CONFIRMED', created_at: iso('2026-06-12T10:30:00Z'),
        items: [ { product_id: 'P1', quantity: 5, price: 420, delivered_qty: 0 }, { product_id: 'P2', quantity: 10, price: 35, delivered_qty: 0 } ] },
      { id: 'SO-1002', customer_id: 'C2', status: 'DRAFT', created_at: iso('2026-06-15T09:05:00Z'),
        items: [ { product_id: 'P3', quantity: 3, price: 880, delivered_qty: 0 } ] },
      { id: 'SO-1003', customer_id: 'C3', status: 'PARTIALLY_DELIVERED', created_at: iso('2026-06-08T14:45:00Z'),
        items: [ { product_id: 'P4', quantity: 8, price: 150, delivered_qty: 5 }, { product_id: 'P5', quantity: 8, price: 60, delivered_qty: 3 } ] },
      { id: 'SO-1004', customer_id: 'C4', status: 'FULLY_DELIVERED', created_at: iso('2026-05-29T11:20:00Z'),
        items: [ { product_id: 'P1', quantity: 2, price: 420, delivered_qty: 2 } ] },
      { id: 'SO-1005', customer_id: 'C5', status: 'CANCELLED', created_at: iso('2026-06-02T16:00:00Z'),
        items: [ { product_id: 'P7', quantity: 4, price: 210, delivered_qty: 0 } ] },
    ],
    purchaseOrders: [
      { id: 'PO-2001', supplier_id: 'S1', status: 'CONFIRMED', auto_generated: false,
        items: [ { product_id: 'P2', quantity: 30, received_qty: 0 }, { product_id: 'P7', quantity: 10, received_qty: 0 } ] },
      { id: 'PO-2002', supplier_id: 'S2', status: 'PARTIALLY_RECEIVED', auto_generated: true,
        items: [ { product_id: 'P5', quantity: 50, received_qty: 20 } ] },
      { id: 'PO-2003', supplier_id: 'S3', status: 'DRAFT', auto_generated: false,
        items: [ { product_id: 'P6', quantity: 200, received_qty: 0 } ] },
      { id: 'PO-2004', supplier_id: 'S1', status: 'FULLY_RECEIVED', auto_generated: false,
        items: [ { product_id: 'P2', quantity: 15, received_qty: 15 } ] },
    ],
    manufacturingOrders: [
      { id: 'MO-3001', product_id: 'P1', quantity: 10, completed_qty: 0, status: 'CONFIRMED', auto_generated: false },
      { id: 'MO-3002', product_id: 'P4', quantity: 20, completed_qty: 8, status: 'IN_PROGRESS', auto_generated: true },
      { id: 'MO-3003', product_id: 'P3', quantity: 5, completed_qty: 5, status: 'COMPLETED', auto_generated: false },
      { id: 'MO-3004', product_id: 'P1', quantity: 4, completed_qty: 0, status: 'DRAFT', auto_generated: false },
    ],
    ledger: {
      P5: [
        { date: iso('2026-06-10T09:00:00Z'), change: 50, reason: 'Purchase receipt', reference: 'PO-2002', user_name: 'Pat Purchase' },
        { date: iso('2026-06-11T15:30:00Z'), change: -20, reason: 'Reserved for SO', reference: 'SO-1003', user_name: 'Sam Sales' },
      ],
      P1: [
        { date: iso('2026-05-29T11:25:00Z'), change: -2, reason: 'Delivery', reference: 'SO-1004', user_name: 'Sam Sales' },
        { date: iso('2026-06-01T10:00:00Z'), change: 10, reason: 'Manufacturing output', reference: 'MO-3003', user_name: 'Manu Maker' },
      ],
    },
    auditLogs: [
      { timestamp: iso('2026-06-20T09:30:00Z'), user_name: 'Aditi Admin', action: 'CREATE', entity_type: 'SalesOrder', reference_id: 'SO-1002' },
      { timestamp: iso('2026-06-19T16:10:00Z'), user_name: 'Pat Purchase', action: 'RECEIVE', entity_type: 'PurchaseOrder', reference_id: 'PO-2002' },
      { timestamp: iso('2026-06-19T11:00:00Z'), user_name: 'Manu Maker', action: 'UPDATE', entity_type: 'ManufacturingOrder', reference_id: 'MO-3002' },
      { timestamp: iso('2026-06-18T08:40:00Z'), user_name: 'Aditi Admin', action: 'CREATE', entity_type: 'Product', reference_id: 'P7' },
      { timestamp: iso('2026-06-17T13:20:00Z'), user_name: 'Sam Sales', action: 'DELIVER', entity_type: 'SalesOrder', reference_id: 'SO-1003' },
    ],
    notifications: [
      { id: 'N1', title: 'Low stock: Carbon Frame', message: 'On hand (8) is below minimum (10).', type: 'LOW_STOCK', is_read: false, timestamp: iso('2026-06-20T08:00:00Z') },
      { id: 'N2', title: 'Auto procurement created', message: 'PO-2002 auto-generated for Brake Caliper.', type: 'AUTO_PROCUREMENT', is_read: false, timestamp: iso('2026-06-19T16:05:00Z') },
      { id: 'N3', title: 'Order delivered', message: 'SO-1004 fully delivered to Umbrella Co.', type: 'INFO', is_read: true, timestamp: iso('2026-05-29T11:30:00Z') },
    ],
  };

  // ----------------------------- Helpers ----------------------------------
  let seq = 1000;
  const nid = (prefix) => `${prefix}${++seq}`;
  const pName = (id) => (db.products.find((p) => p.id === id) || {}).name || id;
  const pUnit = (id) => (db.products.find((p) => p.id === id) || {}).unit || '';
  const cName = (id) => (db.customers.find((c) => c.id === id) || {}).name || id;
  const sName = (id) => (db.suppliers.find((s) => s.id === id) || {}).name || id;
  const free = (p) => ({ ...p, free_to_use_qty: p.on_hand_qty - p.reserved_qty });
  const soOut = (o) => ({ ...o, customer_name: cName(o.customer_id),
    items: o.items.map((i) => ({ ...i, product_name: pName(i.product_id) })) });
  const poOut = (o) => ({ ...o, supplier_name: sName(o.supplier_id),
    items: o.items.map((i) => ({ ...i, product_name: pName(i.product_id) })) });
  const moOut = (o) => ({ ...o, product_name: pName(o.product_id) });
  const bomOut = (b) => ({ ...b, product_name: pName(b.product_id),
    items: b.items.map((i) => ({ ...i, component_name: pName(i.component_id), component_unit: pUnit(i.component_id) })) });
  const addStock = (pid, qty) => { const p = db.products.find((x) => x.id === pid); if (p) p.on_hand_qty += qty; };
  const err = (status, message, data) => { throw { status, message, data: data || null }; };
  const byId = (arr, id) => arr.find((x) => x.id === id);

  // ----------------------------- Router -----------------------------------
  function handle(method, rawEndpoint) {
    const body = arguments[2] || null;
    const [path, query] = rawEndpoint.split('?');
    const seg = path.split('/').filter(Boolean); // e.g. ['sales-orders','SO-1001','confirm']
    const qp = new URLSearchParams(query || '');

    // ---- auth ----
    if (path === '/auth/login' && method === 'POST') {
      const email = (body && body.email) || '';
      let role = 'ADMIN';
      if (/sales/i.test(email)) role = 'SALES';
      else if (/purchase/i.test(email)) role = 'PURCHASE';
      else if (/mfg|manuf/i.test(email)) role = 'MANUFACTURING';
      const existing = db.users.find((u) => u.email === email);
      const user = existing || { id: 'U0', name: email.split('@')[0] || 'Demo User', email, role };
      return { token: 'mock-token-' + Date.now(), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }

    // ---- dashboard ----
    if (path === '/dashboard' && method === 'GET') return dashboard();

    // ---- notifications ----
    if (path === '/notifications/unread-count') return { count: db.notifications.filter((n) => !n.is_read).length };
    if (path === '/notifications' && method === 'GET') return db.notifications.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (path === '/notifications/mark-all-read' && method === 'POST') { db.notifications.forEach((n) => (n.is_read = true)); return { ok: true }; }
    if (seg[0] === 'notifications' && seg[2] === 'read' && method === 'POST') { const n = byId(db.notifications, seg[1]); if (n) n.is_read = true; return { ok: true }; }

    // ---- audit / ledger ----
    if (path === '/audit-logs' && method === 'GET') return db.auditLogs.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (path === '/stock-ledger' && method === 'GET') return (db.ledger[qp.get('product_id')] || []).slice().sort((a, b) => b.date.localeCompare(a.date));

    // ---- users ----
    if (seg[0] === 'users') {
      if (method === 'GET' && !seg[1]) return db.users.slice();
      if (method === 'POST') { const u = { id: nid('U'), created_at: now(), ...body }; db.users.push(u); return u; }
      if (method === 'PUT') { const u = byId(db.users, seg[1]); if (!u) err(404, 'User not found'); Object.assign(u, body); return u; }
      if (method === 'DELETE') { db.users = db.users.filter((x) => x.id !== seg[1]); return { ok: true }; }
    }

    // ---- products ----
    if (seg[0] === 'products') {
      if (seg[1] === 'finished' && method === 'GET') return db.products.filter((p) => p.type === 'FINISHED').map(free);
      if (method === 'GET' && seg[1]) { const p = byId(db.products, seg[1]); if (!p) err(404, 'Product not found'); return free(p); }
      if (method === 'GET') return db.products.map(free);
      if (method === 'POST') { const p = { id: nid('P'), reserved_qty: 0, ...body }; db.products.push(p); return free(p); }
      if (method === 'PUT') { const p = byId(db.products, seg[1]); if (!p) err(404, 'Product not found'); Object.assign(p, body); return free(p); }
      if (method === 'DELETE') { db.products = db.products.filter((x) => x.id !== seg[1]); return { ok: true }; }
    }

    // ---- inventory ----
    if (path === '/inventory' && method === 'GET') return db.products.map(free);

    // ---- customers ----
    if (seg[0] === 'customers') {
      if (method === 'GET' && seg[1]) { const c = byId(db.customers, seg[1]); if (!c) err(404, 'Customer not found'); return c; }
      if (method === 'GET') return db.customers.slice();
      if (method === 'POST') { const c = { id: nid('C'), ...body }; db.customers.push(c); return c; }
      if (method === 'PUT') { const c = byId(db.customers, seg[1]); if (!c) err(404, 'Customer not found'); Object.assign(c, body); return c; }
      if (method === 'DELETE') { db.customers = db.customers.filter((x) => x.id !== seg[1]); return { ok: true }; }
    }

    // ---- suppliers ----
    if (seg[0] === 'suppliers') {
      if (method === 'GET' && seg[1]) { const s = byId(db.suppliers, seg[1]); if (!s) err(404, 'Supplier not found'); return s; }
      if (method === 'GET') return db.suppliers.slice();
      if (method === 'POST') { const s = { id: nid('S'), ...body }; db.suppliers.push(s); return s; }
      if (method === 'PUT') { const s = byId(db.suppliers, seg[1]); if (!s) err(404, 'Supplier not found'); Object.assign(s, body); return s; }
      if (method === 'DELETE') { db.suppliers = db.suppliers.filter((x) => x.id !== seg[1]); return { ok: true }; }
    }

    // ---- bom ----
    if (seg[0] === 'bom') {
      if (method === 'GET' && seg[1]) { const b = byId(db.boms, seg[1]); if (!b) err(404, 'BoM not found'); return bomOut(b); }
      if (method === 'GET') return db.boms.map(bomOut);
      if (method === 'POST') { const b = { id: nid('B'), product_id: body.product_id, items: body.items }; db.boms.push(b); return bomOut(b); }
      if (method === 'PUT') { const b = byId(db.boms, seg[1]); if (!b) err(404, 'BoM not found'); b.items = body.items; return bomOut(b); }
      if (method === 'DELETE') { db.boms = db.boms.filter((x) => x.id !== seg[1]); return { ok: true }; }
    }

    // ---- sales orders ----
    if (seg[0] === 'sales-orders') {
      if (method === 'GET' && seg[1]) { const o = byId(db.salesOrders, seg[1]); if (!o) err(404, 'Order not found'); return soOut(o); }
      if (method === 'GET') return db.salesOrders.map(soOut);
      if (method === 'POST' && !seg[1]) {
        const o = { id: nid('SO-'), customer_id: body.customer_id, status: 'DRAFT', created_at: now(),
          items: body.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, delivered_qty: 0 })) };
        db.salesOrders.push(o); return { id: o.id };
      }
      const o = byId(db.salesOrders, seg[1]);
      if (seg[2] === 'confirm' && method === 'POST') { if (o) o.status = 'CONFIRMED'; return { message: 'Order confirmed', auto_procurements: false }; }
      if (seg[2] === 'cancel' && method === 'POST') { if (o) o.status = 'CANCELLED'; return { message: 'Order cancelled' }; }
      if (seg[2] === 'deliver' && method === 'POST') {
        (body.items || []).forEach((d) => { const it = o.items.find((x) => x.product_id === d.product_id); if (it) it.delivered_qty = Math.min(it.quantity, it.delivered_qty + d.deliver_qty); });
        o.status = o.items.every((i) => i.delivered_qty >= i.quantity) ? 'FULLY_DELIVERED' : 'PARTIALLY_DELIVERED';
        return { message: 'Delivered' };
      }
    }

    // ---- purchase orders ----
    if (seg[0] === 'purchase-orders') {
      if (method === 'GET' && seg[1]) { const o = byId(db.purchaseOrders, seg[1]); if (!o) err(404, 'PO not found'); return poOut(o); }
      if (method === 'GET') return db.purchaseOrders.map(poOut);
      if (method === 'POST' && !seg[1]) {
        const o = { id: nid('PO-'), supplier_id: body.supplier_id, status: 'DRAFT', auto_generated: false,
          items: body.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, received_qty: 0 })) };
        db.purchaseOrders.push(o); return { id: o.id };
      }
      const o = byId(db.purchaseOrders, seg[1]);
      if (seg[2] === 'confirm' && method === 'POST') { if (o) o.status = 'CONFIRMED'; return { message: 'PO confirmed' }; }
      if (seg[2] === 'cancel' && method === 'POST') { if (o) o.status = 'CANCELLED'; return { message: 'PO cancelled' }; }
      if (seg[2] === 'receive' && method === 'POST') {
        (body.items || []).forEach((r) => { const it = o.items.find((x) => x.product_id === r.product_id); if (it) { const add = Math.min(it.quantity - it.received_qty, r.receive_qty); it.received_qty += add; addStock(it.product_id, add); } });
        o.status = o.items.every((i) => i.received_qty >= i.quantity) ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
        return { message: 'Received' };
      }
    }

    // ---- manufacturing orders ----
    if (seg[0] === 'manufacturing-orders') {
      if (method === 'GET') return db.manufacturingOrders.map(moOut);
      if (method === 'POST' && !seg[1]) {
        const o = { id: nid('MO-'), product_id: body.product_id, quantity: body.quantity, completed_qty: 0, status: 'DRAFT', auto_generated: false };
        db.manufacturingOrders.push(o); return { id: o.id };
      }
      const o = byId(db.manufacturingOrders, seg[1]);
      if (seg[2] === 'confirm' && method === 'POST') { if (o) o.status = 'CONFIRMED'; return { message: 'MO confirmed' }; }
      if (seg[2] === 'start' && method === 'POST') { if (o) o.status = 'IN_PROGRESS'; return { message: 'Production started' }; }
      if (seg[2] === 'cancel' && method === 'POST') { if (o) o.status = 'CANCELLED'; return { message: 'MO cancelled' }; }
      if (seg[2] === 'complete' && method === 'POST') {
        if (o) { o.completed_qty = Math.min(o.quantity, o.completed_qty + (body.completed_qty || 0)); addStock(o.product_id, body.completed_qty || 0); if (o.completed_qty >= o.quantity) o.status = 'COMPLETED'; }
        return { message: 'Production completed' };
      }
    }

    err(404, `Mock: no handler for ${method} ${path}`);
  }

  function dashboard() {
    const low = db.products.filter((p) => p.on_hand_qty < p.min_stock)
      .map((p) => ({ product_name: p.name, on_hand: p.on_hand_qty, min_stock: p.min_stock, type: p.type }));
    return {
      total_users: db.users.length,
      total_products: db.products.length,
      sales_orders: db.salesOrders.length,
      purchase_orders: db.purchaseOrders.length,
      manufacturing_orders: db.manufacturingOrders.length,
      low_stock_alerts: low,
      recent_audit_logs: db.auditLogs.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5),
      // SALES role
      total_orders: db.salesOrders.length,
      confirmed_orders: db.salesOrders.filter((o) => o.status === 'CONFIRMED').length,
      partial_deliveries: db.salesOrders.filter((o) => o.status === 'PARTIALLY_DELIVERED').length,
      completed_deliveries: db.salesOrders.filter((o) => o.status === 'FULLY_DELIVERED').length,
      // PURCHASE role
      pending_receipts: db.purchaseOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PARTIALLY_RECEIVED').length,
      completed_receipts: db.purchaseOrders.filter((o) => o.status === 'FULLY_RECEIVED').length,
      // MANUFACTURING role
      in_progress: db.manufacturingOrders.filter((o) => o.status === 'IN_PROGRESS').length,
      completed: db.manufacturingOrders.filter((o) => o.status === 'COMPLETED').length,
    };
  }

  // ------------------------- Override api.* --------------------------------
  const respond = (method) => (endpoint, body) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        try { resolve(handle(method, endpoint, body)); }
        catch (e) { reject(e.status ? e : { status: 500, message: e.message || 'Mock error', data: null }); }
      }, 60);
    });

  api.get = respond('GET');
  api.post = respond('POST');
  api.put = respond('PUT');
  api.del = respond('DELETE');

  console.info('%c[mock backend active] no FastAPI server needed — login with any email/password', 'color:#2563eb;font-weight:bold');
})();

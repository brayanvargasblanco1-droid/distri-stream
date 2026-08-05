/**
 * 🛒 PANEL DE COMPRAS PARA OPERADORES Y REVENDEDORES
 * Distrito Streaming
 */

// ═══════════════════════════════════════════════════════════════
// 📊 HELPERS
// ═══════════════════════════════════════════════════════════════

function getDaysLeft(expiresAt) {
  if (!expiresAt) return null;
  try {
    const exp = new Date(expiresAt);
    const now = new Date();
    const ms = exp.getTime() - now.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

function getProductColor(productName) {
  if (!productName) return '#7AA6C8';
  const name = productName.toLowerCase();
  if (name.includes('netflix')) return '#E50914';
  if (name.includes('spotify')) return '#1DB954';
  if (name.includes('prime') || name.includes('amazon')) return '#00A8E1';
  if (name.includes('max')) return '#0877ff';
  if (name.includes('disney')) return '#0a74ff';
  if (name.includes('youtube')) return '#FF0000';
  if (name.includes('paramount')) return '#0064ff';
  if (name.includes('hbo')) return '#8B5CF6';
  return '#7AA6C8';
}

// ═══════════════════════════════════════════════════════════════
// 📊 DATOS
// ═══════════════════════════════════════════════════════════════

function getExpiringOrders() {
  const orders = state.orders || [];
  return orders
    .filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days >= 0 && days <= 7;
    })
    .sort((a, b) => getDaysLeft(a.expires_at) - getDaysLeft(b.expires_at));
}

// ═══════════════════════════════════════════════════════════════
// 🏠 VISTA PRINCIPAL DE COMPRAS
// ═══════════════════════════════════════════════════════════════

function improvedOrdersView() {
  const isResellerUser = isReseller();
  const orders = state.orders || [];
  
  return `
    ${isResellerUser ? renderResellerPanel() : ''}
    
    <section class="orders-section">
      <div class="section-header">
        <h2>📦 Mis Compras</h2>
        <span class="section-count">${orders.length}</span>
      </div>
      
      <div id="ordersList">
        ${improvedOrderRows(orders)}
      </div>
    </section>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 PANEL DE HERRAMIENTAS DEL REVENDEDOR
// ═══════════════════════════════════════════════════════════════

function renderResellerPanel() {
  const expiringOrders = getExpiringOrders();
  const badge = expiringOrders.length > 0 ? '<span class="tool-badge">' + expiringOrders.length + '</span>' : '';
  const renewClass = expiringOrders.length > 0 ? 'tool-renew-active' : '';
  
  return `
    <div class="reseller-panel">
      <div class="reseller-panel-header">
        <span class="reseller-badge">🏷️ REVENDEDOR</span>
      </div>
      <div class="reseller-tools">
        <button onclick="openPricesModal()" class="reseller-tool-btn purple">
          <span class="tool-icon">💰</span>
          <span class="tool-text">Ver Precios</span>
        </button>
        
        <button onclick="openMyLinkModal()" class="reseller-tool-btn blue">
          <span class="tool-icon">🔗</span>
          <span class="tool-text">Mi Link</span>
        </button>
        
        <button onclick="openSalesModal()" class="reseller-tool-btn green">
          <span class="tool-icon">📊</span>
          <span class="tool-text">Ventas</span>
        </button>
        
        <button onclick="showBulkRenewal()" class="reseller-tool-btn orange ${renewClass}">
          <span class="tool-icon">🔄</span>
          <span class="tool-text">Renovar</span>
          ${badge}
        </button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🔄 MODAL DE RENOVACIÓN
// ═══════════════════════════════════════════════════════════════

function showRenewModal(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  const product = order.product_name || 'Producto';
  const price = order.amount || order.total || 0;
  const days = getDaysLeft(order.expires_at);
  const balance = state.user?.balance || 0;
  const color = getProductColor(product);
  
  openModal(`
    <div class="renew-modal">
      <div class="renew-modal-header"><h2>🔄 Renovar Cuenta</h2></div>
      <div class="renew-modal-body">
        <div class="renew-product-card">
          <div class="renew-product-icon" style="background:${color}">${product.charAt(0).toUpperCase()}</div>
          <div class="renew-product-details">
            <div class="renew-product-name">${product}</div>
            <div class="renew-product-code">${order.code || '#DS-0000'}</div>
            <div class="renew-product-expires">Vence en ${days} día${days !== 1 ? 's' : ''}</div>
          </div>
        </div>
        
        <div class="renew-info-box">
          <div class="renew-info-row"><span>Tu saldo:</span><span class="${balance < price ? 'text-danger' : 'text-success'}">${formatMoney(balance)}</span></div>
          <div class="renew-info-row"><span>Precio:</span><span>${formatMoney(price)}</span></div>
        </div>
        
        <div id="renewError" class="renew-error" style="display:none"></div>
        
        <div class="renew-modal-actions">
          <button onclick="closeModal()" class="btn-cancel">Cancelar</button>
          <button onclick="doRenew('${orderId}')" class="btn-renew-confirm">🔄 Renovar</button>
        </div>
      </div>
    </div>
  `);
}

async function doRenew(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  const price = order.amount || order.total || 0;
  const balance = state.user?.balance || 0;
  
  if (balance < price) {
    const errorEl = document.getElementById('renewError');
    if (errorEl) { errorEl.style.display = 'block'; errorEl.innerHTML = '⚠️ Saldo insuficiente. Necesitas ' + formatMoney(price) + ' pero tienes ' + formatMoney(balance); }
    return;
  }
  
  try {
    showLoading('Renovando...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast('✅ Cuenta renovada exitosamente', 'ok');
    closeModal();
    await boot();
  } catch (e) { toast('❌ Error: ' + e.message, 'bad'); }
  finally { hideLoading(); }
}

// ═══════════════════════════════════════════════════════════════
// 📋 MODAL DE RENOVACIÓN EN BULK
// ═══════════════════════════════════════════════════════════════

function showBulkRenewal() {
  const orders = getExpiringOrders();
  
  if (orders.length === 0) {
    openModal(`
      <div class="modal-empty">
        <div class="modal-empty-icon">✨</div>
        <div class="modal-empty-title">¡Todo al día!</div>
        <div class="modal-empty-text">No tienes cuentas por vencer</div>
        <button onclick="closeModal()" class="btn-primary" style="width:100%;margin-top:20px">Cerrar</button>
      </div>
    `);
    return;
  }
  
  const total = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const balance = state.user?.balance || 0;
  
  openModal(`
    <div class="modal-content">
      <div class="modal-header">
        <h2>🔄 Renovar ${orders.length} Cuenta${orders.length !== 1 ? 's' : ''}</h2>
        <button onclick="closeModal()" class="btn-close">×</button>
      </div>
      <div class="modal-body">
        <div class="bulk-summary">
          <div class="bulk-summary-item"><span>Cuentas:</span><span>${orders.length}</span></div>
          <div class="bulk-summary-item"><span>Total:</span><span class="bulk-total">${formatMoney(total)}</span></div>
          <div class="bulk-summary-item ${balance < total ? 'text-danger' : 'text-success'}"><span>Tu saldo:</span><span>${formatMoney(balance)}</span></div>
        </div>
        
        <div class="bulk-accounts-list">
          ${orders.map(o => {
            const days = getDaysLeft(o.expires_at);
            const price = o.amount || o.total || 0;
            return `<div class="bulk-account-item"><span>${o.product_name || 'Producto'}</span><span>${days}d</span><span>${formatMoney(price)}</span></div>`;
          }).join('')}
        </div>
        
        <div id="bulkError" class="renew-error" style="display:none"></div>
        
        <div class="bulk-modal-actions">
          <button onclick="closeModal()" class="btn-cancel">Cancelar</button>
          <button onclick="doBulkRenewal()" class="btn-renew-confirm">🔄 Renovar Todo</button>
        </div>
      </div>
    </div>
  `);
}

async function doBulkRenewal() {
  const orders = getExpiringOrders();
  if (orders.length === 0) return;
  
  const total = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const balance = state.user?.balance || 0;
  
  if (balance < total) {
    const errorEl = document.getElementById('bulkError');
    if (errorEl) { errorEl.style.display = 'block'; errorEl.innerHTML = '⚠️ Saldo insuficiente para todas las renovaciones'; }
    return;
  }
  
  try {
    showLoading('Renovando cuentas...');
    for (const order of orders) { await new Promise(resolve => setTimeout(resolve, 500)); }
    toast('✅ ' + orders.length + ' cuentas renovadas', 'ok');
    closeModal();
    await boot();
  } catch (e) { toast('❌ Error: ' + e.message, 'bad'); }
  finally { hideLoading(); }
}

// ═══════════════════════════════════════════════════════════════
// 📋 TABLA DE ÓRDENES MEJORADA
// ═══════════════════════════════════════════════════════════════

function improvedOrderRows(rows) {
  if (!rows || rows.length === 0) {
    return `
      <div class="orders-empty">
        <div class="orders-empty-icon">📦</div>
        <div class="orders-empty-title">Sin compras</div>
        <div class="orders-empty-text">Aún no tienes compras registradas</div>
      </div>
    `;
  }
  
  const serviceColors = {
    netflix: '#E50914', prime: '#00A8E1', max: '#0877ff', disney: '#0a74ff',
    spotify: '#1DB954', youtube: '#FF0000', other: '#7AA6C8'
  };
  
  function getServiceColor(name) {
    if (!name) return serviceColors.other;
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return serviceColors.netflix;
    if (lower.includes('prime')) return serviceColors.prime;
    if (lower.includes('max')) return serviceColors.max;
    if (lower.includes('disney')) return serviceColors.disney;
    if (lower.includes('spotify')) return serviceColors.spotify;
    if (lower.includes('youtube')) return serviceColors.youtube;
    return serviceColors.other;
  }
  
  function getServiceIcon(name) {
    if (!name) return '?';
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return 'N';
    if (lower.includes('prime')) return 'P';
    if (lower.includes('max')) return 'M';
    if (lower.includes('disney')) return 'D+';
    if (lower.includes('spotify')) return '♫';
    if (lower.includes('youtube')) return '▶';
    return 'O';
  }
  
  return `
    <div class="orders-grid">
      ${rows.map(o => {
        const days = getDaysLeft(o.expires_at);
        const isExpired = days !== null && days < 0;
        const isWarning = days !== null && days >= 0 && days <= 5;
        const color = getServiceColor(o.product_name);
        const icon = getServiceIcon(o.product_name);
        const statusClass = (o.status || '').includes('Pend') ? 'pending' : (o.status || '').includes('Fall') ? 'failed' : 'completed';
        
        return `
          <div class="order-card ${isExpired ? 'expired' : ''}">
            <div class="order-card-header">
              <div class="order-product-icon" style="background:${color}">${icon}</div>
              <div class="order-product-info">
                <div class="order-product-name">${o.product_name || 'Producto'}</div>
                <div class="order-product-code">${o.code || '#DS-0000'}</div>
              </div>
              <div class="order-status ${statusClass}">${o.status || 'Activo'}</div>
            </div>
            <div class="order-card-body">
              <div class="order-info-row"><span>💰 Precio</span><span>${formatMoney(o.amount || o.total || 0)}</span></div>
              <div class="order-info-row">
                <span>📅 Vence</span>
                <span class="${isExpired ? 'text-expired' : isWarning ? 'text-warning' : ''}">
                  ${o.expires_at || 'Sin fecha'}
                  ${days !== null ? ` (${isExpired ? `Hace ${Math.abs(days)}d` : `${days}d`})` : ''}
                </span>
              </div>
            </div>
            <div class="order-card-actions">
              <button onclick="openAccountModal('${encodeURIComponent(JSON.stringify(o))}')" class="order-btn datos">🔐 Datos</button>
              <button onclick="openReport('${o.id}')" class="order-btn reportar">⚠️ Reportar</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 💰 MODAL DE PRECIOS
// ═══════════════════════════════════════════════════════════════

function openPricesModal() {
  const products = state.products || [];
  
  openModal(`
    <div class="prices-modal">
      <div class="modal-header"><h2>💰 Lista de Precios</h2><button onclick="closeModal()" class="btn-close">×</button></div>
      <div class="prices-list">
        ${products.length > 0 ? products.map(p => {
          const color = getProductColor(p.name);
          const price = p.price || 0;
          return `<div class="price-item"><div class="price-item-left"><span class="price-dot" style="background:${color}"></span><span class="price-name">${p.name || 'Producto'}</span></div><span class="price-value">${formatMoney(price)}</span></div>`;
        }).join('') : '<div class="no-products">No hay productos disponibles</div>'}
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🔗 MODAL DE MI LINK
// ═══════════════════════════════════════════════════════════════

function openMyLinkModal() {
  const user = state.user || {};
  const baseUrl = window.location.origin;
  const affiliateLink = baseUrl + '?ref=reseller_' + (user.id || '000');
  
  openModal(`
    <div class="link-modal">
      <div class="modal-header"><h2>🔗 Mi Link de Afiliado</h2><button onclick="closeModal()" class="btn-close">×</button></div>
      <div class="link-content">
        <p class="link-description">Comparte este link para que nuevos clientes se registren bajo tu nombre.</p>
        <div class="link-box"><code>${affiliateLink}</code></div>
        <button onclick="copyText('${affiliateLink}');toast('Link copiado','ok')" class="btn-copy-link">📋 Copiar Link</button>
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 📊 MODAL DE VENTAS
// ═══════════════════════════════════════════════════════════════

function openSalesModal() {
  const orders = state.orders || [];
  const users = state.users || [];
  const user = state.user || {};
  
  const totalPurchases = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const myClients = users.filter(u => u.referrer_id === user.id).length;
  
  const now = new Date();
  const monthlyStats = [];
  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at || o.date || 0);
      return orderDate >= monthDate && orderDate <= monthEnd;
    });
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    monthlyStats.push({
      name: monthNames[monthDate.getMonth()],
      count: monthOrders.length,
      total: monthOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0)
    });
  }
  
  openModal(`
    <div class="sales-modal">
      <div class="modal-header"><h2>📊 Mis Ventas</h2><button onclick="closeModal()" class="btn-close">×</button></div>
      <div class="sales-content">
        <div class="sales-stats-grid">
          <div class="sales-stat-card"><div class="sales-stat-value">${totalPurchases}</div><div class="sales-stat-label">Compras Totales</div></div>
          <div class="sales-stat-card"><div class="sales-stat-value">${formatMoney(totalSpent)}</div><div class="sales-stat-label">Total Invertido</div></div>
          <div class="sales-stat-card"><div class="sales-stat-value">${myClients}</div><div class="sales-stat-label">Mis Clientes</div></div>
        </div>
        
        <div class="sales-monthly">
          <h3 class="sales-monthly-title">📅 Últimos 3 Meses</h3>
          ${monthlyStats.map(m => `<div class="sales-month-row"><span class="sales-month-name">${m.name}</span><span class="sales-month-count">${m.count} compras</span><span class="sales-month-total">${formatMoney(m.total)}</span></div>`).join('')}
        </div>
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🔍 FILTROS
// ═══════════════════════════════════════════════════════════════

let purchaseFilters = { status: 'all', product: 'all', search: '' };

function toggleFilters() {
  const panel = document.getElementById('filtersPanel');
  if (panel) { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; }
}

function renderFilters() {
  const products = [...new Set((state.orders || []).map(o => o.product_name).filter(Boolean))];
  return `
    <div class="filters-grid">
      <select id="filterStatus" onchange="applyOrderFilters()" class="filter-select">
        <option value="all">Todos los estados</option>
        <option value="active">Activas</option>
        <option value="expiring">Por vencer (7d)</option>
        <option value="expired">Vencidas</option>
      </select>
      <select id="filterProduct" onchange="applyOrderFilters()" class="filter-select">
        <option value="all">Todos los productos</option>
        ${products.map(p => '<option value="' + p + '">' + p + '</option>').join('')}
      </select>
      <input type="text" id="filterSearch" oninput="applyOrderFilters()" placeholder="Buscar..." class="filter-input">
    </div>
  `;
}

function applyOrderFilters() {
  const status = document.getElementById('filterStatus')?.value || 'all';
  const product = document.getElementById('filterProduct')?.value || 'all';
  const search = document.getElementById('filterSearch')?.value?.toLowerCase() || '';
  
  let filtered = [...state.orders];
  
  if (status === 'active') { filtered = filtered.filter(o => { const days = getDaysLeft(o.expires_at); return days !== null && days >= 0; }); }
  else if (status === 'expiring') { filtered = filtered.filter(o => { const days = getDaysLeft(o.expires_at); return days !== null && days >= 0 && days <= 7; }); }
  else if (status === 'expired') { filtered = filtered.filter(o => { const days = getDaysLeft(o.expires_at); return days !== null && days < 0; }); }
  
  if (product !== 'all') { filtered = filtered.filter(o => o.product_name === product); }
  if (search) { filtered = filtered.filter(o => (o.code || '' + ' ' + o.product_name || '' + ' ' + o.client_name || '').toLowerCase().includes(search)); }
  
  const listEl = document.getElementById('ordersList');
  if (listEl) { listEl.innerHTML = orderRows(filtered, false); }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 ESTILOS CSS
// ═══════════════════════════════════════════════════════════════

function injectPurchaseStyles() {
  const styles = document.createElement('style');
  styles.textContent = `
    .reseller-panel { background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(139,92,246,0.05)); border: 2px solid rgba(124,58,237,0.2); border-radius: 16px; padding: 16px; margin-bottom: 16px; }
    .reseller-panel-header { text-align: center; margin-bottom: 14px; }
    .reseller-badge { display: inline-block; padding: 6px 16px; background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; }
    .reseller-tools { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    @media (max-width: 700px) { .reseller-tools { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px) { .reseller-tools { grid-template-columns: 1fr; } }
    .reseller-tool-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 12px; border: 2px solid; border-radius: 14px; background: #fff; cursor: pointer; transition: all 0.2s; position: relative; }
    .reseller-tool-btn.purple { border-color: rgba(124,58,237,0.2); }
    .reseller-tool-btn.purple:hover { border-color: #7c3aed; background: rgba(124,58,237,0.08); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(124,58,237,0.2); }
    .reseller-tool-btn.blue { border-color: rgba(8,119,255,0.2); }
    .reseller-tool-btn.blue:hover { border-color: #0877ff; background: rgba(8,119,255,0.08); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(8,119,255,0.2); }
    .reseller-tool-btn.green { border-color: rgba(16,185,129,0.2); }
    .reseller-tool-btn.green:hover { border-color: #10b981; background: rgba(16,185,129,0.08); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(16,185,129,0.2); }
    .reseller-tool-btn.orange { border-color: rgba(245,158,11,0.2); }
    .reseller-tool-btn.orange:hover { border-color: #f59e0b; background: rgba(245,158,11,0.08); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(245,158,11,0.2); }
    .reseller-tool-btn.tool-renew-active { background: linear-gradient(135deg, #fef3c7, #fde68a); border-color: #f59e0b; }
    .reseller-tool-btn.tool-renew-active:hover { border-color: #d97706; box-shadow: 0 6px 20px rgba(245,158,11,0.3); }
    .tool-icon { font-size: 32px; }
    .tool-text { font-size: 13px; font-weight: 700; text-align: center; color: #1f2937; }
    .tool-badge { position: absolute; top: -8px; right: -8px; background: #ef4444; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 800; border: 3px solid #fff; }
    
    .orders-section { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
    .section-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #fafafa; }
    .section-header h2 { font-size: 16px; font-weight: 900; margin: 0; }
    .section-count { background: #7c3aed; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; }
    
    .orders-grid { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .order-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
    .order-card:hover { border-color: #7c3aed; box-shadow: 0 4px 12px rgba(124,58,237,0.1); }
    .order-card.expired { opacity: 0.7; border-color: rgba(124,58,237,0.2); }
    .order-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .order-product-icon { width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .order-product-info { flex: 1; min-width: 0; }
    .order-product-name { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .order-product-code { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .order-status { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.1); color: #059669; }
    .order-status.pending { background: rgba(245,158,11,0.1); color: #d97706; }
    .order-status.failed { background: rgba(239,68,68,0.1); color: #dc2626; }
    .order-card-body { padding: 12px 16px; }
    .order-info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #6b7280; }
    .order-info-row span:last-child { font-weight: 600; color: #374151; }
    .text-warning { color: #d97706 !important; }
    .text-expired { color: #dc2626 !important; }
    .order-card-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #f3f4f6; background: #fafafa; }
    .order-btn { flex: 1; padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: center; }
    .order-btn.datos { background: #7c3aed; color: #fff; border: none; }
    .order-btn.datos:hover { background: #6d28d9; }
    .order-btn.reportar { background: #fff; color: #dc2626; border: 1px solid #fecaca; }
    .order-btn.reportar:hover { background: #fef2f2; }
    
    .orders-empty { text-align: center; padding: 48px 20px; }
    .orders-empty-icon { font-size: 56px; margin-bottom: 12px; opacity: 0.5; }
    .orders-empty-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .orders-empty-text { font-size: 13px; color: #9ca3af; }
    
    .modal-content { min-width: 320px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-header h2 { font-size: 18px; font-weight: 800; margin: 0; }
    .btn-close { width: 36px; height: 36px; border: 2px solid #e5e7eb; border-radius: 50%; background: #fff; font-size: 20px; cursor: pointer; display: grid; place-items: center; transition: all 0.2s; }
    .btn-close:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; transform: rotate(90deg); }
    .modal-body { padding: 20px; }
    .modal-empty { text-align: center; padding: 40px 20px; }
    .modal-empty-icon { font-size: 64px; margin-bottom: 16px; }
    .modal-empty-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .modal-empty-text { color: #6b7280; font-size: 14px; }
    .btn-primary { padding: 14px 24px; background: linear-gradient(135deg, #0877ff, #0057dc); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
    
    .bulk-summary { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .bulk-summary-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .bulk-total { font-weight: 800; color: #0877ff; font-size: 18px; }
    .bulk-accounts-list { max-height: 200px; overflow-y: auto; margin-bottom: 16px; }
    .bulk-account-item { display: flex; justify-content: space-between; padding: 10px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 6px; font-size: 13px; }
    .bulk-modal-actions { display: flex; gap: 10px; }
    .btn-renew { width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
    .renew-error { display: none; padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #dc2626; font-size: 13px; margin-bottom: 12px; }
    .text-danger { color: #dc2626; }
    .text-success { color: #059669; }
    
    .renew-product-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: var(--soft); border-radius: 12px; margin-bottom: 16px; }
    .renew-product-icon { width: 56px; height: 56px; border-radius: 14px; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 22px; }
    .renew-product-details { flex: 1; }
    .renew-product-name { font-size: 18px; font-weight: 800; }
    .renew-product-code { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .renew-product-expires { font-size: 12px; color: var(--warn); margin-top: 4px; }
    .renew-info-box { background: var(--soft); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .renew-info-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; }
    .text-danger { color: #ef4444; }
    .text-success { color: var(--ok); }
    .renew-error { padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #ef4444; font-size: 13px; margin-bottom: 12px; }
    .renew-modal-actions { display: flex; gap: 10px; }
    .btn-cancel { flex: 1; padding: 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-renew-confirm { flex: 1; padding: 14px; border: 0; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
    
    .bulk-summary { background: var(--soft); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .bulk-summary-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .bulk-total { font-weight: 800; color: var(--blue); font-size: 16px; }
    .bulk-accounts-list { max-height: 200px; overflow-y: auto; margin-bottom: 16px; }
    .bulk-account-item { display: flex; justify-content: space-between; padding: 10px 12px; background: var(--soft); border-radius: 6px; margin-bottom: 4px; font-size: 13px; }
    .bulk-modal-actions { display: flex; gap: 10px; }
    
    .prices-list { padding: 12px; }
    .price-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--soft); border-radius: 8px; margin-bottom: 6px; }
    .price-item-left { display: flex; align-items: center; gap: 10px; }
    .price-dot { width: 10px; height: 10px; border-radius: 50%; }
    .price-name { font-weight: 600; }
    .price-value { font-weight: 800; color: var(--blue); }
    .no-products { text-align: center; padding: 40px; color: var(--muted); }
    
    .link-content { padding: 20px; }
    .link-description { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
    .link-box { background: var(--soft); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .link-box code { font-size: 12px; word-break: break-all; color: var(--blue); }
    .btn-copy-link { width: 100%; padding: 14px; border: 0; border-radius: 10px; background: linear-gradient(135deg, #0877ff, #0057dc); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
    
    .sales-content { padding: 20px; }
    .sales-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .sales-stat-card { background: var(--soft); border-radius: 10px; padding: 16px; text-align: center; }
    .sales-stat-value { font-size: 22px; font-weight: 800; color: var(--purple); }
    .sales-stat-label { font-size: 11px; color: var(--muted); margin-top: 4px; }
    .sales-monthly-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .sales-month-row { display: flex; justify-content: space-between; padding: 10px 12px; background: var(--soft); border-radius: 8px; margin-bottom: 6px; font-size: 13px; }
    .sales-month-name { font-weight: 700; width: 50px; }
    .sales-month-count { color: var(--muted); flex: 1; text-align: center; }
    .sales-month-total { font-weight: 700; color: var(--blue); }
  `;
  document.head.appendChild(styles);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPurchaseStyles);
} else {
  injectPurchaseStyles();
}

console.log('✅ Panel de Compras cargado');

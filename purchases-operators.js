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
  const expiringOrders = getExpiringOrders();
  const isResellerUser = isReseller();
  
  return `
    ${renderExpiringSection(expiringOrders)}
    ${isResellerUser ? renderResellerTools(expiringOrders) : ''}
    
    <section class="card">
      <div class="card-header-custom">
        <h2>📦 Mis Compras</h2>
        <button onclick="toggleFilters()" class="btn-filters">🔍 Filtros</button>
      </div>
      
      <div id="filtersPanel" class="filters-panel" style="display:none">
        ${renderFilters()}
      </div>
      
      <div id="ordersList">
        ${orderRows(state.orders || [], false)}
      </div>
    </section>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ⏰ SECCIÓN: CUENTAS POR VENCER
// ═══════════════════════════════════════════════════════════════

function renderExpiringSection(orders) {
  if (orders.length === 0) {
    return `
      <div class="expiring-empty">
        <div class="expiring-empty-icon">✨</div>
        <div class="expiring-empty-title">¡Todo al día!</div>
        <div class="expiring-empty-text">No tienes cuentas por vencer en los próximos 7 días</div>
      </div>
    `;
  }
  
  const totalRenewal = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  
  return `
    <div class="expiring-section">
      <div class="expiring-header">
        <div class="expiring-title">
          <span class="expiring-icon">⏰</span>
          <span>Cuentas por Vencer</span>
          <span class="expiring-count">${orders.length}</span>
        </div>
        <button onclick="showBulkRenewal()" class="btn-renew-all">🔄 Renovar Todas</button>
      </div>
      
      <div class="expiring-list">
        ${orders.map(o => {
          const days = getDaysLeft(o.expires_at);
          const urgency = days <= 1 ? 'critical' : days <= 3 ? 'high' : 'normal';
          const color = getProductColor(o.product_name);
          return `
            <div class="expiring-item urgency-${urgency}">
              <div class="expiring-item-left">
                <div class="expiring-item-icon" style="background:${color}">${o.product_name ? o.product_name.charAt(0).toUpperCase() : '?'}</div>
                <div class="expiring-item-info">
                  <div class="expiring-item-name">${o.product_name || 'Producto'}</div>
                  <div class="expiring-item-meta"><span>${o.code || '#DS-0000'}</span><span>•</span><span>Vence: ${o.expires_at}</span></div>
                </div>
              </div>
              <div class="expiring-item-right">
                <span class="expiring-days urgency-${urgency}">${days}d</span>
                <button onclick="showRenewModal('${o.id}')" class="btn-renew-item">🔄 Renovar</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="expiring-total">
        <span>Total renovación:</span>
        <span class="expiring-total-price">${formatMoney(totalRenewal)}</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 PANEL DE HERRAMIENTAS DEL REVENDEDOR
// ═══════════════════════════════════════════════════════════════

function renderResellerTools(expiringOrders) {
  return `
    <div class="reseller-tools-section">
      <div class="reseller-tools-header">
        <span class="reseller-badge">🏷️ REVENDEDOR</span>
      </div>
      
      <div class="reseller-tools-grid">
        <button onclick="openPricesModal()" class="reseller-tool-btn">
          <span class="tool-icon">💰</span>
          <span class="tool-label">Ver Precios</span>
        </button>
        
        <button onclick="openMyLinkModal()" class="reseller-tool-btn">
          <span class="tool-icon">🔗</span>
          <span class="tool-label">Mi Link</span>
        </button>
        
        <button onclick="setView('users')" class="reseller-tool-btn">
          <span class="tool-icon">👥</span>
          <span class="tool-label">Mis Clientes</span>
        </button>
        
        <button onclick="openSalesModal()" class="reseller-tool-btn">
          <span class="tool-icon">📊</span>
          <span class="tool-label">Ventas</span>
        </button>
        
        ${expiringOrders.length > 0 ? `
          <button onclick="showBulkRenewal()" class="reseller-tool-btn warning">
            <span class="tool-icon">🔄</span>
            <span class="tool-label">Renovar</span>
            <span class="tool-badge">${expiringOrders.length}</span>
          </button>
        ` : ''}
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
  if (orders.length === 0) { toast('No hay cuentas por vencer', 'bad'); return; }
  
  const total = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const balance = state.user?.balance || 0;
  
  openModal(`
    <div class="bulk-renewal-modal">
      <div class="bulk-modal-header"><h2>🔄 Renovar ${orders.length} Cuenta${orders.length !== 1 ? 's' : ''}</h2></div>
      <div class="bulk-modal-body">
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
    .expiring-section { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .expiring-empty { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 16px; }
    .expiring-empty-icon { font-size: 48px; margin-bottom: 12px; }
    .expiring-empty-title { font-size: 16px; font-weight: 700; color: var(--ok); }
    .expiring-empty-text { font-size: 13px; color: var(--muted); margin-top: 4px; }
    .expiring-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--soft); border-bottom: 1px solid var(--line); }
    .expiring-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
    .expiring-icon { font-size: 18px; }
    .expiring-count { background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
    .btn-renew-all { padding: 8px 16px; border: 0; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .btn-renew-all:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .expiring-list { padding: 8px; }
    .expiring-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; margin-bottom: 4px; border-left: 4px solid var(--blue); background: var(--soft); }
    .expiring-item.urgency-high { border-left-color: #f59e0b; }
    .expiring-item.urgency-critical { border-left-color: #ef4444; background: rgba(239,68,68,0.05); }
    .expiring-item-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .expiring-item-icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .expiring-item-info { min-width: 0; }
    .expiring-item-name { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .expiring-item-meta { display: flex; gap: 6px; font-size: 11px; color: var(--muted); margin-top: 2px; }
    .expiring-item-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .expiring-days { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .expiring-days.urgency-normal { background: rgba(8,119,255,0.1); color: var(--blue); }
    .expiring-days.urgency-high { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .expiring-days.urgency-critical { background: rgba(239,68,68,0.1); color: #ef4444; }
    .btn-renew-item { padding: 6px 12px; border: 0; border-radius: 6px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
    .expiring-total { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--soft); border-top: 1px solid var(--line); font-weight: 700; font-size: 14px; }
    .expiring-total-price { color: var(--blue); }
    
    .reseller-tools-section { background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(8,119,255,0.05)); border: 1px solid rgba(124,58,237,0.15); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .reseller-tools-header { text-align: center; margin-bottom: 14px; }
    .reseller-badge { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 800; }
    .reseller-tools-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    @media (max-width: 600px) { .reseller-tools-grid { grid-template-columns: repeat(3, 1fr); } }
    .reseller-tool-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); cursor: pointer; transition: all 0.15s; position: relative; }
    .reseller-tool-btn:hover { border-color: var(--purple); background: rgba(124,58,237,0.05); transform: translateY(-2px); }
    .reseller-tool-btn.warning { background: linear-gradient(135deg, #f59e0b, #d97706); border: 0; color: #fff; }
    .reseller-tool-btn.warning:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .tool-icon { font-size: 24px; }
    .tool-label { font-size: 11px; font-weight: 600; text-align: center; }
    .tool-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 10px; font-weight: 800; }
    
    .card-header-custom { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--line); }
    .card-header-custom h2 { font-size: 16px; font-weight: 900; margin: 0; }
    .btn-filters { padding: 8px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); font-size: 12px; font-weight: 700; cursor: pointer; }
    .filters-panel { padding: 12px 20px; background: var(--soft); border-bottom: 1px solid var(--line); }
    .filters-grid { display: flex; gap: 10px; flex-wrap: wrap; }
    .filter-select, .filter-input { flex: 1; min-width: 150px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); font-size: 13px; }
    
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--line); }
    .modal-header h2 { font-size: 16px; font-weight: 800; margin: 0; }
    .btn-close { width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 50%; background: var(--panel); font-size: 18px; cursor: pointer; }
    
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

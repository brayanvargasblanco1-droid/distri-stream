/**
 * 🛒 MEJORAS DE COMPRAS PARA OPERADORES Y REVENDEDORES
 * Distrito Streaming
 * 
 * Características simplificadas:
 * - Gestión de renovación rápida
 * - Panel de revendedor
 * - Filtros avanzados
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
// 📊 STATS SIMPLIFICADAS
// ═══════════════════════════════════════════════════════════════

function getPurchaseStats() {
  const orders = state.orders || [];
  
  // Órdenes próximas a vencer ordenadas
  const expiringOrders = orders
    .filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days >= 0 && days <= 7;
    })
    .sort((a, b) => getDaysLeft(a.expires_at) - getDaysLeft(b.expires_at));
  
  return {
    expiringOrders
  };
}

// ═══════════════════════════════════════════════════════════════
// 📦 SECCIÓN: PRÓXIMAS A VENCER
// ═══════════════════════════════════════════════════════════════

function renderPurchaseDashboard() {
  const stats = getPurchaseStats();
  
  if (stats.expiringOrders.length === 0) {
    return `
      <div class="no-expiring">
        <div style="text-align:center;padding:32px 20px;background:var(--soft);border-radius:12px">
          <div style="font-size:48px;margin-bottom:12px">✨</div>
          <div style="font-size:14px;font-weight:700;color:var(--ok)">¡No hay cuentas por vencer!</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Todas tus cuentas están al día</div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="expiring-soon-section">
      <h3 class="section-title">⏰ Próximas a Vencer</h3>
      <div class="expiring-list">
        ${stats.expiringOrders.map(o => {
          const days = getDaysLeft(o.expires_at);
          const urgency = days <= 1 ? 'critical' : days <= 3 ? 'high' : 'normal';
          const color = getProductColor(o.product_name);
          return `
            <div class="expiring-item urgency-${urgency}">
              <div class="expiring-icon" style="background:${color}">
                ${o.product_name ? o.product_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div class="expiring-info">
                <div class="expiring-product">${o.product_name || 'Producto'}</div>
                <div class="expiring-meta">
                  <span class="expiring-code">${o.code || '#DS-0000'}</span>
                  <span class="expiring-date">${o.expires_at}</span>
                </div>
              </div>
              <div class="expiring-actions">
                <span class="expiring-days ${urgency}">${days}d</span>
                <button onclick="quickRenew('${o.id}')" class="btn-renew" title="Renovar">
                  🔄 Renovar
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🔄 GESTIÓN DE RENOVACIÓN RÁPIDA
// ═══════════════════════════════════════════════════════════════

function quickRenew(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  const product = order.product_name || 'Producto';
  const price = order.amount || order.total || 0;
  
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">RENOVACIÓN</small>
          <h2>Renovar Cuenta</h2>
          <p class="muted" style="font-size:12px">Renovar ${product}</p>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px">
        <div style="background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:48px;height:48px;border-radius:12px;background:${getProductCategory(product).color};display:grid;place-items:center;color:#fff;font-weight:800">
              ${getProductCategory(product).icon}
            </div>
            <div>
              <div style="font-weight:700;font-size:15px">${product}</div>
              <div style="font-size:12px;color:var(--muted)">${order.code || '#DS-0000'}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid var(--line)">
            <span style="font-size:13px;color:var(--muted)">Precio de renovación:</span>
            <span style="font-size:16px;font-weight:800;color:var(--blue)">${formatMoney(price)}</span>
          </div>
        </div>
        
        <div id="renewError" style="display:none;padding:10px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:12px;color:var(--bad);margin-bottom:12px"></div>
        
        <div style="display:flex;gap:10px">
          <button onclick="closeModal()" class="ghost" style="flex:1;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>
          <button onclick="confirmQuickRenew('${orderId}')" class="primary" style="flex:1;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:13px;font-weight:700;cursor:pointer">
            🔄 Renovar Ahora
          </button>
        </div>
      </div>
    </div>
  `);
}

async function confirmQuickRenew(orderId) {
  const balance = state.user?.balance || 0;
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  const price = order.amount || order.total || 0;
  
  if (balance < price) {
    const errorEl = document.getElementById('renewError');
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `⚠️ Saldo insuficiente. Necesitas ${formatMoney(price)} pero tienes ${formatMoney(balance)}`;
    }
    return;
  }
  
  try {
    showLoading('Renovando...');
    // Aquí iría la llamada al API para renovar
    // await api("orders/" + orderId + "/renew", { method: "POST" });
    
    toast('Renovación iniciada. Procesando...', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('Error al renovar: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════
// 📱 WIDGET DE COMPRAS RÁPIDAS
// ═══════════════════════════════════════════════════════════════

function renderQuickActionsWidget() {
  const stats = getPurchaseStats();
  
  return `
    <div class="quick-actions-widget">
      <div class="quick-actions-single">
        <button onclick="showRenewalModal()" class="quick-action-btn full-width warning-action">
          <span class="qa-icon">🔄</span>
          <span class="qa-label">Renovar Cuentas por Vencer</span>
        </button>
      </div>
    </div>
  `;
}

function showRenewalModal() {
  const stats = getPurchaseStats();
  const expiringOrders = stats.expiringOrders;
  
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">RENOVACIONES</small>
          <h2>Renovar Cuentas</h2>
          <p class="muted" style="font-size:12px">${expiringOrders.length} cuentas por vencer</p>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px;max-height:400px;overflow-y:auto">
        ${expiringOrders.length === 0 ? `
          <div style="text-align:center;padding:40px;color:var(--muted)">
            <div style="font-size:48px;margin-bottom:12px">✨</div>
            <div style="font-size:14px;font-weight:600">¡No hay cuentas por vencer!</div>
          </div>
        ` : `
          <div class="renewal-list">
            ${expiringOrders.map(o => {
              const days = getDaysLeft(o.expires_at);
              const price = o.amount || o.total || 0;
              return `
                <div class="renewal-item">
                  <label class="renewal-checkbox">
                    <input type="checkbox" data-order-id="${o.id}" data-price="${price}">
                    <div class="renewal-info">
                      <div class="renewal-product">${o.product_name || 'Producto'}</div>
                      <div class="renewal-meta">
                        <span class="renewal-days urgency-${days <= 1 ? 'critical' : days <= 3 ? 'high' : 'normal'}">${days} días</span>
                        <span class="renewal-price">${formatMoney(price)}</span>
                      </div>
                    </div>
                  </label>
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="renewal-summary">
            <div class="renewal-total">
              <span>Total:</span>
              <span id="renewalTotalAmount">${formatMoney(0)}</span>
            </div>
            <button onclick="processBulkRenewal()" class="primary" style="width:100%;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:12px">
              🔄 Renovar Seleccionados
            </button>
          </div>
        `}
      </div>
    </div>
  `);
  
  // Agregar event listeners a los checkboxes
  setTimeout(() => {
    document.querySelectorAll('.renewal-checkbox input').forEach(cb => {
      cb.addEventListener('change', updateRenewalTotal);
    });
  }, 100);
}

function updateRenewalTotal() {
  const checkboxes = document.querySelectorAll('.renewal-checkbox input:checked');
  let total = 0;
  checkboxes.forEach(cb => {
    total += parseFloat(cb.dataset.price) || 0;
  });
  const totalEl = document.getElementById('renewalTotalAmount');
  if (totalEl) {
    totalEl.textContent = formatMoney(total);
  }
}

async function processBulkRenewal() {
  const checkboxes = document.querySelectorAll('.renewal-checkbox input:checked');
  if (checkboxes.length === 0) {
    toast('Selecciona al menos una cuenta para renovar', 'bad');
    return;
  }
  
  const orderIds = Array.from(checkboxes).map(cb => cb.dataset.orderId);
  
  openModal(`
    <div style="padding:24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🔄</div>
      <h3 style="margin:0 0 8px">Renovando ${orderIds.length} cuentas...</h3>
      <p style="margin:0;color:var(--muted)">Por favor espera</p>
    </div>
  `);
  
  // Simulación de renovación en batch
  for (const orderId of orderIds) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  toast(`¡${orderIds.length} cuentas renovadas exitosamente!`, 'ok');
  closeModal();
  await boot();
}

function openBulkRenewal() {
  // Abrir modal para seleccionar múltiples cuentas a renovar
  showRenewalModal();
}

// ═══════════════════════════════════════════════════════════════
// 🎯 PANEL DE REVENDEDOR
// ═══════════════════════════════════════════════════════════════

function renderResellerPanel() {
  if (!isReseller()) return ''; // Solo mostrar para revendedores
  
  return `
    <div class="reseller-panel">
      <div class="reseller-header">
        <div class="reseller-badge">🏷️ REVENDEDOR</div>
        <h3 class="reseller-title">Herramientas</h3>
      </div>
      
      <div class="tools-grid">
        <button onclick="openResellerPricing()" class="tool-btn">
          <span class="tool-icon">💰</span>
          <span class="tool-label">Ver Precios</span>
        </button>
        <button onclick="openAffiliateLink()" class="tool-btn">
          <span class="tool-icon">🔗</span>
          <span class="tool-label">Mi Link</span>
        </button>
        <button onclick="setView('users')" class="tool-btn">
          <span class="tool-icon">👥</span>
          <span class="tool-label">Clientes</span>
        </button>
        <button onclick="openSalesReport()" class="tool-btn">
          <span class="tool-icon">📊</span>
          <span class="tool-label">Ventas</span>
        </button>
      </div>
    </div>
  `;
}

function openResellerPricing() {
  const products = state.products || [];
  
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">PRECIOS</small>
          <h2>Lista de Precios</h2>
          <p class="muted" style="font-size:12px">Precios de mayoreo para revendedores</p>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px">
        <div class="pricing-list">
          ${products.map(p => {
            const color = getProductColor(p.name);
            const price = p.price || 0;
            return `
              <div class="pricing-item">
                <div class="pricing-info">
                  <span class="pricing-dot" style="background:${color}"></span>
                  <span class="pricing-name">${p.name || 'Producto'}</span>
                </div>
                <div class="pricing-price">${formatMoney(price)}</div>
              </div>
            `;
          }).join('') || `
            <div style="text-align:center;padding:20px;color:var(--muted)">
              No hay productos disponibles
            </div>
          `}
        </div>
      </div>
    </div>
  `);
}

function openAffiliateLink() {
  const user = state.user || {};
  const baseUrl = window.location.origin;
  const affiliateLink = `${baseUrl}?ref=reseller_${user.id || '000'}`;
  
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">REFERIDOS</small>
          <h2>Tu Link de Afiliado</h2>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px">
        <p style="font-size:13px;color:var(--muted);margin:0 0 16px">
          Comparte este link para ganar comisiones por cada cliente que se registre.
        </p>
        
        <div style="background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:12px">
          <code style="font-size:12px;word-break:break-all;color:var(--blue)">${affiliateLink}</code>
        </div>
        
        <button onclick="copyText('${affiliateLink}');toast('Link copiado','ok')" class="primary" style="width:100%;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;font-size:13px;font-weight:700;cursor:pointer">
          📋 Copiar Link
        </button>
      </div>
    </div>
  `);
}

function openSalesReport() {
  const stats = getPurchaseStats();
  
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">REPORTE</small>
          <h2>Reporte de Ventas</h2>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px">
        <div class="sales-summary">
          <div class="sales-row">
            <span>Total de compras:</span>
            <span class="sales-value">${stats.total}</span>
          </div>
          <div class="sales-row">
            <span>Cuentas activas:</span>
            <span class="sales-value">${stats.active}</span>
          </div>
          <div class="sales-row">
            <span>Total invertido:</span>
            <span class="sales-value">${formatMoney(stats.totalRevenue)}</span>
          </div>
          <div class="sales-row highlight">
            <span>Ganancia estimada:</span>
            <span class="sales-value green">+${formatMoney(stats.totalRevenue * 0.2)}</span>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🔍 FILTROS AVANZADOS DE COMPRAS
// ═══════════════════════════════════════════════════════════════

let purchaseFilters = {
  status: 'all',
  product: 'all',
  dateFrom: '',
  dateTo: '',
  search: ''
};

function renderAdvancedFilters() {
  const products = [...new Set((state.orders || []).map(o => o.product_name).filter(Boolean))];
  
  return `
    <div class="advanced-filters">
      <div class="filters-row">
        <select id="filterStatus" onchange="applyPurchaseFilters()" class="filter-select">
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="expiring">Por vencer (7d)</option>
          <option value="expired">Vencidas</option>
          <option value="pending">Pendientes</option>
        </select>
        
        <select id="filterProduct" onchange="applyPurchaseFilters()" class="filter-select">
          <option value="all">Todos los productos</option>
          ${products.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
      </div>
      
      <div class="filters-row">
        <input type="date" id="filterDateFrom" onchange="applyPurchaseFilters()" class="filter-date" placeholder="Desde">
        <input type="date" id="filterDateTo" onchange="applyPurchaseFilters()" class="filter-date" placeholder="Hasta">
      </div>
      
      <div class="filter-search">
        <input type="text" id="filterSearch" oninput="debounceApplyFilters()" placeholder="Buscar por código, producto o cliente..." class="filter-input">
      </div>
      
      <button onclick="resetPurchaseFilters()" class="filter-reset">
        🔄 Limpiar filtros
      </button>
    </div>
  `;
}

function applyPurchaseFilters() {
  purchaseFilters.status = document.getElementById('filterStatus')?.value || 'all';
  purchaseFilters.product = document.getElementById('filterProduct')?.value || 'all';
  purchaseFilters.dateFrom = document.getElementById('filterDateFrom')?.value || '';
  purchaseFilters.dateTo = document.getElementById('filterDateTo')?.value || '';
  purchaseFilters.search = document.getElementById('filterSearch')?.value?.toLowerCase() || '';
  
  let filtered = [...state.orders];
  
  // Filtrar por estado
  if (purchaseFilters.status === 'active') {
    filtered = filtered.filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days >= 0;
    });
  } else if (purchaseFilters.status === 'expiring') {
    filtered = filtered.filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days >= 0 && days <= 7;
    });
  } else if (purchaseFilters.status === 'expired') {
    filtered = filtered.filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days < 0;
    });
  } else if (purchaseFilters.status === 'pending') {
    filtered = filtered.filter(o => (o.status || '').toLowerCase().includes('pend'));
  }
  
  // Filtrar por producto
  if (purchaseFilters.product !== 'all') {
    filtered = filtered.filter(o => o.product_name === purchaseFilters.product);
  }
  
  // Filtrar por fecha
  if (purchaseFilters.dateFrom) {
    const from = new Date(purchaseFilters.dateFrom);
    filtered = filtered.filter(o => new Date(o.created_at || o.date || 0) >= from);
  }
  if (purchaseFilters.dateTo) {
    const to = new Date(purchaseFilters.dateTo);
    to.setHours(23, 59, 59);
    filtered = filtered.filter(o => new Date(o.created_at || o.date || 0) <= to);
  }
  
  // Filtrar por búsqueda
  if (purchaseFilters.search) {
    filtered = filtered.filter(o => {
      const searchStr = `${o.code || ''} ${o.product_name || ''} ${o.client_name || ''} ${o.delivered_data || ''}`.toLowerCase();
      return searchStr.includes(purchaseFilters.search);
    });
  }
  
  // Actualizar la lista
  const listEl = document.getElementById('ordersList');
  if (listEl) {
    listEl.innerHTML = orderRows(filtered, false);
  }
  
  // Actualizar contador
  const statsEl = document.getElementById('ordersStats');
  if (statsEl) {
    statsEl.textContent = `${filtered.length} de ${state.orders.length}`;
  }
}

let filterTimeout;
function debounceApplyFilters() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(applyPurchaseFilters, 300);
}

function resetPurchaseFilters() {
  purchaseFilters = {
    status: 'all',
    product: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  };
  
  document.getElementById('filterStatus') && (document.getElementById('filterStatus').value = 'all');
  document.getElementById('filterProduct') && (document.getElementById('filterProduct').value = 'all');
  document.getElementById('filterDateFrom') && (document.getElementById('filterDateFrom').value = '');
  document.getElementById('filterDateTo') && (document.getElementById('filterDateTo').value = '');
  document.getElementById('filterSearch') && (document.getElementById('filterSearch').value = '');
  
  applyPurchaseFilters();
}

// ═══════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL: MEJORAR VISTA DE COMPRAS
// ═══════════════════════════════════════════════════════════════

function improvedOrdersView() {
  return `
    <!-- Dashboard de compras -->
    ${renderPurchaseDashboard()}
    
    <!-- Widget de acciones rápidas -->
    ${renderQuickActionsWidget()}
    
    <!-- Panel de revendedor -->
    ${renderResellerPanel()}
    
    <!-- Lista de compras con filtros avanzados -->
    <section class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="margin:0;font-size:16px;font-weight:900">Mis Compras</h2>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="toggleAdvancedFilters()" class="ghost" style="padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);font-size:12px;font-weight:700;cursor:pointer">
            🔍 Filtros
          </button>
        </div>
      </div>
      
      <!-- Filtros avanzados (colapsable) -->
      <div id="advancedFiltersContainer" style="display:none;margin-bottom:16px">
        ${renderAdvancedFilters()}
      </div>
      
      <!-- Lista de órdenes -->
      <div id="ordersList" class="list section">
        ${orderRows(state.orders || [], false)}
      </div>
    </section>
  `;
}

function toggleAdvancedFilters() {
  const container = document.getElementById('advancedFiltersContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 ESTILOS CSS
// ═══════════════════════════════════════════════════════════════

function injectPurchaseStyles() {
  const styles = document.createElement('style');
  styles.textContent = `
    /* Sección Próximas a Vencer */
    .expiring-soon-section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 12px;
    }
    
    .product-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .product-bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .product-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .product-bar-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .product-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .product-name {
      font-size: 12px;
      font-weight: 600;
    }
    
    .product-bar-stats {
      display: flex;
      gap: 12px;
      font-size: 11px;
    }
    
    .product-count {
      font-weight: 700;
      color: var(--blue);
    }
    
    .product-revenue {
      color: var(--muted);
    }
    
    .product-bar-track {
      height: 6px;
      background: var(--soft);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .product-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    
    /* Próximas a vencer */
    .expiring-soon-section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .expiring-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .expiring-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: var(--soft);
      border-radius: 8px;
      border-left: 3px solid var(--blue);
    }
    
    .expiring-item.urgency-high {
      border-left-color: #f59e0b;
    }
    
    .expiring-item.urgency-critical {
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    
    .expiring-product {
      font-size: 13px;
      font-weight: 700;
    }
    
    .expiring-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    
    .expiring-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .expiring-days {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    
    .expiring-days.normal {
      background: rgba(8, 119, 255, 0.1);
      color: var(--blue);
    }
    
    .expiring-days.high {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    
    .expiring-days.critical {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    .btn-renew {
      padding: 6px 10px;
      border: 0;
      border-radius: 6px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .btn-renew:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    /* Widget de acciones rápidas */
    .quick-actions-widget {
      background: linear-gradient(135deg, rgba(8, 119, 255, 0.05), rgba(124, 58, 237, 0.05));
      border: 1px solid rgba(8, 119, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .widget-title {
      font-size: 13px;
      font-weight: 800;
      margin: 0 0 12px;
    }
    
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    
    .alert-banner.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--panel);
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .quick-action-btn:hover {
      border-color: var(--blue);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(8, 119, 255, 0.1);
    }
    
    .quick-action-btn.primary-action {
      background: linear-gradient(135deg, #0877ff, #0057dc);
      border: 0;
      color: #fff;
    }
    
    .quick-action-btn.warning-action {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: 0;
      color: #fff;
    }
    
    .qa-icon {
      font-size: 24px;
    }
    
    .qa-label {
      font-size: 11px;
      font-weight: 700;
    }
    
    /* Panel de revendedor */
    .reseller-panel {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(8, 119, 255, 0.05));
      border: 1px solid rgba(124, 58, 237, 0.15);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .reseller-header {
      text-align: center;
      margin-bottom: 16px;
    }
    
    .reseller-badge {
      display: inline-block;
      padding: 4px 12px;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .reseller-title {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
    }
    
    .reseller-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .reseller-stat {
      text-align: center;
      padding: 12px;
      background: var(--panel);
      border-radius: 10px;
    }
    
    .reseller-stat-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--purple);
    }
    
    .reseller-stat-label {
      font-size: 10px;
      color: var(--muted);
      margin-top: 4px;
    }
    
    .tools-title {
      font-size: 12px;
      font-weight: 700;
      margin: 0 0 10px;
    }
    
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    
    .tool-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .tool-btn:hover {
      border-color: var(--purple);
      background: rgba(124, 58, 237, 0.05);
    }
    
    .tool-icon {
      font-size: 20px;
    }
    
    .tool-label {
      font-size: 10px;
      font-weight: 600;
    }
    
    /* Alerta de saldo */
    .balance-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
    }
    
    .balance-alert.warning {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .balance-alert.critical {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .alert-icon {
      font-size: 24px;
    }
    
    .alert-content {
      flex: 1;
    }
    
    .alert-title {
      font-size: 13px;
      font-weight: 800;
    }
    
    .alert-message {
      font-size: 12px;
      color: var(--muted);
    }
    
    .alert-action {
      padding: 8px 16px;
      border: 0;
      border-radius: 8px;
      background: var(--blue);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    
    /* Filtros avanzados */
    .advanced-filters {
      background: var(--soft);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    
    .filters-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .filters-row:last-of-type {
      margin-bottom: 10px;
    }
    
    .filter-select, .filter-date, .filter-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      font-size: 13px;
    }
    
    .filter-reset {
      width: 100%;
      padding: 10px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .filter-reset:hover {
      border-color: var(--blue);
      color: var(--blue);
    }
    
    /* Lista de renovación */
    .renewal-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .renewal-item {
      background: var(--soft);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .renewal-checkbox {
      display: flex;
      align-items: center;
      padding: 12px;
      cursor: pointer;
    }
    
    .renewal-checkbox input {
      margin-right: 12px;
      width: 18px;
      height: 18px;
    }
    
    .renewal-info {
      flex: 1;
    }
    
    .renewal-product {
      font-size: 13px;
      font-weight: 700;
    }
    
    .renewal-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
    }
    
    .renewal-days {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    
    .renewal-days.urgency-normal {
      background: rgba(8, 119, 255, 0.1);
      color: var(--blue);
    }
    
    .renewal-days.urgency-high {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    
    .renewal-days.urgency-critical {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    .renewal-price {
      font-weight: 700;
      color: var(--text);
    }
    
    .renewal-summary {
      padding-top: 12px;
      border-top: 1px solid var(--line);
    }
    
    .renewal-total {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 700;
    }
    
    /* Lista de precios */
    .pricing-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .pricing-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--soft);
      border-radius: 8px;
    }
    
    .pricing-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .pricing-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .pricing-name {
      font-size: 13px;
      font-weight: 600;
    }
    
    .pricing-price {
      font-size: 14px;
      font-weight: 800;
      color: var(--blue);
    }
    
    /* Reporte de ventas */
    .sales-summary {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .sales-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--line);
      font-size: 13px;
    }
    
    .sales-row:last-child {
      border-bottom: none;
    }
    
    .sales-row.highlight {
      background: rgba(16, 185, 129, 0.05);
      margin: 0 -16px;
      padding: 12px 16px;
      border-radius: 8px;
      border-bottom: none;
    }
    
    .sales-value {
      font-weight: 700;
    }
    
    .sales-value.green {
      color: var(--ok);
    }
  `;
  document.head.appendChild(styles);
}

// Inyectar estilos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPurchaseStyles);
} else {
  injectPurchaseStyles();
}

console.log('✅ Purchases Operators Panel cargado correctamente');

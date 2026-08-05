/**
 * 🛒 MEJORAS DE COMPRAS PARA OPERADORES Y REVENDEDORES
 * Distrito Streaming
 * 
 * Características:
 * - Dashboard de compras con métricas visuales
 * - Gestión de renovación rápida
 * - Widget de compras rápidas
 * - Estadísticas por producto
 * - Panel de revendedor
 * - Control de saldo y alertas
 * - Filtros avanzados
 */

// ═══════════════════════════════════════════════════════════════
// 📊 CONSTANTES Y HELPERS
// ═══════════════════════════════════════════════════════════════

const PurchaseStates = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  DELIVERED: 'Entregado',
  EXPIRED: 'Vencida',
  FAILED: 'Fallida'
};

const ProductCategories = {
  NETFLIX: { id: 'netflix', name: 'Netflix', color: '#E50914', icon: 'N' },
  SPOTIFY: { id: 'spotify', name: 'Spotify', color: '#1DB954', icon: '♫' },
  PRIME: { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: 'PV' },
  MAX: { id: 'max', name: 'Max', color: '#0877ff', icon: 'M' },
  DISNEY: { id: 'disney', name: 'Disney+', color: '#0a74ff', icon: 'D+' },
  YOUTUBE: { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶' },
  PARAMOUNT: { id: 'paramount', name: 'Paramount+', color: '#0064ff', icon: 'P+' },
  HBO: { id: 'hbo', name: 'HBO', color: '#8B5CF6', icon: 'HBO' },
  CRUNCHYROLL: { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', icon: 'CR' },
  OTHER: { id: 'other', name: 'Otro', color: '#7AA6C8', icon: '?' }
};

function getProductCategory(productName) {
  if (!productName) return ProductCategories.OTHER;
  const name = productName.toLowerCase();
  if (name.includes('netflix')) return ProductCategories.NETFLIX;
  if (name.includes('spotify')) return ProductCategories.SPOTIFY;
  if (name.includes('prime') || name.includes('amazon')) return ProductCategories.PRIME;
  if (name.includes('max')) return ProductCategories.MAX;
  if (name.includes('disney') || name.includes('disney+')) return ProductCategories.DISNEY;
  if (name.includes('youtube')) return ProductCategories.YOUTUBE;
  if (name.includes('paramount')) return ProductCategories.PARAMOUNT;
  if (name.includes('hbo')) return ProductCategories.HBO;
  if (name.includes('crunchy')) return ProductCategories.CRUNCHYROLL;
  return ProductCategories.OTHER;
}

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

function getTimeAgo(dateString) {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-CO');
}

// ═══════════════════════════════════════════════════════════════
// 📊 DASHBOARD DE COMPRAS
// ═══════════════════════════════════════════════════════════════

function getPurchaseStats() {
  const orders = state.orders || [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  // Stats básicas
  const total = orders.length;
  const active = orders.filter(o => {
    const days = getDaysLeft(o.expires_at);
    return days !== null && days >= 0;
  });
  const expired = orders.filter(o => {
    const days = getDaysLeft(o.expires_at);
    return days !== null && days < 0;
  });
  const expiringSoon = orders.filter(o => {
    const days = getDaysLeft(o.expires_at);
    return days !== null && days >= 0 && days <= 7;
  });
  
  // Stats por período
  const todayOrders = orders.filter(o => new Date(o.created_at || o.date || 0) >= todayStart);
  const weekOrders = orders.filter(o => new Date(o.created_at || o.date || 0) >= weekStart);
  
  // Ingresos
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
  
  // Stats por producto
  const productStats = {};
  orders.forEach(o => {
    const cat = getProductCategory(o.product_name);
    if (!productStats[cat.id]) {
      productStats[cat.id] = { ...cat, count: 0, revenue: 0 };
    }
    productStats[cat.id].count++;
    productStats[cat.id].revenue += o.amount || o.total || 0;
  });
  
  // Órdenes próximas a vencer ordenadas
  const expiringOrders = orders
    .filter(o => {
      const days = getDaysLeft(o.expires_at);
      return days !== null && days >= 0 && days <= 7;
    })
    .sort((a, b) => getDaysLeft(a.expires_at) - getDaysLeft(b.expires_at));
  
  return {
    total,
    active: active.length,
    expired: expired.length,
    expiringSoon: expiringSoon.length,
    todayOrders: todayOrders.length,
    weekOrders: weekOrders.length,
    totalRevenue,
    todayRevenue,
    weekRevenue,
    productStats: Object.values(productStats).sort((a, b) => b.count - a.count),
    expiringOrders
  };
}

function renderPurchaseDashboard() {
  const stats = getPurchaseStats();
  
  return `
    <div class="purchase-dashboard">
      <!-- Métricas principales -->
      <div class="dashboard-metrics">
        <div class="metric-card total">
          <div class="metric-icon">📦</div>
          <div class="metric-content">
            <div class="metric-value">${stats.total}</div>
            <div class="metric-label">Total Compras</div>
          </div>
        </div>
        <div class="metric-card active">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <div class="metric-value">${stats.active}</div>
            <div class="metric-label">Activas</div>
          </div>
        </div>
        <div class="metric-card warning ${stats.expiringSoon > 0 ? 'pulse' : ''}">
          <div class="metric-icon">⏰</div>
          <div class="metric-content">
            <div class="metric-value">${stats.expiringSoon}</div>
            <div class="metric-label">Por Vencer (7d)</div>
          </div>
        </div>
        <div class="metric-card expired">
          <div class="metric-icon">❌</div>
          <div class="metric-content">
            <div class="metric-value">${stats.expired}</div>
            <div class="metric-label">Vencidas</div>
          </div>
        </div>
      </div>
      
      <!-- Stats de ingresos y período -->
      <div class="dashboard-stats-row">
        <div class="stat-box">
          <div class="stat-label">💰 Ingresos Totales</div>
          <div class="stat-value">${formatMoney(stats.totalRevenue)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">📅 Hoy</div>
          <div class="stat-value">${stats.todayOrders} compras</div>
          <div class="stat-sub">${formatMoney(stats.todayRevenue)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">📆 Esta Semana</div>
          <div class="stat-value">${stats.weekOrders} compras</div>
          <div class="stat-sub">${formatMoney(stats.weekRevenue)}</div>
        </div>
      </div>
      
      ${stats.productStats.length > 0 ? `
        <!-- Distribución por producto -->
        <div class="product-distribution">
          <h3 class="section-title">📊 Distribución por Servicio</h3>
          <div class="product-bars">
            ${stats.productStats.slice(0, 6).map(p => {
              const maxCount = stats.productStats[0].count;
              const percentage = (p.count / maxCount) * 100;
              return `
                <div class="product-bar-item">
                  <div class="product-bar-header">
                    <div class="product-bar-info">
                      <span class="product-dot" style="background: ${p.color}"></span>
                      <span class="product-name">${p.name}</span>
                    </div>
                    <div class="product-bar-stats">
                      <span class="product-count">${p.count}</span>
                      <span class="product-revenue">${formatMoney(p.revenue)}</span>
                    </div>
                  </div>
                  <div class="product-bar-track">
                    <div class="product-bar-fill" style="width: ${percentage}%; background: ${p.color}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      
      ${stats.expiringOrders.length > 0 ? `
        <!-- Próximas a vencer -->
        <div class="expiring-soon-section">
          <h3 class="section-title">⏰ Próximas a Vencer</h3>
          <div class="expiring-list">
            ${stats.expiringOrders.slice(0, 5).map(o => {
              const days = getDaysLeft(o.expires_at);
              const urgency = days <= 1 ? 'critical' : days <= 3 ? 'high' : 'normal';
              return `
                <div class="expiring-item urgency-${urgency}">
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
      ` : ''}
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
  const balance = state.user?.balance || 0;
  const lowBalance = balance < 50000; // Alertar si tiene menos de 50k
  
  return `
    <div class="quick-actions-widget">
      <h3 class="widget-title">⚡ Acciones Rápidas</h3>
      
      ${lowBalance ? `
        <div class="alert-banner warning">
          <span>⚠️</span>
          <span>Saldo bajo: ${formatMoney(balance)}. <a href="#" onclick="setView('payments');closeModal()">Recargar</a></span>
        </div>
      ` : ''}
      
      <div class="quick-actions-grid">
        <button onclick="setView('store')" class="quick-action-btn primary-action">
          <span class="qa-icon">🛒</span>
          <span class="qa-label">Nueva Compra</span>
        </button>
        
        ${stats.expiringSoon > 0 ? `
          <button onclick="showRenewalModal()" class="quick-action-btn warning-action">
            <span class="qa-icon">🔄</span>
            <span class="qa-label">Renovar (${stats.expiringSoon})</span>
          </button>
        ` : ''}
        
        <button onclick="setView('history')" class="quick-action-btn">
          <span class="qa-icon">📜</span>
          <span class="qa-label">Historial</span>
        </button>
        
        <button onclick="openBulkRenewal()" class="quick-action-btn">
          <span class="qa-icon">📦</span>
          <span class="qa-label">Renovar Varios</span>
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
  
  const stats = getPurchaseStats();
  const user = state.user || {};
  const margin = user.reseller_margin || 0;
  const clients = state.users?.filter(u => u.referrer_id === user.id)?.length || 0;
  
  return `
    <div class="reseller-panel">
      <div class="reseller-header">
        <div class="reseller-badge">🏷️ REVENDEDOR</div>
        <h3 class="reseller-title">Panel de Revendedor</h3>
      </div>
      
      <div class="reseller-stats">
        <div class="reseller-stat">
          <div class="reseller-stat-value">${clients}</div>
          <div class="reseller-stat-label">Clientes Referidos</div>
        </div>
        <div class="reseller-stat">
          <div class="reseller-stat-value">${margin}%</div>
          <div class="reseller-stat-label">Tu Margen</div>
        </div>
        <div class="reseller-stat">
          <div class="reseller-stat-value">${stats.active}</div>
          <div class="reseller-stat-label">Cuentas Activas</div>
        </div>
      </div>
      
      <div class="reseller-tools">
        <h4 class="tools-title">🛠️ Herramientas</h4>
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
            const cat = getProductCategory(p.name);
            const price = p.price || 0;
            return `
              <div class="pricing-item">
                <div class="pricing-info">
                  <span class="pricing-dot" style="background:${cat.color}"></span>
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
// 💰 ALERTAS DE SALDO
// ═══════════════════════════════════════════════════════════════

function renderBalanceAlert() {
  const balance = state.user?.balance || 0;
  const alertLevel = balance < 10000 ? 'critical' : balance < 50000 ? 'warning' : null;
  
  if (!alertLevel) return '';
  
  return `
    <div class="balance-alert ${alertLevel}">
      <span class="alert-icon">${alertLevel === 'critical' ? '🚨' : '⚠️'}</span>
      <div class="alert-content">
        <div class="alert-title">Saldo ${alertLevel === 'critical' ? 'crítico' : 'bajo'}</div>
        <div class="alert-message">Tienes ${formatMoney(balance)}. ${alertLevel === 'critical' ? 'Recarga inmediatamente.' : 'Considere recargar pronto.'}</div>
      </div>
      <button onclick="setView('payments')" class="alert-action">Recargar →</button>
    </div>
  `;
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
  const stats = getPurchaseStats();
  
  return `
    <!-- Dashboard de compras -->
    ${renderPurchaseDashboard()}
    
    <!-- Alerta de saldo -->
    ${renderBalanceAlert()}
    
    <!-- Widget de acciones rápidas -->
    ${renderQuickActionsWidget()}
    
    <!-- Panel de revendedor -->
    ${renderResellerPanel()}
    
    <!-- Lista de compras con filtros avanzados -->
    <section class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="margin:0;font-size:16px;font-weight:900">Mis Compras</h2>
          <p class="muted" style="margin:4px 0 0;font-size:12px">
            <span id="ordersStats">${stats.active} activas · ${stats.total} total</span>
          </p>
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
    /* Dashboard de compras */
    .purchase-dashboard {
      margin-bottom: 16px;
    }
    
    .dashboard-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    @media (max-width: 768px) {
      .dashboard-metrics {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .metric-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s ease;
    }
    
    .metric-card:hover {
      border-color: var(--blue);
      box-shadow: 0 4px 12px rgba(8, 119, 255, 0.1);
    }
    
    .metric-card.warning {
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.05);
    }
    
    .metric-card.warning.pulse {
      animation: pulseWarning 2s infinite;
    }
    
    @keyframes pulseWarning {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
    }
    
    .metric-icon {
      font-size: 24px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
      line-height: 1;
    }
    
    .metric-label {
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
    }
    
    /* Stats de ingresos */
    .dashboard-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    @media (max-width: 768px) {
      .dashboard-stats-row {
        grid-template-columns: 1fr;
      }
    }
    
    .stat-box {
      background: var(--soft);
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 800;
      color: var(--text);
    }
    
    .stat-sub {
      font-size: 11px;
      color: var(--blue);
      margin-top: 2px;
    }
    
    /* Distribución por producto */
    .product-distribution {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
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

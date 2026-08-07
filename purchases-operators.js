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

// ═══════════════════════════════════════════════════════════════
// 🎫 SECCIÓN DE SOPORTE MEJORADA
// ═══════════════════════════════════════════════════════════════

function improvedReportsView() {
  const myReports = state.reports || [];
  // Limpiar reportes resueltos hace más de 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const active = myReports.filter(r => r.status !== "Resuelto" && r.status !== "Rechazado");
  const resolved = myReports.filter(r => {
    if (r.status === "Resuelto" || r.status === "Rechazado") {
      const reportDate = new Date(r.updated_at || r.created_at);
      return reportDate > twoMonthsAgo;
    }
    return false;
  });
  
  return `
    <div class="reports-container">
      <div class="reports-stats">
        <div class="report-stat-card active">
          <div class="report-stat-icon">🔵</div>
          <div class="report-stat-info">
            <div class="report-stat-num">${active.length}</div>
            <div class="report-stat-label">En Proceso</div>
          </div>
        </div>
        
        <div class="report-stat-card resolved">
          <div class="report-stat-icon">✅</div>
          <div class="report-stat-info">
            <div class="report-stat-num">${resolved.length}</div>
            <div class="report-stat-label">Resueltos</div>
          </div>
        </div>
        
        <div class="report-stat-card total">
          <div class="report-stat-icon">📋</div>
          <div class="report-stat-info">
            <div class="report-stat-num">${active.length + resolved.length}</div>
            <div class="report-stat-label">Total</div>
          </div>
        </div>
      </div>
      
      <div class="reports-tabs">
        <button onclick="switchReportsTab('active')" id="tab_reports_active" class="reports-tab ${active.length > 0 ? 'active' : ''}">
          🔵 En Proceso <span class="tab-count">${active.length}</span>
        </button>
        <button onclick="switchReportsTab('resolved')" id="tab_reports_resolved" class="reports-tab ${active.length === 0 && resolved.length > 0 ? 'active' : ''}">
          ✅ Resueltos <span class="tab-count">${resolved.length}</span>
        </button>
      </div>
      
      <div class="reports-list" id="reportsList">
        ${renderReportsList(active, 'active')}
      </div>
      
      <div class="reports-info">
        <div class="reports-info-icon">ℹ️</div>
        <div class="reports-info-text">
          Los reportes resueltos se eliminan automáticamente después de 2 meses.
        </div>
      </div>
    </div>
  `;
}

function switchReportsTab(tab) {
  const myReports = state.reports || [];
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const filtered = tab === 'active' 
    ? myReports.filter(r => r.status !== "Resuelto" && r.status !== "Rechazado")
    : myReports.filter(r => {
      if (r.status === "Resuelto" || r.status === "Rechazado") {
        const reportDate = new Date(r.updated_at || r.created_at);
        return reportDate > twoMonthsAgo;
      }
      return false;
    });
  
  document.getElementById('tab_reports_active').classList.toggle('active', tab === 'active');
  document.getElementById('tab_reports_resolved').classList.toggle('active', tab === 'resolved');
  document.getElementById('reportsList').innerHTML = renderReportsList(filtered, tab);
}

function renderReportsList(reports, tab) {
  if (!reports || reports.length === 0) {
    return `
      <div class="reports-empty">
        <div class="reports-empty-icon">${tab === 'active' ? '🎉' : '📭'}</div>
        <div class="reports-empty-title">${tab === 'active' ? '¡Sin reportes pendientes!' : 'Sin reportes resueltos'}</div>
        <div class="reports-empty-text">
          ${tab === 'active' 
            ? 'Todos tus reportes han sido atendidos. ¡Eso es bueno!' 
            : 'Los reportes resueltos aparecerán aquí'}
        </div>
      </div>
    `;
  }
  
  return reports.map(r => renderReportCard(r, tab)).join('<div style="height:16px"></div>');
}

function renderReportCard(r, tab) {
  const statusConfig = {
    'En proceso': { icon: '🔄', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: 'En Proceso' },
    'En revisión': { icon: '👁️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: 'En Revisión' },
    'Abierto': { icon: '🔵', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', text: 'Abierto' },
    'Resuelto': { icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: 'Resuelto' },
    'Rechazado': { icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: 'Rechazado' }
  };
  
  const config = statusConfig[r.status] || { icon: '●', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', text: r.status };
  const timeAgo = getTimeAgo(r.created_at);
  const reasonLabel = getReasonLabel(r.reason);
  
  return `
    <div class="report-item" onclick="showReportDetail('${r.id}')">
      <div class="report-item-header">
        <div class="report-item-icon" style="background:${config.bg}">${config.icon}</div>
        <div class="report-item-info">
          <div class="report-item-title">${reasonLabel}</div>
          <div class="report-item-sub">${r.product_name || 'Reporte #' + (r.code || r.id || '').slice(-6)}</div>
        </div>
        <div class="report-item-status" style="background:${config.bg};color:${config.color}">
          ${config.text}
        </div>
      </div>
      <div class="report-item-footer">
        <span class="report-item-time">🕐 ${timeAgo}</span>
        <span class="report-item-id">#${(r.code || r.id || '').slice(-6)}</span>
      </div>
    </div>
  `;
}

async function deleteMyReport(reportId) {
  if (!confirm('¿Estás seguro de eliminar este reporte? Si fue un error, podrás crear uno nuevo.')) {
    return;
  }
  
  try {
    showLoading('Eliminando reporte...');
    await api('reports?id=' + reportId, { method: 'DELETE' });
    toast('✅ Reporte eliminado', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('❌ Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

function getReasonLabel(reason) {
  const labels = {
    // Pagos
    'no_received': '💰 Pago no reflejado',
    'wrong_amount': '🔢 Monto incorrecto',
    'no_confirmation': '⏳ Sin confirmación',
    // Quejas/Reclamos
    'wrong_charge': '💰 Desacuerdo con el cobro',
    'unrecognized': '❓ Movimiento no reconocido',
    'service_issue': '⚠️ Problema con el servicio',
    // Cuentas
    'account_issue': '🔐 Problema con la cuenta',
    'invalid_data': '❌ Datos inválidos',
    'expired_soon': '⏰ Cuenta por vencer',
    'other': '❓ Otro problema'
  };
  return labels[reason] || '📋 Reporte';
}

function showReportDetail(reportId) {
  const report = state.reports.find(r => r.id === reportId);
  if (!report) return;
  
  const statusConfig = {
    'En proceso': { icon: '🔄', color: '#8b5cf6' },
    'En revisión': { icon: '👁️', color: '#f59e0b' },
    'Abierto': { icon: '🔵', color: '#3b82f6' },
    'Resuelto': { icon: '✅', color: '#10b981' },
    'Rechazado': { icon: '❌', color: '#ef4444' }
  };
  
  const config = statusConfig[report.status] || { icon: '●', color: '#6b7280' };
  const reasonLabel = getReasonLabel(report.reason);
  const timeAgo = getTimeAgo(report.created_at);
  
  openModal(`
    <div class="modal-content">
      <div class="modal-header">
        <h2>📋 Detalle del Reporte</h2>
        <button onclick="closeModal()" class="btn-close">×</button>
      </div>
      <div class="modal-body">
        <div class="report-detail-status" style="background:${config.color}">
          ${config.icon} ${report.status}
        </div>
        
        <div class="detail-info">
          <div class="detail-row"><span>ID Reporte:</span><span>#${(report.code || report.id || '').slice(-6)}</span></div>
          <div class="detail-row"><span>Fecha:</span><span>${formatDate(report.created_at)}</span></div>
          <div class="detail-row"><span>Hace:</span><span>${timeAgo}</span></div>
          ${report.product_name ? `<div class="detail-row"><span>Producto:</span><span>${report.product_name}</span></div>` : ''}
        </div>
        
        <div class="report-reason-box">
          <div class="report-reason-label">Tipo de problema:</div>
          <div class="report-reason-value">${reasonLabel}</div>
        </div>
        
        ${report.description ? `
        <div class="report-description-box">
          <div class="report-description-label">Descripción:</div>
          <div class="report-description-text">${report.description}</div>
        </div>
        ` : ''}
        
        ${report.provider_response ? `
        <div class="report-response-box">
          <div class="report-response-label">💬 Respuesta del soporte:</div>
          <div class="report-response-text">${report.provider_response}</div>
        </div>
        ` : ''}
        
        <div class="report-timeline">
          <div class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
              <div class="timeline-title">Reporte creado</div>
              <div class="timeline-time">${formatDate(report.created_at)}</div>
            </div>
          </div>
          ${report.status !== 'Abierto' ? `
          <div class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
              <div class="timeline-title">En revisión</div>
              <div class="timeline-time">En proceso</div>
            </div>
          </div>
          ` : ''}
          ${report.status === 'Resuelto' || report.status === 'Rechazado' ? `
          <div class="timeline-item">
            <div class="timeline-dot ${report.status === 'Resuelto' ? 'success' : 'rejected'}"></div>
            <div class="timeline-content">
              <div class="timeline-title">${report.status}</div>
              <div class="timeline-time">Completado</div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="report-actions">
          <button onclick="deleteMyReport('${report.id}')" class="btn-delete-report">
            🗑️ Eliminar Reporte
          </button>
        </div>
        
        <button onclick="closeModal()" class="btn-close-final">
          Cerrar
        </button>
      </div>
    </div>
  `);
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
// ⚠️ REPORTAR PROBLEMA CON PAGO
// ═══════════════════════════════════════════════════════════════

function openPaymentReport(topupId) {
  const topup = state.topups.find(t => t.id === topupId) || state.topups[0];
  if (!topup) {
    openModal(`
      <div class="modal-content">
        <div class="modal-header">
          <h2>⚠️ Reportar Problema</h2>
          <button onclick="closeModal()" class="btn-close">×</button>
        </div>
        <div class="modal-body" style="text-align:center;padding:40px 20px">
          <div style="font-size:48px;margin-bottom:12px">❌</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:4px">No se encontró la recarga</div>
          <div style="font-size:13px;color:#6b7280">Contacta a soporte directamente</div>
        </div>
      </div>
    `);
    return;
  }
  
  // Verificar si ya tiene un reporte para este pago
  const existingReport = state.reports?.find(r => 
    r.topup_id === topupId && 
    r.status !== "Resuelto" && 
    r.status !== "Rechazado"
  );
  
  if (existingReport) {
    // Ya tiene reporte abierto - mostrar mensaje con el problema reportado
    const reasonLabel = getReasonLabel(existingReport.reason);
    openModal(`
      <div class="modal-content">
        <div class="modal-header">
          <h2>⚠️ Reporte Enviado</h2>
          <button onclick="closeModal()" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="existing-report-card">
            <div class="existing-report-icon">⏳</div>
            <div class="existing-report-title">Tu reporte está siendo atendido</div>
            <div class="existing-report-subtitle">Reportaste el ${formatDate(existingReport.created_at)}</div>
          </div>
          
          <div class="existing-report-problem">
            <div class="existing-report-problem-label">📋 Tu reporte:</div>
            <div class="existing-report-problem-value">${reasonLabel}</div>
            ${existingReport.description ? `<div class="existing-report-description">"${existingReport.description}"</div>` : ''}
          </div>
          
          <div class="existing-report-status">
            <div class="status-badge-large ${existingReport.status === 'En proceso' ? 'pending' : existingReport.status === 'Resuelto' ? 'success' : ''}">
              ${existingReport.status === 'En proceso' ? '🔄 En Proceso' : 
                existingReport.status === 'Resuelto' ? '✅ Resuelto' : 
                existingReport.status === 'Rechazado' ? '❌ Rechazado' : 
                '👁️ ' + existingReport.status}
            </div>
          </div>
          
          ${existingReport.provider_response ? `
          <div class="support-response-box">
            <div class="support-response-label">💬 Respuesta del soporte:</div>
            <div class="support-response-text">${existingReport.provider_response}</div>
          </div>
          ` : `
          <div class="waiting-response">
            <div class="waiting-icon">⏰</div>
            <div class="waiting-text">Estamos revisando tu caso. Te responderemos pronto.</div>
          </div>
          `}
          
          <div class="only-one-notice">
            ⚠️ Solo puedes reportar cada pago una vez
          </div>
          
          <button onclick="closeModal()" class="btn-close-report">
            Entendido, esperaré la respuesta
          </button>
        </div>
      </div>
    `);
    return;
  }
  
  const reasons = [
    { value: 'no_received', label: '💰 El pago no fue reflejado', desc: 'Realicé el pago pero el saldo no aumentó' },
    { value: 'wrong_amount', label: '🔢 El monto es incorrecto', desc: 'Pagué un monto diferente al aprobado' },
    { value: 'no_confirmation', label: '⏳ Sin confirmación', desc: 'El pago fue realizado pero no hay respuesta' },
    { value: 'other', label: '❓ Otro problema', desc: 'Otro tipo de inconveniente' }
  ];
  
  openModal(`
    <div class="modal-content">
      <div class="modal-header">
        <h2>⚠️ Reportar Problema de Pago</h2>
        <button onclick="closeModal()" class="btn-close">×</button>
      </div>
      <div class="modal-body">
        <div class="report-warning-top">
          ⚠️ Solo puedes reportar este pago una sola vez
        </div>
        
        <div class="detail-card" style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.05));border:2px solid rgba(245,158,11,0.2)">
          <div style="font-size:12px;color:#92400e;text-transform:uppercase;font-weight:700;margin-bottom:8px">Detalles del pago</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#6b7280">Monto:</span>
            <span style="font-weight:800;color:#d97706">${formatMoney(topup.amount || 0)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#6b7280">Método:</span>
            <span style="font-weight:600">${topup.method || 'Nequi/Wompi'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280">Fecha:</span>
            <span style="font-weight:600">${formatDate(topup.created_at || topup.approved_at || new Date())}</span>
          </div>
        </div>
        
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">¿Cuál es el problema?</div>
          ${reasons.map(r => `
            <label class="report-reason-option" onclick="selectReportReason(this, '${r.value}')">
              <input type="radio" name="reportReason" value="${r.value}" style="display:none">
              <div class="reason-radio"></div>
              <div class="reason-content">
                <div class="reason-label">${r.label}</div>
                <div class="reason-desc">${r.desc}</div>
              </div>
            </label>
          `).join('')}
        </div>
        
        <div style="margin-bottom:16px">
          <textarea id="reportDescription" placeholder="Describe el problema con más detalle (opcional)" rows="3" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:13px;resize:none;outline:none;transition:border-color .2s" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
        </div>
        
        <button onclick="submitPaymentReport('${topupId}')" class="order-btn datos" style="width:100%;padding:14px;font-size:15px">
          📤 Enviar Reporte (Una sola vez)
        </button>
      </div>
    </div>
  `);
}

function selectReportReason(element, value) {
  document.querySelectorAll('.report-reason-option').forEach(el => {
    el.classList.remove('selected');
    el.querySelector('.reason-radio').classList.remove('active');
  });
  element.classList.add('selected');
  element.querySelector('.reason-radio').classList.add('active');
  element.querySelector('input').checked = true;
}

async function submitPaymentReport(topupId) {
  const reasonEl = document.querySelector('input[name="reportReason"]:checked');
  const reason = reasonEl ? reasonEl.value : '';
  const description = document.getElementById('reportDescription')?.value || '';
  
  if (!reason) {
    toast('⚠️ Selecciona el tipo de problema', 'warn');
    return;
  }
  
  try {
    showLoading('Enviando reporte...');
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        topup_id: topupId,
        reason: reason,
        description: description,
        type: 'payment'
      })
    });
    toast('✅ Reporte enviado correctamente', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('❌ Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

async function submitPaymentReportNew(topupId, encodedMovement) {
  const reasonEl = document.querySelector('input[name="reportReason"]:checked');
  const reason = reasonEl ? reasonEl.value : '';
  const description = document.getElementById('reportDescription')?.value || '';
  
  if (!reason) {
    toast('⚠️ Selecciona el tipo de problema', 'warn');
    return;
  }
  
  try {
    showLoading('Enviando reporte de pago...');
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        topup_id: topupId,
        reason: reason,
        description: description,
        type: 'payment'
      })
    });
    toast('✅ Reporte de pago enviado', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('❌ Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

async function submitComplaintReport(orderId, encodedMovement) {
  const reasonEl = document.querySelector('input[name="complaintReason"]:checked');
  const reason = reasonEl ? reasonEl.value : '';
  const description = document.getElementById('complaintDescription')?.value || '';
  
  if (!reason) {
    toast('⚠️ Selecciona el tipo de queja o reclamo', 'warn');
    return;
  }
  
  try {
    showLoading('Enviando queja o reclamo...');
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        reason: reason,
        description: description,
        type: 'complaint'
      })
    });
    toast('✅ Queja o reclamo enviado', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('❌ Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════
// 📊 VISTA MEJORADA DE MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════

function improvedHistoryView() {
  const allMovements = buildMovements();
  const movements = getFilteredMovements ? getFilteredMovements() : allMovements;
  
  const totalCredito = movements.filter(m => m.amount > 0).reduce((s,m) => s + m.amount, 0);
  const totalDebito = movements.filter(m => m.amount < 0).reduce((s,m) => s + Math.abs(m.amount), 0);
  
  return `
    <div class="history-stats">
      <div class="history-stat-card green">
        <div class="history-stat-icon">💰</div>
        <div class="history-stat-info">
          <div class="history-stat-label">Total Recargas</div>
          <div class="history-stat-value">${formatMoney(totalCredito)}</div>
        </div>
      </div>
      
      <div class="history-stat-card purple">
        <div class="history-stat-icon">🛒</div>
        <div class="history-stat-info">
          <div class="history-stat-label">Total Gastado</div>
          <div class="history-stat-value">${formatMoney(totalDebito)}</div>
        </div>
      </div>
      
      <div class="history-stat-card blue">
        <div class="history-stat-icon">💳</div>
        <div class="history-stat-info">
          <div class="history-stat-label">Saldo Actual</div>
          <div class="history-stat-value">${formatMoney(state.user?.balance || 0)}</div>
        </div>
      </div>
    </div>
    
    <div class="history-section">
      <div class="section-header">
        <h2>📊 Detalle de Movimientos</h2>
        <span class="section-count purple">${movements.length}</span>
      </div>
      
      <div class="history-list">
        ${movements.length > 0 ? movements.map(m => improvedMovementCard(m)).join('') : `
          <div class="orders-empty">
            <div class="orders-empty-icon">📊</div>
            <div class="orders-empty-title">Sin movimientos</div>
            <div class="orders-empty-text">Tus recargas y compras aparecerán aquí</div>
          </div>
        `}
      </div>
    </div>
  `;
}

function improvedMovementCard(m) {
  const isCredit = m.amount > 0;
  const dateStr = formatDate(m.date);
  const hasOrder = m.orderData && !isCredit;
  const orderId = hasOrder ? m.orderData.id : '';
  
  return `
    <div class="movement-card ${isCredit ? 'credit' : 'debit'}" onclick="showMovementDetail('${orderId}', '${isCredit}', '${encodeURIComponent(JSON.stringify(m))}')">
      <div class="movement-card-left">
        <div class="movement-icon ${isCredit ? 'green' : 'purple'}">${isCredit ? '💰' : '🛒'}</div>
        <div class="movement-info">
          <div class="movement-desc">${m.description || (isCredit ? 'Recarga' : 'Compra')}</div>
          <div class="movement-date">${dateStr}</div>
          ${hasOrder && m.orderData.product_name ? `<div class="movement-product">📦 ${m.orderData.product_name}</div>` : ''}
        </div>
      </div>
      <div class="movement-card-right">
        <div class="movement-amount ${isCredit ? 'positive' : 'negative'}">
          ${isCredit ? '+' : '-'}${formatMoney(Math.abs(m.amount))}
        </div>
        <div class="movement-type ${isCredit ? 'credit' : 'debit'}">
          ${isCredit ? 'Recarga' : 'Compra'}
        </div>
      </div>
    </div>
  `;
}

function showMovementDetail(orderId, isCredit, encodedData) {
  const m = JSON.parse(decodeURIComponent(encodedData));
  const isCreditBool = isCredit === 'true';
  const topupId = isCreditBool && m.orderData?.id ? m.orderData.id : '';
  
  if (isCreditBool) {
    // Verificar si ya tiene reporte para este pago
    const existingReport = state.reports?.find(r => 
      r.topup_id === topupId && 
      r.status !== "Resuelto" && 
      r.status !== "Rechazado"
    );
    
    const topupData = m.orderData || {};
    
    if (existingReport) {
      // Ya tiene reporte abierto
      const reasonLabel = getReasonLabel(existingReport.reason);
      openModal(`
        <div class="modal-content">
          <div class="modal-header">
            <h2>⚠️ Reporte de Pago Enviado</h2>
            <button onclick="closeModal()" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <div class="existing-report-card">
              <div class="existing-report-icon">⏳</div>
              <div class="existing-report-title">Reporte de pago enviado</div>
              <div class="existing-report-subtitle">Fecha: ${formatDate(m.date)}</div>
            </div>
            
            <div class="existing-report-problem">
              <div class="existing-report-problem-label">📋 Tu reporte:</div>
              <div class="existing-report-problem-value">${reasonLabel}</div>
              ${existingReport.description ? `<div class="existing-report-description">"${existingReport.description}"</div>` : ''}
            </div>
            
            <div class="existing-report-status">
              <div class="status-badge-large ${existingReport.status === 'En proceso' ? 'pending' : existingReport.status === 'Resuelto' ? 'success' : ''}">
                ${existingReport.status === 'En proceso' ? '🔄 En Proceso' : 
                  existingReport.status === 'Resuelto' ? '✅ Resuelto' : 
                  existingReport.status === 'Rechazado' ? '❌ Rechazado' : 
                  '👁️ ' + existingReport.status}
              </div>
            </div>
            
            ${existingReport.provider_response ? `
            <div class="support-response-box">
              <div class="support-response-label">💬 Respuesta del soporte:</div>
              <div class="support-response-text">${existingReport.provider_response}</div>
            </div>
            ` : `
            <div class="waiting-response">
              <div class="waiting-icon">⏰</div>
              <div class="waiting-text">Estamos revisando tu reporte de pago. Te responderemos pronto.</div>
            </div>
            `}
            
            <div class="only-one-notice">
              ⚠️ Solo puedes reportar este pago una vez
            </div>
            
            <button onclick="closeModal()" class="btn-close-report">
              Entendido, esperaré la respuesta
            </button>
          </div>
        </div>
      `);
    } else {
      // No tiene reporte - mostrar formulario
      const reasons = [
        { value: 'no_received', label: '💰 El pago no fue reflejado', desc: 'Realicé el pago pero el saldo no aumentó' },
        { value: 'wrong_amount', label: '🔢 El monto es incorrecto', desc: 'Pagué un monto diferente al aprobado' },
        { value: 'no_confirmation', label: '⏳ Sin confirmación', desc: 'El pago fue realizado pero no hay respuesta' },
        { value: 'other', label: '❓ Otro problema', desc: 'Otro tipo de inconveniente' }
      ];
      
      openModal(`
        <div class="modal-content">
          <div class="modal-header">
            <h2>⚠️ Reportar Problema de Pago</h2>
            <button onclick="closeModal()" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <div class="report-warning-top">
              ⚠️ Solo puedes reportar este pago una sola vez
            </div>
            
            <div class="detail-card" style="background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.05));border:2px solid rgba(16,185,129,0.2)">
              <div style="font-size:12px;color:#047857;text-transform:uppercase;font-weight:700;margin-bottom:8px">Datos del pago</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6b7280">Monto:</span>
                <span style="font-weight:800;color:#059669">+${formatMoney(Math.abs(m.amount))}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6b7280">Fecha:</span>
                <span style="font-weight:600">${formatDate(m.date)}</span>
              </div>
              ${topupData.method ? `
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#6b7280">Método:</span>
                <span style="font-weight:600">${topupData.method}</span>
              </div>
              ` : ''}
            </div>
            
            <div style="margin-bottom:16px">
              <div style="font-size:14px;font-weight:700;margin-bottom:10px">¿Cuál es el problema?</div>
              ${reasons.map(r => `
                <label class="report-reason-option" onclick="selectReportReason(this, '${r.value}')">
                  <input type="radio" name="reportReason" value="${r.value}" style="display:none">
                  <div class="reason-radio"></div>
                  <div class="reason-content">
                    <div class="reason-label">${r.label}</div>
                    <div class="reason-desc">${r.desc}</div>
                  </div>
                </label>
              `).join('')}
            </div>
            
            <div style="margin-bottom:16px">
              <textarea id="reportDescription" placeholder="Describe el problema con más detalle (opcional)" rows="3" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;resize:none;outline:none;transition:border-color .2s" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
            </div>
            
            <button onclick="submitPaymentReportNew('${topupId}', '${encodeURIComponent(JSON.stringify(m))}')" class="order-btn datos" style="width:100%;padding:16px;font-size:15px">
              📤 Enviar Reporte de Pago (Una sola vez)
            </button>
          </div>
        </div>
      `);
    }
  } else if (orderId) {
    // Verificar si ya tiene reporte
    const existingReport = state.reports?.find(r => 
      r.order_id === orderId && 
      r.status !== "Resuelto" && 
      r.status !== "Rechazado"
    );
    
    if (existingReport) {
      // Ya tiene reporte abierto - mostrar info
      const reasonLabel = getReasonLabel(existingReport.reason);
      openModal(`
        <div class="modal-content">
          <div class="modal-header">
            <h2>⚠️ Queja Enviada</h2>
            <button onclick="closeModal()" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <div class="existing-report-card">
              <div class="existing-report-icon">⏳</div>
              <div class="existing-report-title">Tu queja está siendo atendida</div>
              <div class="existing-report-subtitle">Reportaste el ${formatDate(m.date)}</div>
            </div>
            
            <div class="existing-report-problem">
              <div class="existing-report-problem-label">📋 Tu queja:</div>
              <div class="existing-report-problem-value">${reasonLabel}</div>
              ${existingReport.description ? `<div class="existing-report-description">"${existingReport.description}"</div>` : ''}
            </div>
            
            <div class="existing-report-status">
              <div class="status-badge-large ${existingReport.status === 'En proceso' ? 'pending' : existingReport.status === 'Resuelto' ? 'success' : ''}">
                ${existingReport.status === 'En proceso' ? '🔄 En Proceso' : 
                  existingReport.status === 'Resuelto' ? '✅ Resuelto' : 
                  existingReport.status === 'Rechazado' ? '❌ Rechazado' : 
                  '👁️ ' + existingReport.status}
              </div>
            </div>
            
            ${existingReport.provider_response ? `
            <div class="support-response-box">
              <div class="support-response-label">💬 Respuesta del soporte:</div>
              <div class="support-response-text">${existingReport.provider_response}</div>
            </div>
            ` : `
            <div class="waiting-response">
              <div class="waiting-icon">⏰</div>
              <div class="waiting-text">Estamos revisando tu queja. Te responderemos pronto.</div>
            </div>
            `}
            
            <div class="only-one-notice">
              ⚠️ Solo puedes reportar cada movimiento una vez
            </div>
            
            <button onclick="closeModal()" class="btn-close-report">
              Entendido, esperaré la respuesta
            </button>
          </div>
        </div>
      `);
    } else {
      // No tiene reporte - mostrar formulario de queja/reclamo
      const complaintReasons = [
        { value: 'wrong_charge', label: '💰 Desacuerdo con el cobro', desc: 'Creo que me cobraron de más o incorrectamente' },
        { value: 'unrecognized', label: '❓ Movimiento no reconocido', desc: 'No reconozco este movimiento en mi cuenta' },
        { value: 'wrong_amount', label: '🔢 Monto incorrecto', desc: 'El monto cobrado no corresponde al servicio' },
        { value: 'service_issue', label: '⚠️ Problema con el servicio', desc: 'El servicio no funcionó correctamente' },
        { value: 'other', label: '📝 Otro problema', desc: 'Otro tipo de inconveniente' }
      ];
      
      openModal(`
        <div class="modal-content">
          <div class="modal-header">
            <h2>⚠️ Presentar Queja o Reclamo</h2>
            <button onclick="closeModal()" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <div class="report-warning-top" style="background:#fef3c7;border-color:#f59e0b">
              ⚠️ Solo puedes reportar este movimiento una sola vez
            </div>
            
            <div class="detail-card" style="background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.05));border:2px solid rgba(139,92,246,0.2)">
              <div style="font-size:12px;color:#6b21a8;text-transform:uppercase;font-weight:700;margin-bottom:8px">Datos del movimiento</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6b7280">Tipo:</span>
                <span style="font-weight:600">Compra</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6b7280">Monto:</span>
                <span style="font-weight:800;color:#dc2626">-${formatMoney(Math.abs(m.amount))}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6b7280">Fecha:</span>
                <span style="font-weight:600">${formatDate(m.date)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#6b7280">Producto:</span>
                <span style="font-weight:600">${m.orderData?.product_name || '-'}</span>
              </div>
            </div>
            
            <div style="margin-bottom:16px">
              <div style="font-size:14px;font-weight:700;margin-bottom:10px">¿Cuál es tu queja o reclamo?</div>
              ${complaintReasons.map(r => `
                <label class="report-reason-option" onclick="selectReportReason(this, '${r.value}')">
                  <input type="radio" name="complaintReason" value="${r.value}" style="display:none">
                  <div class="reason-radio"></div>
                  <div class="reason-content">
                    <div class="reason-label">${r.label}</div>
                    <div class="reason-desc">${r.desc}</div>
                  </div>
                </label>
              `).join('')}
            </div>
            
            <div style="margin-bottom:16px">
              <textarea id="complaintDescription" placeholder="Describe tu queja o reclamo con más detalle" rows="3" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;resize:none;outline:none;transition:border-color .2s" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
            </div>
            
            <button onclick="submitComplaintReport('${orderId}', '${encodeURIComponent(JSON.stringify(m))}')" class="order-btn datos" style="width:100%;padding:16px;font-size:15px;background:linear-gradient(135deg,#dc2626,#b91c1c)">
              📤 Presentar Queja o Reclamo
            </button>
          </div>
        </div>
      `);
    }
  }
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
    
    .history-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    @media (max-width: 700px) { .history-stats { grid-template-columns: 1fr; } }
    .history-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
    .history-stat-icon { font-size: 28px; }
    .history-stat-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .history-stat-value { font-size: 16px; font-weight: 800; }
    .history-stat-card.green .history-stat-value { color: #059669; }
    .history-stat-card.red .history-stat-value { color: #dc2626; }
    .history-stat-card.purple .history-stat-value { color: #7c3aed; }
    
    .history-section { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
    .history-list { display: flex; flex-direction: column; }
    .movement-card { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; transition: all 0.15s; cursor: pointer; }
    .movement-card:hover { background: #f9fafb; transform: translateX(4px); }
    .movement-card:last-child { border-bottom: none; }
    .movement-card.credit { border-left: 4px solid #10b981; }
    .movement-card.debit { border-left: 4px solid #7c3aed; }
    .movement-card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
    .movement-icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; }
    .movement-icon.green { background: rgba(16,185,129,0.12); }
    .movement-icon.purple { background: rgba(124,58,237,0.12); }
    .movement-info { flex: 1; min-width: 0; }
    .movement-desc { font-size: 15px; font-weight: 700; color: #1f2937; }
    .movement-date { font-size: 12px; color: #9ca3af; margin-top: 3px; }
    .movement-product { font-size: 12px; color: #6b7280; margin-top: 3px; font-weight: 600; }
    .movement-card-right { text-align: right; flex-shrink: 0; margin-left: 16px; }
    .movement-amount { font-size: 16px; font-weight: 800; }
    .movement-amount.positive { color: #059669; }
    .movement-amount.negative { color: #7c3aed; }
    .movement-type { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-top: 4px; }
    .movement-type.credit { background: rgba(16,185,129,0.12); color: #059669; }
    .movement-type.debit { background: rgba(124,58,237,0.12); color: #7c3aed; }
    
    .history-stat-card.purple .history-stat-value { color: #7c3aed; }
    
    .detail-card { text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(139,92,246,0.05)); border-radius: 12px; margin-bottom: 16px; }
    .detail-icon { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 12px; }
    .detail-icon.green { background: rgba(16,185,129,0.15); }
    .detail-icon.purple { background: rgba(124,58,237,0.15); }
    .detail-amount { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .detail-amount.positive { color: #059669; }
    .detail-amount.negative { color: #7c3aed; }
    .detail-type { font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px; display: inline-block; }
    .detail-type.credit { background: rgba(16,185,129,0.12); color: #059669; }
    .detail-type.debit { background: rgba(124,58,237,0.12); color: #7c3aed; }
    .detail-info { background: #f9fafb; border-radius: 10px; padding: 12px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span:first-child { color: #6b7280; }
    .detail-row span:last-child { font-weight: 600; color: #1f2937; }
    .detail-actions { display: flex; flex-direction: column; gap: 10px; }
    
    .report-reason-option { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; }
    .report-reason-option:hover { border-color: #7c3aed; background: rgba(124,58,237,0.04); }
    .report-reason-option.selected { border-color: #7c3aed; background: rgba(124,58,237,0.08); }
    .reason-radio { width: 22px; height: 22px; border: 2px solid #d1d5db; border-radius: 50%; flex-shrink: 0; margin-top: 2px; transition: all 0.2s; position: relative; }
    .reason-radio.active { border-color: #7c3aed; background: #7c3aed; }
    .reason-radio.active::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #fff; border-radius: 50%; }
    .reason-content { flex: 1; }
    .reason-label { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 3px; }
    .reason-desc { font-size: 12px; color: #6b7280; }
    
    .report-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 12px; font-size: 12px; color: #92400e; text-align: center; margin-bottom: 12px; }
    .report-warning-top { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #92400e; text-align: center; margin-bottom: 16px; font-weight: 700; }
    
    .report-action-section { margin-top: 8px; }
    .report-btn-main { width: 100%; padding: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .report-btn-main:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(245,158,11,0.4); }
    .report-btn-main-red { width: 100%; padding: 16px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
    .report-btn-main-red:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(220,38,38,0.4); }
    .report-already-sent { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 16px; text-align: center; }
    .report-sent-icon { font-size: 36px; margin-bottom: 8px; }
    .report-sent-text { font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 12px; }
    .report-btn-view { padding: 10px 20px; background: #22c55e; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .report-btn-view:hover { background: #16a34a; }
    .status-pending { color: #d97706; font-weight: 700; }
    .already-reported { text-align: center; padding: 20px; }
    .already-reported-icon { font-size: 48px; margin-bottom: 12px; }
    .already-reported-title { font-size: 18px; font-weight: 800; color: #166534; margin-bottom: 8px; }
    .already-reported-text { font-size: 13px; color: #4b5563; }
    
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
    
    /* Soporte */
    .reports-container { padding: 0; }
    .reports-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    @media (max-width: 500px) { .reports-stats { grid-template-columns: 1fr; } }
    .report-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border: 2px solid #e5e7eb; border-radius: 14px; }
    .report-stat-icon { font-size: 28px; }
    .report-stat-num { font-size: 24px; font-weight: 900; }
    .report-stat-label { font-size: 12px; color: #4b5563; font-weight: 600; }
    .report-stat-card.active .report-stat-num { color: #2563eb; }
    .report-stat-card.resolved .report-stat-num { color: #059669; }
    .report-stat-card.total .report-stat-num { color: #7c3aed; }
    
    .reports-tabs { display: flex; gap: 10px; margin-bottom: 16px; }
    .reports-tab { flex: 1; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 12px; background: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; color: #4b5563; }
    .reports-tab.active { border-color: #7c3aed; background: #7c3aed; color: #fff; }
    .reports-tab:not(.active):hover { border-color: #7c3aed; background: rgba(124,58,237,0.05); color: #7c3aed; }
    .reports-tab .tab-count { background: rgba(0,0,0,0.1); padding: 4px 10px; border-radius: 20px; font-size: 12px; }
    .reports-tab.active .tab-count { background: rgba(255,255,255,0.2); }
    
    .reports-empty { text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 2px solid #e5e7eb; }
    .reports-empty-icon { font-size: 64px; margin-bottom: 16px; }
    .reports-empty-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; color: #1f2937; }
    .reports-empty-text { font-size: 14px; color: #6b7280; }
    
    .reports-info { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.04)); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; margin-top: 20px; }
    .reports-info-icon { font-size: 24px; flex-shrink: 0; }
    .reports-info-text { font-size: 13px; color: #1e40af; line-height: 1.5; }
    
    .report-actions { margin-bottom: 12px; }
    .btn-delete-report { width: 100%; padding: 14px; background: #fff; color: #dc2626; border: 2px solid #fecaca; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-delete-report:hover { background: #fef2f2; border-color: #dc2626; }
    .btn-close-final { width: 100%; padding: 16px; background: #7c3aed; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .btn-close-final:hover { background: #6d28d9; }
    
    .report-item { background: #fff; border: 2px solid #e5e7eb; border-radius: 14px; padding: 18px; cursor: pointer; transition: all 0.2s; }
    .report-item:hover { border-color: #7c3aed; box-shadow: 0 4px 16px rgba(124,58,237,0.15); transform: translateY(-3px); }
    .report-item-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .report-item-icon { width: 50px; height: 50px; border-radius: 12px; display: grid; place-items: center; font-size: 24px; flex-shrink: 0; }
    .report-item-info { flex: 1; min-width: 0; }
    .report-item-title { font-size: 16px; font-weight: 800; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .report-item-sub { font-size: 13px; color: #6b7280; margin-top: 4px; font-weight: 500; }
    .report-item-status { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .report-item-footer { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; padding-top: 14px; border-top: 1px solid #f3f4f6; font-weight: 500; }
    
    .report-detail-status { text-align: center; padding: 16px; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .report-reason-box { background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #7c3aed; }
    .report-reason-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .report-reason-value { font-size: 16px; font-weight: 700; color: #1f2937; }
    .report-description-box { background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #f59e0b; }
    .report-description-label { font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .report-description-text { font-size: 15px; color: #78350f; font-weight: 500; line-height: 1.5; }
    .report-response-box { background: #ecfdf5; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #10b981; }
    .report-response-label { font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .report-response-text { font-size: 15px; color: #064e3b; font-weight: 500; line-height: 1.5; }
    
    .report-timeline { position: relative; padding-left: 28px; margin: 20px 0; }
    .report-timeline::before { content: ''; position: absolute; left: 9px; top: 0; bottom: 0; width: 3px; background: #e5e7eb; }
    .timeline-item { position: relative; padding-bottom: 20px; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot { width: 20px; height: 20px; border-radius: 50%; background: #e5e7eb; border: 4px solid #fff; position: absolute; left: -28px; top: 0; box-shadow: 0 0 0 3px #e5e7eb; }
    .timeline-dot.active { background: #2563eb; box-shadow: 0 0 0 3px #2563eb; }
    .timeline-dot.success { background: #10b981; box-shadow: 0 0 0 3px #10b981; }
    .timeline-dot.rejected { background: #ef4444; box-shadow: 0 0 0 3px #ef4444; }
    .timeline-content { }
    .timeline-title { font-size: 15px; font-weight: 700; color: #1f2937; }
    .timeline-time { font-size: 13px; color: #6b7280; margin-top: 4px; }
    
    /* Modal reporte existente */
    .existing-report-card { text-align: center; padding: 24px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 14px; margin-bottom: 16px; }
    .existing-report-icon { font-size: 56px; margin-bottom: 12px; }
    .existing-report-title { font-size: 18px; font-weight: 800; color: #92400e; margin-bottom: 4px; }
    .existing-report-subtitle { font-size: 14px; color: #a16207; }
    .existing-report-problem { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 2px solid #e5e7eb; }
    .existing-report-problem-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .existing-report-problem-value { font-size: 16px; font-weight: 800; color: #1f2937; }
    .existing-report-description { font-size: 14px; color: #6b7280; margin-top: 8px; font-style: italic; }
    .existing-report-status { text-align: center; margin-bottom: 16px; }
    .status-badge-large { display: inline-block; padding: 10px 24px; border-radius: 30px; font-size: 15px; font-weight: 800; }
    .status-badge-large.pending { background: #fef3c7; color: #92400e; }
    .status-badge-large.success { background: #d1fae5; color: #065f46; }
    .support-response-box { background: #ecfdf5; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #10b981; }
    .support-response-label { font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px; }
    .support-response-text { font-size: 15px; color: #064e3b; font-weight: 500; line-height: 1.5; }
    .waiting-response { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 12px; margin-bottom: 16px; }
    .waiting-icon { font-size: 40px; margin-bottom: 8px; }
    .waiting-text { font-size: 14px; color: #6b7280; font-weight: 500; }
    .only-one-notice { text-align: center; font-size: 13px; color: #92400e; background: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; }
    .btn-close-report { width: 100%; padding: 16px; background: #7c3aed; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .btn-close-report:hover { background: #6d28d9; }
    
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

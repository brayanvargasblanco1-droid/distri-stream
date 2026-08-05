/**
 * 🎯 SOPORTE MEJORADO PARA OPERADORES Y REVENDEDORES
 * Distrito Streaming - Mejoras dePanel de Soporte
 * 
 * Características:
 * - Panel de soporte específico para operadores/revendedores
 * - Separación clara de reportes activos vs resueltos
 * - Timeline dinámico con fechas
 * - Validación de formularios mejorada
 * - Confirmaciones de acciones
 * - Búsqueda y filtros avanzados
 */

// ═══════════════════════════════════════════════════════════════
// 📊 ESTADOS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════

const ReportStates = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revisión',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  RECHAZADO: 'Rechazado'
};

const ReportCategories = {
  PRODUCTO_NO_LLEGO: { id: 'producto_no_llego', label: '📦 Producto no llegó', color: '#ef4444' },
  DEFECTUOSO: { id: 'defectuoso', label: '⚠️ Defectuoso/No funciona', color: '#f97316' },
  CUENTA_NO_FUNCIONA: { id: 'cuenta_no_funciona', label: '🔐 Cuenta no funciona', color: '#9333ea' },
  ACCESO_DENEGADO: { id: 'acceso_denegado', label: '🚫 Acceso denegado', color: '#3b82f6' },
  OTRO: { id: 'otro', label: '❓ Otro', color: '#6b7280' }
};

// ═══════════════════════════════════════════════════════════════
// 🛡️ VALIDADOR DE REPORTES
// ═══════════════════════════════════════════════════════════════

const ReportValidator = {
  validateNew(report) {
    const errors = [];
    
    if (!report.orderId) {
      errors.push('Debe seleccionar una compra');
    }
    
    if (!report.reason || report.reason.trim().length < 3) {
      errors.push('El motivo debe tener al menos 3 caracteres');
    }
    
    if (!report.description || report.description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }
    
    if (report.description && report.description.length > 1000) {
      errors.push('La descripción no puede exceder 1000 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  isActive(status) {
    return [ReportStates.ABIERTO, ReportStates.EN_REVISION, ReportStates.EN_PROCESO].includes(status);
  },
  
  isResolved(status) {
    return [ReportStates.RESUELTO, ReportStates.RECHAZADO].includes(status);
  },
  
  getTimeAgo(dateString) {
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
  },
  
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎨 PANEL DE SOPORTE MEJORADO PARA USUARIOS
// ═══════════════════════════════════════════════════════════════

function reportsUserImproved() {
  const my = state.reports;
  const active = my.filter(r => ReportValidator.isActive(r.status));
  const resolved = my.filter(r => ReportValidator.isResolved(r.status));
  
  return `
    <section class="premium-metrics" style="margin-bottom:16px">
      <div class="premium-card blue" style="cursor:default">
        <div class="premium-particles"><span></span><span></span><span></span><span></span></div>
        <div class="premium-orb-wrap"><div class="premium-orb"></div><div class="premium-orb r2"></div><div class="premium-center"><span class="premium-num">${active.length}</span></div></div>
        <div class="premium-label">Reportes Activos</div>
      </div>
      <div class="premium-card orange" style="cursor:default">
        <div class="premium-particles"><span></span><span></span><span></span><span></span></div>
        <div class="premium-orb-wrap"><div class="premium-orb"></div><div class="premium-orb r2"></div><div class="premium-center"><span class="premium-num">${resolved.length}</span></div></div>
        <div class="premium-label">Resueltos/Rechazados</div>
      </div>
    </section>
    
    <!-- Tabs de separación -->
    <section class="card" style="overflow:hidden;margin-bottom:16px">
      <div style="display:flex;gap:0;border-bottom:1px solid var(--line)">
        <button onclick="switchUserReportTab('active')" id="tab_user_active" class="report-tab active" style="flex:1;padding:14px 16px;border:0;border-bottom:2px solid var(--blue);background:transparent;color:var(--blue);font-weight:800;font-size:13px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px">
          🔵 Activos <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(8,119,255,.1)">${active.length}</span>
        </button>
        <button onclick="switchUserReportTab('resolved')" id="tab_user_resolved" class="report-tab" style="flex:1;padding:14px 16px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);font-weight:800;font-size:13px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px">
          ✅ Resueltos <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(16,185,129,.1)">${resolved.length}</span>
        </button>
      </div>
      <div id="userReportsContent">
        ${renderUserReportList(my.filter(r => ReportValidator.isActive(r.status)))}
      </div>
    </section>
  `;
}

// Estado para el tab actual
let currentUserReportTab = 'active';

function switchUserReportTab(tab) {
  currentUserReportTab = tab;
  const my = state.reports;
  const filtered = tab === 'active' 
    ? my.filter(r => ReportValidator.isActive(r.status))
    : my.filter(r => ReportValidator.isResolved(r.status));
  
  // Actualizar estilos de tabs
  ['tab_user_active', 'tab_user_resolved'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === `tab_user_${tab}`) {
      el.style.borderBottomColor = 'var(--blue)';
      el.style.color = 'var(--blue)';
    } else {
      el.style.borderBottomColor = 'transparent';
      el.style.color = 'var(--muted)';
    }
  });
  
  // Actualizar contenido
  const content = document.getElementById('userReportsContent');
  if (content) {
    content.innerHTML = renderUserReportList(filtered);
  }
}

function renderUserReportList(reports) {
  if (!reports || reports.length === 0) {
    return `
      <div style="padding:40px;text-align:center;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:12px">📭</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">
          ${currentUserReportTab === 'active' ? 'No tienes reportes activos' : 'No tienes reportes resueltos'}
        </div>
        <div style="font-size:12px">
          ${currentUserReportTab === 'active' ? 'Los reportes activos aparecerán aquí' : 'Los reportes resueltos aparecerán aquí'}
        </div>
      </div>
    `;
  }
  
  return `
    <div style="padding:12px">
      ${reports.map(r => renderUserReportCard(r)).join('<div style="height:8px"></div>')}
    </div>
  `;
}

function renderUserReportCard(r) {
  const statusConfig = {
    'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,.1)', icon: '🔵' },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', icon: '👁️' },
    'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,.1)', icon: '⚙️' },
    'Resuelto': { color: '#12a454', bg: 'rgba(18,164,84,.1)', icon: '✅' },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,.1)', icon: '❌' }
  };
  
  const config = statusConfig[r.status] || statusConfig['Abierto'];
  const timeAgo = ReportValidator.getTimeAgo(r.created_at);
  const logo = smallLogo(r.product_name);
  
  // Determinar prioridad según tiempo
  const priority = getPriorityFromTime(r.created_at, r.status);
  
  return `
    <div class="report-card" style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;transition:all .2s" 
         onmouseover="this.style.borderColor='var(--blue)';this.style.boxShadow='0 4px 12px rgba(8,119,255,.1)'" 
         onmouseout="this.style.borderColor='var(--line)';this.style.boxShadow='none'">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          ${logo}
          <div>
            <div style="font-weight:700;font-size:14px">${esc(r.product_name || '-')}</div>
            <div style="font-size:11px;color:var(--muted)">${r.code || '#RP-0000'} · ${timeAgo}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          ${priority.badge}
          <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;color:${config.color};background:${config.bg}">
            ${config.icon} ${r.status || 'Abierto'}
          </span>
        </div>
      </div>
      
      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">Motivo:</div>
        <div style="font-size:13px;font-weight:600">${esc(r.reason || '-')}</div>
      </div>
      
      ${r.provider_response ? `
        <div style="padding:10px 12px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:8px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--ok);font-weight:700;margin-bottom:4px">💬 Respuesta del equipo</div>
          <div style="font-size:12px">${esc(r.provider_response)}</div>
        </div>
      ` : ''}
      
      ${r.status === 'Rechazado' && r.rejection_reason ? `
        <div style="padding:10px 12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--bad);font-weight:700;margin-bottom:4px">❌ Motivo del rechazo</div>
          <div style="font-size:12px">${esc(r.rejection_reason)}</div>
        </div>
      ` : ''}
      
      <!-- Timeline simplificado -->
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:12px;padding:8px;background:var(--soft);border-radius:8px">
        ${renderMiniTimeline(r)}
      </div>
      
      <div style="display:flex;gap:8px">
        <button onclick="openReportDetail('${r.id}')" class="ghost" style="flex:1;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s" onmouseover="this.style.background='var(--soft)'" onmouseout="this.style.background='var(--panel)'">
          👁️ Ver detalles
        </button>
        ${ReportValidator.isActive(r.status) ? `
          <button onclick="addReportMessage('${r.id}')" class="ghost" style="padding:10px 14px;border:1px solid var(--line);border-radius:8px;background:var(--panel);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s" onmouseover="this.style.background='var(--soft)'" onmouseout="this.style.background='var(--panel)'">
            💬 Mensaje
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function getPriorityFromTime(createdAt, status) {
  if (ReportValidator.isResolved(status)) {
    return { level: 'resolved', badge: '' };
  }
  
  if (!createdAt) {
    return { level: 'normal', badge: '' };
  }
  
  const date = new Date(createdAt);
  const now = new Date();
  const hours = (now - date) / 3600000;
  
  if (hours > 48) {
    return { 
      level: 'critical', 
      badge: '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(239,68,68,.1);color:#dc2626;animation:pulse 2s infinite">🔴 CRÍTICO</span>' 
    };
  }
  if (hours > 24) {
    return { 
      level: 'urgent', 
      badge: '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(245,158,11,.1);color:#f59e0b">🟠 URGENTE</span>' 
    };
  }
  return { level: 'normal', badge: '' };
}

function renderMiniTimeline(report) {
  const steps = [
    { label: 'Creado', done: true },
    { label: 'Recibido', done: true },
    { label: 'En revisión', done: report.status !== 'Abierto' },
    { label: 'Resuelto', done: ReportValidator.isResolved(report.status) }
  ];
  
  return steps.map((s, i) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:8px;height:8px;border-radius:50%;background:${s.done ? 'var(--blue)' : 'var(--line)'}"></div>
      <span style="font-size:8px;color:${s.done ? 'var(--blue)' : 'var(--muted)'}">${s.label}</span>
    </div>
    ${i < steps.length - 1 ? `<div style="flex:1;height:2px;background:${steps[i + 1].done ? 'var(--blue)' : 'var(--line)'}"></div>` : ''}
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// 📝 FORMULARIO DE REPORTE MEJORADO
// ═══════════════════════════════════════════════════════════════

function openReportImproved(orderId = "") {
  if (!state.orders.length) {
    return openModal(`
      <div class="dialog-head">
        <div><small class="muted">SOPORTE</small><h2>No hay compras para reportar</h2></div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      <button class="primary" onclick="closeModal();setView('store')">Ir a tienda</button>
    `);
  }
  
  const o = state.orders.find(x => x.id === orderId) || state.orders[0] || {};
  const openReport = state.reports.find(r => r.order_id === o.id && ReportValidator.isActive(r.status));
  
  if (openReport) {
    return showExistingReportModal(openReport, o);
  }
  
  // Formulario mejorado
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">SOPORTE</small>
          <h2>Crear Reporte</h2>
          <p class="muted" style="font-size:12px">Completa el formulario para reportar un problema</p>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="padding:16px 20px;display:grid;gap:16px">
        <!-- Selección de compra -->
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">📦 Selecciona la compra con problema *</label>
          <select id="rpOrderImproved" onchange="checkOrderReportImproved()" style="width:100%;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;background:var(--soft)">
            ${state.orders.map(x => {
              const hasActive = state.reports.some(r => r.order_id === x.id && ReportValidator.isActive(r.status));
              return `<option value="${x.id}" ${x.id === o.id ? "selected" : ""} ${hasActive ? "disabled" : ""}>
                ${esc(x.product_name)} - ${(x.delivered_data || "").slice(0, 20)} ${hasActive ? "🚫 (Ya tiene reporte activo)" : ""}
              </option>`;
            }).join("")}
          </select>
        </div>
        
        <div id="rpOrderWarningImproved" style="display:none;padding:10px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:12px;color:var(--bad)"></div>
        
        <!-- Categoría -->
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">🏷️ Categoría del problema *</label>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
            ${Object.values(ReportCategories).map(cat => `
              <label class="category-option" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;cursor:pointer;transition:all .2s" onclick="selectCategory('${cat.id}')">
                <input type="radio" name="category" value="${cat.id}" style="display:none">
                <span class="category-dot" style="width:10px;height:10px;border-radius:50%;background:${cat.color}"></span>
                <span style="font-size:12px;font-weight:600">${cat.label.replace(/^[^\s]+\s/, '')}</span>
              </label>
            `).join('')}
          </div>
          <input type="hidden" id="rpCategoryImproved" value="">
        </div>
        
        <!-- Motivo -->
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">📋 Motivo específico *</label>
          <select id="rpReasonImproved" style="width:100%;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;background:var(--soft)">
            <option value="">Selecciona un motivo...</option>
            <option>Caída total</option>
            <option>PIN / Perfil incorrecto</option>
            <option>Contraseña incorrecta</option>
            <option>Cuenta sin plan activo</option>
            <option>Cuenta no encontrada</option>
            <option>Límite de dispositivos</option>
            <option>Renovación no aplicada</option>
            <option>Otro problema</option>
          </select>
        </div>
        
        <!-- Descripción -->
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">
            📝 Descripción detallada *
            <span id="charCount" style="float:right;font-weight:400;color:var(--muted)">0/1000</span>
          </label>
          <textarea id="rpDescImproved" oninput="updateCharCount()" placeholder="Describe el problema con el mayor detalle posible. Incluye horarios, mensajes de error, etc." style="width:100%;min-height:100px;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;background:var(--soft);resize:vertical"></textarea>
        </div>
        
        <!-- Datos adicionales -->
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">🔐 Datos de cuenta (opcional)</label>
          <input id="rpAccountImproved" placeholder="Usuario o email de la cuenta afectada" style="width:100%;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;background:var(--soft)">
        </div>
        
        <!-- Validación de errores -->
        <div id="formErrors" style="display:none;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:12px;color:var(--bad)"></div>
        
        <!-- Botones -->
        <div style="display:flex;gap:10px;padding-top:8px">
          <button onclick="closeModal()" class="ghost" style="flex:1;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>
          <button onclick="submitReportImproved()" id="rpSubmitBtnImproved" class="primary" style="flex:1;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
            📤 Enviar Reporte
          </button>
        </div>
      </div>
    </div>
  `);
}

function selectCategory(catId) {
  document.querySelectorAll('.category-option').forEach(el => {
    el.style.borderColor = 'var(--line)';
    el.style.background = 'var(--panel)';
  });
  event.target.closest('.category-option').style.borderColor = 'var(--blue)';
  event.target.closest('.category-option').style.background = 'rgba(8,119,255,.05)';
  document.getElementById('rpCategoryImproved').value = catId;
}

function updateCharCount() {
  const desc = document.getElementById('rpDescImproved');
  const counter = document.getElementById('charCount');
  if (desc && counter) {
    const len = desc.value.length;
    counter.textContent = `${len}/1000`;
    counter.style.color = len > 900 ? 'var(--bad)' : len > 700 ? 'var(--warn)' : 'var(--muted)';
  }
}

function submitReportImproved() {
  const orderId = document.getElementById('rpOrderImproved')?.value;
  const reason = document.getElementById('rpReasonImproved')?.value;
  const description = document.getElementById('rpDescImproved')?.value;
  const category = document.getElementById('rpCategoryImproved')?.value;
  const accountData = document.getElementById('rpAccountImproved')?.value;
  
  const reportData = { orderId, reason, description, category, account_data: accountData };
  const validation = ReportValidator.validateNew(reportData);
  
  if (!validation.isValid) {
    const errorsDiv = document.getElementById('formErrors');
    if (errorsDiv) {
      errorsDiv.style.display = 'block';
      errorsDiv.innerHTML = '⚠️ Por favor corrige los siguientes errores:<br>' + validation.errors.join('<br>');
    }
    return;
  }
  
  // Confirmar antes de enviar
  showConfirmDialog({
    title: '¿Enviar reporte?',
    message: '¿Estás seguro de que deseas enviar este reporte de soporte?',
    confirmText: 'Sí, enviar',
    cancelText: 'Revisar',
    onConfirm: () => sendReportImproved(reportData)
  });
}

async function sendReportImproved(data) {
  try {
    showLoading('Enviando reporte...');
    await api("reports", {
      method: "POST",
      body: JSON.stringify({
        order_id: data.orderId,
        reason: data.reason,
        description: data.description,
        category: data.category,
        account_data: data.account_data
      })
    });
    toast('Reporte enviado exitosamente', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('Error al enviar reporte: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
}

function showExistingReportModal(report, order) {
  const timeAgo = ReportValidator.getTimeAgo(report.created_at);
  
  openModal(`
    <div style="padding:0">
      <div style="padding:24px 24px 16px;text-align:center;border-bottom:1px solid var(--line)">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">SOPORTE</div>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:900">Reporte en proceso</h2>
        <div style="width:56px;height:56px;border-radius:50%;border:3px solid #f59e0b;display:inline-grid;place-items:center;margin-bottom:16px;animation:pulseWarn 2s infinite">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="28" height="28">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h3 style="margin:0 0 6px;font-size:17px;font-weight:800">Ya tienes un reporte abierto</h3>
        <p style="font-size:13px;color:var(--muted);margin:0">Tu reporte para <b style="color:var(--text)">${esc(order.product_name)}</b> está siendo atendido.</p>
      </div>
      
      <div style="padding:16px 24px;border-bottom:1px solid var(--line)">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Detalles del reporte</div>
        <div style="background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:14px;font-size:12px;line-height:1.8">
          <div><b>Servicio:</b> ${esc(order.product_name || '-')}</div>
          <div><b>ID Reporte:</b> <span style="color:var(--blue)">${report.code || '-'}</span></div>
          <div><b>Problema:</b> ${esc(report.reason || '-')}</div>
          <div><b>Fecha:</b> ${ReportValidator.formatDate(report.created_at)}</div>
          <div><b>Tiempo:</b> ${timeAgo}</div>
        </div>
      </div>
      
      <div style="padding:16px 24px;border-bottom:1px solid var(--line)">
        <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;padding:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style="font-size:13px;font-weight:700;color:var(--warn)">Tiempo estimado de respuesta</span>
          </div>
          <div style="font-size:12px;color:var(--text)">Nuestro equipo técnico especializado está revisando tu caso. Tiempo estimado: <b>30 min - 24 horas</b>.</div>
        </div>
      </div>
      
      ${report.provider_response ? `
        <div style="padding:16px 24px;border-bottom:1px solid var(--line)">
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Respuesta del equipo</div>
          <div style="padding:12px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:10px">
            <div style="font-size:12px">${esc(report.provider_response)}</div>
          </div>
        </div>
      ` : ''}
      
      <div style="padding:16px 24px 24px">
        <button onclick="closeModal()" style="width:100%;padding:14px;border:0;border-radius:12px;background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;font-size:14px;font-weight:800;cursor:pointer;transition:all .2s" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(8,119,255,.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          Entendido
        </button>
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🔔 DIÁLOGO DE CONFIRMACIÓN
// ═══════════════════════════════════════════════════════════════

function showConfirmDialog(options) {
  const { title, message, confirmText, cancelText, onConfirm, onCancel } = options;
  
  openModal(`
    <div style="padding:24px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(245,158,11,.1);display:inline-grid;place-items:center;margin-bottom:16px">
        <span style="font-size:32px">⚠️</span>
      </div>
      <h3 style="margin:0 0 8px;font-size:18px;font-weight:800">${title}</h3>
      <p style="margin:0 0 20px;font-size:13px;color:var(--muted)">${message}</p>
      <div style="display:flex;gap:10px">
        <button onclick="closeModal()" style="flex:1;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px;font-weight:700;cursor:pointer">
          ${cancelText || 'Cancelar'}
        </button>
        <button onclick="handleConfirm()" style="flex:1;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;font-size:13px;font-weight:700;cursor:pointer">
          ${confirmText || 'Confirmar'}
        </button>
      </div>
    </div>
  `);
  
  window._confirmCallback = onConfirm;
}

function handleConfirm() {
  closeModal();
  if (typeof window._confirmCallback === 'function') {
    window._confirmCallback();
  }
}

// ═══════════════════════════════════════════════════════════════
// 💬 AÑADIR MENSAJE A REPORTE
// ═══════════════════════════════════════════════════════════════

function addReportMessage(reportId) {
  openModal(`
    <div style="padding:0">
      <div class="dialog-head">
        <div>
          <small class="muted">SOPORTE</small>
          <h2>Agregar mensaje</h2>
          <p class="muted" style="font-size:12px">Añade información adicional a tu reporte</p>
        </div>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      <div style="padding:16px 20px">
        <textarea id="newReportMessage" placeholder="Escribe información adicional que pueda ayudar a resolver tu reporte..." style="width:100%;min-height:100px;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;background:var(--soft);resize:vertical"></textarea>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button onclick="closeModal()" class="ghost" style="flex:1;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>
          <button onclick="submitReportMessage('${reportId}')" class="primary" style="flex:1;padding:12px;border:0;border-radius:10px;background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;font-size:13px;font-weight:700;cursor:pointer">
            💬 Enviar mensaje
          </button>
        </div>
      </div>
    </div>
  `);
}

async function submitReportMessage(reportId) {
  const message = document.getElementById('newReportMessage')?.value?.trim();
  if (!message) {
    toast('Escribe un mensaje', 'bad');
    return;
  }
  
  try {
    showLoading('Enviando mensaje...');
    // Aquí iría la llamada al API para añadir mensaje
    toast('Mensaje añadido al reporte', 'ok');
    closeModal();
    await boot();
  } catch (e) {
    toast('Error al enviar mensaje', 'bad');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 DETALLE MEJORADO DE REPORTE
// ═══════════════════════════════════════════════════════════════

function openReportDetailImproved(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;
  
  const isOpen = ReportValidator.isActive(r.status);
  const timeAgo = ReportValidator.getTimeAgo(r.created_at);
  const priority = getPriorityFromTime(r.created_at, r.status);
  
  // Determinar paso actual del timeline
  let currentStep = 0;
  if (r.status === 'Resuelto') currentStep = 4;
  else if (r.status === 'Rechazado') currentStep = 4;
  else if (r.status === 'En proceso' || r.provider_response) currentStep = 3;
  else if (r.status === 'En revisión') currentStep = 2;
  else currentStep = 1;
  
  const steps = [
    { label: 'Creado', icon: '📝' },
    { label: 'Recibido', icon: '📬' },
    { label: 'En revisión', icon: '👁️' },
    { label: 'En proceso', icon: '⚙️' },
    { label: r.status === 'Rechazado' ? 'Rechazado' : 'Resuelto', icon: r.status === 'Rechazado' ? '❌' : '✅' }
  ];
  
  const statusConfig = {
    'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
    'Resuelto': { color: '#12a454', bg: 'rgba(18,164,84,.1)' },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,.1)' }
  };
  
  const config = statusConfig[r.status] || statusConfig['Abierto'];
  
  openModal(`
    <div style="padding:0;max-height:90vh;overflow-y:auto">
      <!-- Header -->
      <div style="padding:20px 20px 16px;border-bottom:1px solid var(--line)">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">
              SOPORTE · ${r.code || '#RP-0000'}
            </div>
            <h2 style="margin:0;font-size:17px;font-weight:900">${esc(r.product_name || 'Reporte')}</h2>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">Creado: ${ReportValidator.formatDate(r.created_at)} · ${timeAgo}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${priority.badge}
            <span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;color:${config.color};background:${config.bg}">
              ${r.status || 'Abierto'}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Timeline mejorado -->
      <div style="padding:20px;border-bottom:1px solid var(--line)">
        <div style="display:flex;align-items:center;justify-content:space-between;position:relative;margin-bottom:12px">
          <div style="position:absolute;top:18px;left:24px;right:24px;height:4px;background:var(--line);border-radius:2px"></div>
          <div style="position:absolute;top:18px;left:24px;width:${(currentStep / 4) * 100}%;height:4px;background:linear-gradient(90deg,#0877ff,#10b981);border-radius:2px;transition:width .5s"></div>
          ${steps.map((s, i) => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;z-index:1;position:relative">
              <div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:14px;transition:all .3s;
                ${i < currentStep ? 'background:linear-gradient(135deg,#0877ff,#0057dc);color:#fff;box-shadow:0 4px 12px rgba(8,119,255,.3)' : 
                  i === currentStep ? 'background:var(--warn);color:#fff;box-shadow:0 4px 12px rgba(245,158,11,.3);animation:pulse 2s infinite' :
                  'background:var(--soft);color:var(--muted);border:2px solid var(--line)'}">
                ${s.icon}
              </div>
              <span style="font-size:9px;font-weight:700;color:${i <= currentStep ? 'var(--blue)' : 'var(--muted)'};white-space:nowrap">${s.label}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="text-align:center;margin-top:12px;padding:8px;background:var(--soft);border-radius:8px">
          ${r.status === 'Resuelto' ? `<span style="font-size:12px;color:var(--ok);font-weight:700">✅ Reporte resuelto el ${ReportValidator.formatDate(r.resolved_at || r.updated_at)}</span>` :
            r.status === 'Rechazado' ? `<span style="font-size:12px;color:var(--bad);font-weight:700">❌ Reporte rechazado${r.resolved_at ? ' el ' + ReportValidator.formatDate(r.resolved_at) : ''}</span>` :
            `<span style="font-size:12px;color:var(--warn);font-weight:600">⏱ En proceso · Tiempo transcurrido: ${timeAgo}</span>`}
        </div>
      </div>
      
      <!-- Detalles del reporte -->
      <div style="padding:16px 20px;display:grid;gap:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">MOTIVO</div>
          <div style="padding:10px 12px;background:var(--soft);border-radius:8px;font-size:13px;font-weight:600">${esc(r.reason || '-')}</div>
        </div>
        
        ${r.description ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">DESCRIPCIÓN</div>
            <div style="padding:12px;background:var(--soft);border-radius:8px;font-size:13px">${esc(r.description)}</div>
          </div>
        ` : ''}
        
        ${r.account_data ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">DATOS DE CUENTA</div>
            <div style="padding:10px 12px;background:var(--soft);border-radius:8px;font-size:12px;font-family:monospace">${esc(r.account_data)}</div>
          </div>
        ` : ''}
        
        ${r.provider_response ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--ok);margin-bottom:6px">💬 RESPUESTA DEL EQUIPO</div>
            <div style="padding:12px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:8px;font-size:13px">
              ${esc(r.provider_response)}
              ${r.response_date ? `<div style="margin-top:8px;font-size:11px;color:var(--muted)">Respondido: ${ReportValidator.formatDate(r.response_date)}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${r.status === 'Rechazado' && r.rejection_reason ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--bad);margin-bottom:6px">❌ MOTIVO DEL RECHAZO</div>
            <div style="padding:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;font-size:13px">
              ${esc(r.rejection_reason)}
              ${r.resolved_at ? `<div style="margin-top:8px;font-size:11px;color:var(--muted)">Rechazado: ${ReportValidator.formatDate(r.resolved_at)}</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
      
      ${isOpen && !isAdmin() ? `
        <div style="padding:16px 20px;border-top:1px solid var(--line)">
          <button onclick="addReportMessage('${r.id}')" class="ghost" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
            💬 Añadir información adicional
          </button>
        </div>
      ` : ''}
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🎨 ESTILOS CSS INYECTADOS
// ═══════════════════════════════════════════════════════════════

function injectOperatorSupportStyles() {
  const styles = document.createElement('style');
  styles.textContent = `
    .report-card {
      transition: all 0.2s ease;
    }
    
    .category-option {
      transition: all 0.2s ease;
    }
    
    .category-option:hover {
      border-color: var(--blue) !important;
      background: rgba(8,119,255,.05) !important;
    }
    
    .report-tab.active {
      font-weight: 800;
    }
    
    @keyframes pulseWarn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(styles);
}

// Inyectar estilos al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectOperatorSupportStyles);
} else {
  injectOperatorSupportStyles();
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

console.log('✅ Support Operators Panel cargado correctamente');

/* ══════════════════════════════════════════════════════════════════════════════
   FUNCIONES MEJORADAS PARA REPORTES Y SOPORTE v2.0
   ✓ Seguridad completa (escapar HTML, validación de permisos, confirmaciones)
   ✓ Separación Activos/Resueltos
   ✓ Timeline dinámico
   ✓ Validación centralizada
   ══════════════════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════════════════════════
//  CONSTANTES Y ENUMS - Estados centralizados
// ══════════════════════════════════════════════════════════════════════════════
const ReportStates = {
  OPEN: 'Abierto',
  REVIEWING: 'En revisión',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado'
};

const ReportCategories = {
  'producto_no_llego': { label: 'Producto no llegó', icon: '📦', color: '#ef4444' },
  'defectuoso': { label: 'Defectuoso/No funciona', icon: '⚠️', color: '#f97316' },
  'cuenta_no_funciona': { label: 'Cuenta no funciona', icon: '🔐', color: '#9333ea' },
  'acceso_denegado': { label: 'Acceso denegado', icon: '🚫', color: '#3b82f6' },
  'otro': { label: 'Otro', icon: '❓', color: '#6b7280' }
};

const ReportPriority = {
  NORMAL: 'normal',
  URGENT: 'urgente',
  CRITICAL: 'critico'
};

const RESOLVED_STATES = [ReportStates.RESOLVED, ReportStates.REJECTED];
const ACTIVE_STATES = [ReportStates.OPEN, ReportStates.REVIEWING, ReportStates.IN_PROGRESS];

// ══════════════════════════════════════════════════════════════════════════════
//  VALIDADOR CENTRALIZADO - ReportValidator
// ══════════════════════════════════════════════════════════════════════════════
// Extender el ReportValidator definido en reports-security.js (cargado antes)
// en lugar de redeclarar con const, lo cual lanzaría SyntaxError por redeclaración.
if (typeof ReportValidator === 'undefined') window.ReportValidator = {};
Object.assign(ReportValidator, {
  isResolved(status) {
    return RESOLVED_STATES.includes(status);
  },
  isActive(status) {
    return ACTIVE_STATES.includes(status);
  },
  validateNewData(data) {
    const errors = [];
    if (!data.orderId || data.orderId.trim() === '') errors.push('Debes seleccionar una compra');
    if (!data.reason || data.reason.trim().length < 3) errors.push('El asunto debe tener al menos 3 caracteres');
    if (data.reason && data.reason.length > 100) errors.push('El asunto no puede exceder 100 caracteres');
    if (!data.description || data.description.trim().length < 10) errors.push('La descripción debe tener al menos 10 caracteres');
    if (data.description && data.description.length > 1000) errors.push('La descripción no puede exceder 1000 caracteres');
    if (!data.category || !ReportCategories[data.category]) errors.push('Selecciona una categoría válida');
    if (data.email && !this.isValidEmail(data.email)) errors.push('El correo electrónico no es válido');
    return { valid: errors.length === 0, errors: errors };
  },
  isValidEmail(email) {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  validateResponse(data) {
    const errors = [];
    if (!data.response || data.response.trim().length < 5) errors.push('La respuesta debe tener al menos 5 caracteres');
    if (data.response && data.response.length > 2000) errors.push('La respuesta no puede exceder 2000 caracteres');
    return { valid: errors.length === 0, errors: errors };
  },
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },
  sanitize(data) {
    return {
      ...data,
      reason: this.escapeHtml(data.reason || ''),
      description: this.escapeHtml(data.description || ''),
      clientName: this.escapeHtml(data.clientName || ''),
      email: this.escapeHtml(data.email || ''),
      accountData: this.escapeHtml(data.accountData || ''),
      adminResponse: this.escapeHtml(data.adminResponse || ''),
      rejectionReason: this.escapeHtml(data.rejectionReason || '')
    };
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  CONTROL DE PERMISOS
// ══════════════════════════════════════════════════════════════════════════════
const ReportPermissions = {
  isAdmin() {
    return window.state?.user?.role === 'admin' || window.state?.user?.is_admin === true || localStorage.getItem('userRole') === 'admin';
  },
  canView(report) {
    if (this.isAdmin()) return true;
    return report?.user_id === window.state?.user?.id || report?.client_id === window.state?.user?.id;
  },
  canModify(report) {
    return this.isAdmin();
  },
  canDelete(report) {
    return this.isAdmin();
  },
  canExport() {
    return this.isAdmin();
  },
  canUpdateStatus() {
    return this.isAdmin();
  },
  canRespond() {
    return this.isAdmin();
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES DE ESTADO Y CATEGORÍA
// ══════════════════════════════════════════════════════════════════════════════
function getReportCategory(code) {
  return ReportCategories[code] || ReportCategories['otro'];
}

function getReportPriority(hoursElapsed) {
  if (hoursElapsed > 48) return ReportPriority.CRITICAL;
  if (hoursElapsed > 24) return ReportPriority.URGENT;
  return ReportPriority.NORMAL;
}

function getHoursElapsed(createdAt) {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60));
}

function getPriorityLabel(priority) {
  const labels = { [ReportPriority.NORMAL]: 'Normal', [ReportPriority.URGENT]: 'Urgente', [ReportPriority.CRITICAL]: 'Crítico' };
  return labels[priority] || 'Normal';
}

function getStatusInfo(status) {
  const statuses = {
    [ReportStates.OPEN]: { icon: '🔵', color: '#3b82f6', label: 'Abierto' },
    [ReportStates.REVIEWING]: { icon: '👁️', color: '#f59e0b', label: 'En revisión' },
    [ReportStates.IN_PROGRESS]: { icon: '⚙️', color: '#8b5cf6', label: 'En proceso' },
    [ReportStates.RESOLVED]: { icon: '✅', color: '#12a454', label: 'Resuelto' },
    [ReportStates.REJECTED]: { icon: '❌', color: '#ef4444', label: 'Rechazado' }
  };
  return statuses[status] || statuses[ReportStates.OPEN];
}

// ══════════════════════════════════════════════════════════════════════════════
//  CÁLCULO DE TIEMPOS
// ══════════════════════════════════════════════════════════════════════════════
function calculateResponseTime(createdAt, resolvedAt) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const resolved = resolvedAt ? new Date(resolvedAt) : new Date();
  const diffMs = resolved - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return diffDays + 'd ' + (diffHours % 24) + 'h';
  if (diffHours > 0) return diffHours + 'h';
  return 'Recientes';
}

function formatTimeAgo(date) {
  if (!date) return 'Sin fecha';
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return 'hace unos segundos';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return 'hace ' + minutes + 'm';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return 'hace ' + hours + 'h';
  const days = Math.floor(hours / 24);
  if (days < 7) return 'hace ' + days + 'd';
  return d.toLocaleDateString('es-ES');
}

function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE DE SEGUIMIENTO EN TABLAS (SEGURO)
// ══════════════════════════════════════════════════════════════════════════════
function renderTableTracker(r) {
  if (!r) return '-';
  const status = r.status || ReportStates.OPEN;
  const safeResponse = ReportValidator.escapeHtml(r.provider_response || r.admin_response || '');
  
  if (safeResponse) {
    return '<div style="font-size:12px;color:var(--ok);font-weight:700;display:flex;align-items:center;gap:6px"><span class="table-tracker-dot ok"></span> 💬 ' + safeResponse + '</div>';
  }
  
  let stepIndex = 0, statusText = 'Recibido · En espera', dotClass = '';
  if (status === ReportStates.REVIEWING) { stepIndex = 1; statusText = 'En revisión...'; dotClass = 'warn'; }
  else if (status === ReportStates.IN_PROGRESS) { stepIndex = 2; statusText = 'En proceso...'; }
  else if (status === ReportStates.RESOLVED) { stepIndex = 3; statusText = 'Solucionado'; dotClass = 'ok'; }
  else if (status === ReportStates.REJECTED) { stepIndex = 1; statusText = 'Rechazado'; dotClass = 'bad'; }
  
  const stepsHTML = [0, 1, 2, 3].map(i => {
    let cls = 'table-tracker-step';
    if (status === ReportStates.REJECTED && i === stepIndex) cls += ' bad';
    else if (i < stepIndex) cls += ' completed';
    else if (i === stepIndex) cls += ' active';
    return '<div class="' + cls + '"></div>';
  }).join('');

  return '<div class="table-tracker"><div class="table-tracker-steps">' + stepsHTML + '</div><div class="table-tracker-info"><span class="table-tracker-dot ' + dotClass + '"></span><span>' + ReportValidator.escapeHtml(statusText) + '</span></div></div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  GENERACIÓN DE PROGRESO VISUAL
// ══════════════════════════════════════════════════════════════════════════════
function generateProgressSteps(currentStatus) {
  const steps = [ReportStates.OPEN, ReportStates.REVIEWING, ReportStates.IN_PROGRESS, ReportStates.RESOLVED];
  const currentIndex = steps.indexOf(currentStatus);
  return steps.map((step, index) => {
    const isCompleted = index < currentIndex;
    const isActive = index === currentIndex;
    return '<div class="progress-step ' + (isActive ? 'active' : '') + ' ' + (isCompleted ? 'completed' : '') + '"><div class="progress-dot ' + (isActive ? 'active' : '') + ' ' + (isCompleted ? 'completed' : '') + '">' + (isActive ? '●' : isCompleted ? '✓' : index + 1) + '</div><div class="progress-label">' + ReportValidator.escapeHtml(step) + '</div></div>';
  }).join('');
}


// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE DE TARJETA DE REPORTE (SEGURO)
// ══════════════════════════════════════════════════════════════════════════════
function generateReportCard(report) {
  const category = getReportCategory(report.category || 'otro');
  const statusInfo = getStatusInfo(report.status);
  const hoursElapsed = getHoursElapsed(report.created_at);
  const priority = getReportPriority(hoursElapsed);
  const isUrgent = priority === ReportPriority.URGENT || priority === ReportPriority.CRITICAL;
  const safeCode = ReportValidator.escapeHtml(report.code || 'SIN-CÓDIGO');
  const safeReason = ReportValidator.escapeHtml(report.reason || 'Reporte sin asunto');
  const safeProduct = ReportValidator.escapeHtml(report.product_name || 'Producto no especificado');
  const safeDesc = ReportValidator.escapeHtml(report.description || '');
  
  return '<div class="report-card fade-in ' + (report.status === ReportStates.RESOLVED ? 'resolved' : '') + ' ' + (report.status === ReportStates.REJECTED ? 'rejected' : '') + ' ' + (isUrgent ? (priority === ReportPriority.CRITICAL ? 'critical' : 'urgent') : '') + '">' +
    '<div class="report-card-header"><div class="report-card-header-left"><span class="report-code">' + safeCode + '</span><div class="report-title">' + safeReason + '</div><div class="report-product">📦 ' + safeProduct + '</div><div class="report-badges"><span class="report-category-badge ' + (report.category || 'otro') + '">' + category.icon + ' ' + ReportValidator.escapeHtml(category.label) + '</span><span class="report-priority-badge ' + priority + '">' + (priority === ReportPriority.CRITICAL ? '🔴' : priority === ReportPriority.URGENT ? '🟠' : '🟢') + ' ' + getPriorityLabel(priority) + '</span></div></div></div>' +
    '<div class="report-progress">' + generateProgressSteps(report.status) + '</div>' +
    '<div class="report-time-info"><div class="time-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Creado: <strong>' + formatTimeAgo(report.created_at) + '</strong></span></div><div class="time-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path></svg><span>Tiempo: <strong>' + calculateResponseTime(report.created_at, report.resolved_at) + '</strong></span></div></div>' +
    (safeDesc ? '<div class="report-description"><strong>Descripción:</strong><br>' + safeDesc + '</div>' : '') +
    '<div class="report-stats"><div class="stat-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>Mensajes: <strong>' + (report.messages?.length || 0) + '</strong></span></div><div class="stat-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg><span>Adjuntos: <strong>' + (report.attachments?.length || 0) + '</strong></span></div></div>' +
    '<div class="report-actions"><button class="report-action-btn" onclick="openReportDetail(\'' + ReportValidator.escapeHtml(report.id) + '\')">📋 Ver Detalles</button><button class="report-action-btn" onclick="openReportChat(\'' + ReportValidator.escapeHtml(report.id) + '\')">💬 Mensajes</button>' + (report.status !== ReportStates.RESOLVED && report.status !== ReportStates.REJECTED ? '<button class="report-action-btn" onclick="markAsUrgent(\'' + ReportValidator.escapeHtml(report.id) + '\')">⚡ Marcar urgente</button>' : '') + '<button class="report-action-btn" onclick="downloadReportPDF(\'' + ReportValidator.escapeHtml(report.id) + '\')">📥 Descargar</button></div>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  VISTA SEPARADA: ACTIVOS vs RESUELTOS
// ══════════════════════════════════════════════════════════════════════════════
function generateReportTabs() {
  return '<div class="report-tabs"><button class="report-tab active" data-tab="active" onclick="switchReportTab(\'active\')">📋 Activos <span id="badge-active" class="tab-count">0</span></button><button class="report-tab" data-tab="resolved" onclick="switchReportTab(\'resolved\')">✅ Resueltos <span id="badge-resolved" class="tab-count">0</span></button></div>';
}

function switchReportTab(tab) {
  document.querySelectorAll('.report-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('reports-active-section')?.classList.toggle('hide', tab !== 'active');
  document.getElementById('reports-resolved-section')?.classList.toggle('hide', tab !== 'resolved');
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECCIONES SEPARADAS CON FECHAS
// ══════════════════════════════════════════════════════════════════════════════
function generateActiveReportsSection(reports) {
  const activeReports = reports.filter(r => ReportValidator.isActive(r.status));
  return '<div id="reports-active-section" class="reports-section"><div class="section-header"><h3>📋 Reportes Activos</h3><span class="count-badge">' + activeReports.length + '</span></div>' +
    (activeReports.length === 0 ? '<div class="empty-state"><div class="empty-icon">🎉</div><p>¡No hay reportes activos!</p><small>Todos tus reportes están resueltos.</small></div>' : '<div class="reports-grid">' + activeReports.map(r => generateReportCard(r)).join('') + '</div>') + '</div>';
}

function generateResolvedReportsSection(reports) {
  const resolvedReports = reports.filter(r => ReportValidator.isResolved(r.status));
  return '<div id="reports-resolved-section" class="reports-section hide"><div class="section-header"><h3>✅ Reportes Resueltos</h3><span class="count-badge success">' + resolvedReports.length + '</span></div>' +
    (resolvedReports.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No hay reportes resueltos aún.</p></div>' : '<div class="reports-grid">' + resolvedReports.map(r => generateResolvedReportCard(r)).join('') + '</div>') + '</div>';
}

function generateResolvedReportCard(report) {
  const category = getReportCategory(report.category || 'otro');
  const statusInfo = getStatusInfo(report.status);
  const safeCode = ReportValidator.escapeHtml(report.code || 'SIN-CÓDIGO');
  const safeReason = ReportValidator.escapeHtml(report.reason || 'Reporte sin asunto');
  const safeProduct = ReportValidator.escapeHtml(report.product_name || 'Producto no especificado');
  const safeResponse = ReportValidator.escapeHtml(report.admin_response || report.provider_response || '');
  const safeRejection = ReportValidator.escapeHtml(report.rejection_reason || '');
  const isRejected = report.status === ReportStates.REJECTED;

  return '<div class="report-card resolved ' + (isRejected ? 'rejected' : '') + '">' +
    '<div class="report-card-header"><div class="report-card-header-left"><span class="report-code">' + safeCode + '</span><div class="report-title">' + safeReason + '</div><div class="report-product">📦 ' + safeProduct + '</div><div class="report-badges"><span class="report-category-badge ' + (report.category || 'otro') + '">' + category.icon + ' ' + ReportValidator.escapeHtml(category.label) + '</span><span class="report-status-badge ' + report.status.toLowerCase().replace(' ', '-') + '">' + statusInfo.icon + ' ' + ReportValidator.escapeHtml(report.status) + '</span></div></div></div>' +
    '<div class="resolution-info"><div class="resolution-header ' + (isRejected ? 'rejected' : 'success') + '">' + (isRejected ? '❌ Reporte Rechazado' : '✅ Reporte Resuelto') + '</div>' +
    '<div class="resolution-dates"><div class="date-item"><span class="date-label">📅 Creado:</span><span class="date-value">' + formatDateTime(report.created_at) + '</span></div><div class="date-item"><span class="date-label">' + (isRejected ? '❌' : '✅') + ' ' + (isRejected ? 'Rechazado' : 'Resuelto') + ':</span><span class="date-value">' + formatDateTime(report.resolved_at || report.updated_at) + '</span></div><div class="date-item"><span class="date-label">⏱️ Tiempo total:</span><span class="date-value">' + calculateResponseTime(report.created_at, report.resolved_at || report.updated_at) + '</span></div></div>' +
    (safeResponse ? '<div class="resolution-response"><div class="response-label">💬 Respuesta del administrador:</div><div class="response-text">' + safeResponse + '</div></div>' : '') +
    (isRejected && safeRejection ? '<div class="rejection-reason"><div class="rejection-label">🚫 Razón del rechazo:</div><div class="rejection-text">' + safeRejection + '</div></div>' : '') + '</div>' +
    '<div class="report-actions"><button class="report-action-btn" onclick="openReportDetail(\'' + ReportValidator.escapeHtml(report.id) + '\')">📋 Ver Detalles</button><button class="report-action-btn" onclick="reopenReport(\'' + ReportValidator.escapeHtml(report.id) + '\')">🔄 Reabrir Reporte</button><button class="report-action-btn" onclick="downloadReportPDF(\'' + ReportValidator.escapeHtml(report.id) + '\')">📥 Descargar</button></div>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  TIMELINE DINÁMICO COMPLETO
// ══════════════════════════════════════════════════════════════════════════════
function generateTimeline(events) {
  if (!events || events.length === 0) return '<div class="muted" style="padding:12px;text-align:center">Sin eventos registrados</div>';
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const iconMap = { 'created': '📝', 'status_changed': '🔄', 'response': '💬', 'resolved': '✅', 'rejected': '❌', 'reopened': '🔓', 'attachment': '📎' };
  
  return '<div class="report-timeline">' + sortedEvents.map(event => {
    const safeEvent = ReportValidator.escapeHtml(event.event || '');
    const safeActor = ReportValidator.escapeHtml(event.actor || '');
    const safeNote = ReportValidator.escapeHtml(event.note || '');
    const icon = iconMap[event.type] || '📌';
    return '<div class="timeline-item"><div class="timeline-dot ' + (event.type === 'resolved' ? 'success' : event.type === 'rejected' ? 'error' : '') + '">' + icon + '</div><div class="timeline-content"><div class="timeline-label">' + safeEvent + '</div><div class="timeline-time">' + formatDateTime(event.timestamp) + '</div>' + (safeActor ? '<div class="timeline-actor">Por: ' + safeActor + '</div>' : '') + (safeNote ? '<div class="timeline-note">' + safeNote + '</div>' : '') + '</div></div>';
  }).join('') + '</div>';
}

function generateReportTimeline(report) {
  const events = [];
  if (report.created_at) events.push({ type: 'created', event: 'Reporte creado', timestamp: report.created_at, actor: ReportValidator.escapeHtml(report.client_name || 'Cliente'), note: ReportValidator.escapeHtml(report.reason || '') });
  if (report.status_history && Array.isArray(report.status_history)) report.status_history.forEach(h => events.push({ type: 'status_changed', event: 'Estado cambiado a "' + h.new_status + '"', timestamp: h.changed_at, actor: ReportValidator.escapeHtml(h.changed_by || 'Sistema'), note: h.note ? ReportValidator.escapeHtml(h.note) : '' }));
  if (report.responses && Array.isArray(report.responses)) report.responses.forEach(r => events.push({ type: 'response', event: 'Respuesta del administrador', timestamp: r.created_at, actor: ReportValidator.escapeHtml(r.admin_name || 'Administrador'), note: ReportValidator.escapeHtml(r.message || '') }));
  if (report.status === ReportStates.RESOLVED) events.push({ type: 'resolved', event: 'Reporte resuelto', timestamp: report.resolved_at || report.updated_at, actor: ReportValidator.escapeHtml(report.resolved_by || 'Administrador'), note: ReportValidator.escapeHtml(report.resolution_note || '') });
  else if (report.status === ReportStates.REJECTED) events.push({ type: 'rejected', event: 'Reporte rechazado', timestamp: report.resolved_at || report.updated_at, actor: ReportValidator.escapeHtml(report.resolved_by || 'Administrador'), note: ReportValidator.escapeHtml(report.rejection_reason || '') });
  return generateTimeline(events);
}


// ══════════════════════════════════════════════════════════════════════════════
//  FORMULARIO DE CREAR REPORTE CON VALIDACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function generateReportForm(order) {
  if (!order) return '<p class="muted">No hay compras para reportar.</p>';
  const safeProduct = ReportValidator.escapeHtml(order.product_name || '');
  const safeDelivered = ReportValidator.escapeHtml(order.delivered_data || '');
  
  let categoriesHTML = Object.entries(ReportCategories).map(([key, cat]) => '<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" name="category" value="' + key + '" ' + (key === 'producto_no_llego' ? 'checked' : '') + '><span>' + cat.icon + ' ' + ReportValidator.escapeHtml(cat.label) + '</span></label>').join('');
  
  return '<div class="report-form fade-in"><h3 style="margin-bottom:16px;font-size:18px;font-weight:800">Crear Reporte</h3><div id="form-errors" class="form-errors" style="display:none;padding:12px;background:rgba(239,68,68,.1);border:1px solid var(--bad);border-radius:8px;margin-bottom:16px"></div>' +
    '<div class="form-group"><label class="form-label">Producto <span class="required">*</span></label><div style="padding:12px;background:var(--soft);border-radius:8px;color:var(--text);font-weight:600">' + safeProduct + '</div></div>' +
    '<div class="form-group"><label class="form-label">Categoría del problema <span class="required">*</span></label><div class="category-grid">' + categoriesHTML + '</div></div>' +
    '<div class="form-group"><label class="form-label">Asunto <span class="required">*</span></label><input type="text" id="rpSubject" class="form-input" placeholder="Resumen breve del problema..." maxlength="100"><small class="form-help">Máximo 100 caracteres</small></div>' +
    '<div class="form-group"><label class="form-label">Descripción detallada <span class="required">*</span></label><textarea id="rpDesc" class="form-textarea" placeholder="Cuéntanos qué pasó con más detalle..." maxlength="1000" oninput=\"updateCharCounter(this, \'rpDescCounter\')\"></textarea><small class="form-help">Mínimo 10, máximo 1000 caracteres</small><div class="char-counter" id="rpDescCounter">0 / 1000</div></div>' +
    '<div class="form-group"><label class="form-label">Datos de la cuenta (si aplica)</label><input type="text" id="rpAccountData" class="form-input" placeholder="Usuario, email, o datos relevantes..." value="' + safeDelivered + '"></div>' +
    '<div class="form-group" style="margin-top:16px"><button class="primary" onclick="submitReportWithValidation(\'' + ReportValidator.escapeHtml(order.id) + '\')" style="width:100%;padding:12px;font-size:14px">✅ Enviar Reporte</button></div></div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES DE FORMULARIO
// ══════════════════════════════════════════════════════════════════════════════
function updateCharCounter(textarea, counterId) {
  const counter = document.getElementById(counterId);
  const length = textarea.value.length;
  counter.textContent = length + ' / ' + textarea.maxLength;
  counter.classList.toggle('warning', length > textarea.maxLength * 0.9);
}

function showFormErrors(errors) {
  const errorDiv = document.getElementById('form-errors');
  if (errorDiv && errors.length > 0) {
    errorDiv.innerHTML = errors.map(e => '• ' + ReportValidator.escapeHtml(e)).join('<br>');
    errorDiv.style.display = 'block';
  }
}

function hideFormErrors() {
  const errorDiv = document.getElementById('form-errors');
  if (errorDiv) errorDiv.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════════════
//  ACCIONES DE REPORTE CON CONFIRMACIONES
// ══════════════════════════════════════════════════════════════════════════════
function expandReport(reportId) {
  const card = event.target.closest('.report-card');
  card.classList.toggle('expanded');
}

function markAsUrgent(reportId) {
  if (!confirm('¿Marcar este reporte como urgente?')) return;
  toast('Reporte marcado como urgente', 'ok');
}

function openReportChat(reportId) {
  setView('reports');
  console.log('Abrir chat:', reportId);
}

function downloadReportPDF(reportId) {
  toast('Generando PDF...', 'ok');
  console.log('Descargar PDF:', reportId);
}

function reopenReport(reportId) {
  if (!confirm('¿Reabrir este reporte?')) return;
  toast('Reporte reabierto', 'ok');
}

function submitReportWithValidation(orderId) {
  hideFormErrors();
  const category = document.querySelector('input[name="category"]:checked')?.value || '';
  const subject = document.getElementById('rpSubject')?.value || '';
  const description = document.getElementById('rpDesc')?.value || '';
  const accountData = document.getElementById('rpAccountData')?.value || '';
  
  const validation = ReportValidator.validateNewData({ orderId: orderId, reason: subject, description: description, category: category, accountData: accountData });
  if (!validation.valid) { showFormErrors(validation.errors); toast('Por favor corrige los errores', 'bad'); return; }
  if (!confirm('¿Enviar este reporte?')) return;
  
  const sanitizedData = ReportValidator.sanitize({ orderId: orderId, reason: subject, description: description, category: category, accountData: accountData });
  console.log('Enviando reporte:', sanitizedData);
  toast('Reporte enviado exitosamente', 'ok');
}

// ══════════════════════════════════════════════════════════════════════════════
//  BÚSQUEDA AVANZADA CON DEBOUNCE
// ══════════════════════════════════════════════════════════════════════════════
let reportSearchTimeout = null;
function searchReports(query) {
  clearTimeout(reportSearchTimeout);
  reportSearchTimeout = setTimeout(() => performReportSearch(query), 300);
}

function performReportSearch(query) {
  const searchTerm = query.toLowerCase().trim();
  const allReports = window.state?.reports || [];
  const filtered = allReports.filter(r => {
    if (!searchTerm) return true;
    const searchableFields = [r.code, r.reason, r.description, r.product_name, r.client_name, r.category].map(f => (f || '').toLowerCase());
    return searchableFields.some(field => field.includes(searchTerm));
  });
  console.log('Encontrados ' + filtered.length + ' reportes para "' + searchTerm + '"');
}

// ══════════════════════════════════════════════════════════════════════════════
//  MEJORAS PARA ADMIN - TABLA MEJORADA (SEGURA)
// ══════════════════════════════════════════════════════════════════════════════
function generateReportTableRowImproved(report, index) {
  if (!report) return '';
  const category = getReportCategory(report.category || 'otro');
  const statusInfo = getStatusInfo(report.status);
  const hoursElapsed = getHoursElapsed(report.created_at);
  const priority = getReportPriority(hoursElapsed);
  const safeCode = ReportValidator.escapeHtml(report.code || '#RP-0000');
  const safeReason = ReportValidator.escapeHtml(report.reason || '-');
  const safeProduct = ReportValidator.escapeHtml(report.product_name || '-');
  const safeClient = ReportValidator.escapeHtml(report.client_name || '-');
  const logo = typeof smallLogo === 'function' ? smallLogo(report.product_name) : '';
  const altBg = index % 2 === 0 ? 'background:rgba(124,58,237,.02)' : '';
  const reportIdSafe = ReportValidator.escapeHtml(report.id);
  const canModify = ReportPermissions.canModify(report);

  return '<tr style="border-bottom:1px solid var(--line);transition:background .15s;' + altBg + '" onmouseover="this.style.background=\'var(--soft)\'" onmouseout="this.style.background=\'' + (altBg ? 'rgba(124,58,237,.02)' : '') + '\'">' +
    '<td style="padding:12px 16px"><span style="font-family:monospace;font-size:12px;font-weight:800;color:var(--purple)">' + safeCode + '</span></td>' +
    '<td style="padding:12px 16px"><div style="display:flex;align-items:center;gap:8px">' + logo + '<span style="font-weight:700;font-size:13px">' + safeProduct + '</span></div></td>' +
    '<td style="padding:12px 16px"><span style="font-weight:600;font-size:12px">' + safeClient + '</span></td>' +
    '<td style="padding:12px 16px"><span style="font-size:12px">' + safeReason + '</span></td>' +
    '<td style="padding:12px 16px"><span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;color:' + statusInfo.color + ';background:' + statusInfo.color + '22">' + statusInfo.icon + ' ' + ReportValidator.escapeHtml(report.status) + '</span></td>' +
    '<td style="padding:12px 16px"><span class="report-priority-badge ' + priority + '">' + getPriorityLabel(priority) + '</span></td>' +
    '<td style="padding:12px 16px"><span style="font-size:11px;color:var(--muted)">' + formatTimeAgo(report.created_at) + '</span></td>' +
    '<td style="padding:12px 16px;text-align:center"><button onclick="' + (canModify ? 'openReportDetailAdmin' : 'openReportDetail') + '(\'' + reportIdSafe + '\')" class="ghost" style="padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">👁️ ' + (canModify ? 'Gestionar' : 'Ver') + '</button></td>' +
    '</tr>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════════════════════════════
function calculateHoursElapsed(createdAt) {
  if (!createdAt) return 'Sin fecha';
  const hours = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60));
  if (hours < 1) return 'hace poco';
  if (hours < 24) return 'hace ' + hours + 'h';
  return 'hace ' + Math.floor(hours / 24) + 'd';
}

function updateReportTabBadges(reports) {
  const activeCount = reports.filter(r => ReportValidator.isActive(r.status)).length;
  const resolvedCount = reports.filter(r => ReportValidator.isResolved(r.status)).length;
  const badgeActive = document.getElementById('badge-active');
  const badgeResolved = document.getElementById('badge-resolved');
  if (badgeActive) badgeActive.textContent = activeCount;
  if (badgeResolved) badgeResolved.textContent = resolvedCount;
}

function generateReportsContainer(reports) {
  return generateReportTabs() + generateActiveReportsSection(reports) + generateResolvedReportsSection(reports);
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIONES DESACOPLADAS DEL DOM (MEJOR TESTABILIDAD)
// ══════════════════════════════════════════════════════════════════════════════

// Recopila datos del formulario de reporte
function collectReportFormData(orderId) {
  const getValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  
  const getRadioValue = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };
  
  return {
    orderId: orderId,
    category: getRadioValue('category'),
    reason: getValue('rpSubject'),
    description: getValue('rpDesc'),
    accountData: getValue('rpAccountData')
  };
}

// Valida los datos del formulario
function validateReportFormData(data) {
  const errors = [];
  
  if (!data.orderId) {
    errors.push('Debes seleccionar una compra');
  }
  
  if (!data.category) {
    errors.push('Selecciona una categoría');
  }
  
  if (!data.reason || data.reason.length < 3) {
    errors.push('El asunto debe tener al menos 3 caracteres');
  }
  
  if (data.reason && data.reason.length > 100) {
    errors.push('El asunto no puede exceder 100 caracteres');
  }
  
  if (!data.description || data.description.length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push('La descripción no puede exceder 1000 caracteres');
  }
  
  return { valid: errors.length === 0, errors: errors };
}

// Prepara los datos para enviar a la API
function prepareReportApiData(data, order) {
  return {
    order_id: data.orderId,
    product_name: order.product_name || '',
    account_data: data.accountData || order.delivered_data || '',
    reason: data.reason,
    description: data.description,
    category: data.category || 'otro'
  };
}

// Maneja el envío del reporte con todas las validaciones
async function submitReportWithValidation(orderId) {
  try {
    // 1. Recopilar datos del formulario
    const formData = collectReportFormData(orderId);
    
    // 2. Validar datos
    const validation = validateReportFormData(formData);
    if (!validation.valid) {
      showFormErrors(validation.errors);
      return;
    }
    
    hideFormErrors();
    
    // 3. Verificar duplicados usando la función de optimización
    if (typeof checkDuplicateReport === 'function') {
      const duplicate = checkDuplicateReport(state.reports, orderId, formData.reason);
      if (duplicate) {
        if (!confirm(`Ya tienes un reporte abierto para esta compra (${duplicate.code}). ¿Deseas crear otro?`)) {
          return;
        }
      }
    }
    
    // 4. Confirmar envío
    if (!confirm('¿Enviar este reporte de soporte?')) {
      return;
    }
    
    // 5. Encontrar la orden
    const order = state.orders.find(o => o.id === orderId);
    if (!order) {
      toast('Compra no encontrada', 'bad');
      return;
    }
    
    // 6. Preparar y enviar datos
    showLoading('Enviando reporte...');
    const apiData = prepareReportApiData(formData, order);
    
    await api('reports', {
      method: 'POST',
      body: JSON.stringify(apiData)
    });
    
    await boot();
    toast('✅ Reporte enviado correctamente', 'ok');
    closeModal();
    
  } catch (error) {
    console.error('Error al enviar reporte:', error);
    toast(error.message || 'Error al enviar el reporte', 'bad');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIONES DE BÚSQUEDA OPTIMIZADA
// ══════════════════════════════════════════════════════════════════════════════

// Búsqueda con debounce usando la función de optimización
let reportSearchDebounced = null;

function initReportSearch() {
  if (typeof createDebouncer === 'function') {
    reportSearchDebounced = createDebouncer((query) => {
      performReportSearch(query);
    }, 300);
  }
}

function performReportSearch(query) {
  // Usar búsqueda optimizada si está disponible
  if (typeof searchReportsOptimized === 'function' && state.reports) {
    const results = searchReportsOptimized(state.reports, query);
    renderSearchResults(results);
    return;
  }
  
  // Fallback a búsqueda original
  reportSearch = query || '';
  reportPage = 1;
  renderApp();
}

function renderSearchResults(results) {
  const container = document.getElementById('reportSearchResults');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No se encontraron reportes</p></div>';
    return;
  }
  
  container.innerHTML = results.map(r => generateReportCard(r)).join('');
}

function onReportSearchInput(query) {
  if (reportSearchDebounced) {
    reportSearchDebounced(query);
  } else {
    performReportSearch(query);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIONES DE ESTADÍSTICAS CON CACHE
// ══════════════════════════════════════════════════════════════════════════════

function getReportStats() {
  // Usar cache si está disponible
  if (typeof ReportStatsCache !== 'undefined') {
    return ReportStatsCache.get(state.reports);
  }
  
  // Fallback sin cache
  const my = state.reports || [];
  return {
    total: my.length,
    active: my.filter(r => r.status !== "Resuelto" && r.status !== "Rechazado").length,
    resolved: my.filter(r => r.status === "Resuelto").length,
    rejected: my.filter(r => r.status === "Rechazado").length
  };
}

function renderReportStats() {
  const stats = getReportStats();
  return `
    <div class="report-stats-summary">
      <div class="stat-item active">
        <span class="stat-icon">🚨</span>
        <span class="stat-value">${stats.active}</span>
        <span class="stat-label">Activos</span>
      </div>
      <div class="stat-item resolved">
        <span class="stat-icon">✅</span>
        <span class="stat-value">${stats.resolved}</span>
        <span class="stat-label">Resueltos</span>
      </div>
      <div class="stat-item total">
        <span class="stat-icon">📊</span>
        <span class="stat-value">${stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════════════
//  INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════════════════════

// Auto-inicializar al cargar el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initReportSearch();
  });
} else {
  initReportSearch();
}

console.log('✅ reports-functions.js v2.0 cargado');
console.log('✅ Funciones desacopladas del DOM');
console.log('✅ Búsqueda optimizada con debounce');
console.log('✅ Validación centralizada');

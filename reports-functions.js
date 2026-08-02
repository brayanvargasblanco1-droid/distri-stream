/* ══════════════════════════════════════════════════════════════════════════════
   FUNCIONES MEJORADAS PARA REPORTES Y SOPORTE
   ══════════════════════════════════════════════════════════════════════════════ */

// ─── UTILIDADES DE ESTADO Y CATEGORÍA ───
function getReportCategory(code) {
  const categories = {
    'producto_no_llego': { label: 'Producto no llegó', icon: '📦', color: '#ef4444' },
    'defectuoso': { label: 'Defectuoso/No funciona', icon: '⚠️', color: '#f97316' },
    'cuenta_no_funciona': { label: 'Cuenta no funciona', icon: '🔐', color: '#9333ea' },
    'acceso_denegado': { label: 'Acceso denegado', icon: '🚫', color: '#3b82f6' },
    'otro': { label: 'Otro', icon: '❓', color: '#6b7280' }
  };
  return categories[code] || categories['otro'];
}

function getReportPriority(hoursElapsed) {
  if (hoursElapsed > 48) return 'critico';
  if (hoursElapsed > 24) return 'urgente';
  return 'normal';
}

function getPriorityLabel(priority) {
  return { 'normal': 'Normal', 'urgente': 'Urgente', 'critico': 'Crítico' }[priority] || 'Normal';
}

function getStatusInfo(status) {
  const statuses = {
    'Abierto': { icon: '🔵', color: '#3b82f6', label: 'Abierto' },
    'En revisión': { icon: '👁️', color: '#f59e0b', label: 'En revisión' },
    'En proceso': { icon: '⚙️', color: '#8b5cf6', label: 'En proceso' },
    'Resuelto': { icon: '✅', color: '#12a454', label: 'Resuelto' },
    'Rechazado': { icon: '❌', color: '#ef4444', label: 'Rechazado' }
  };
  return statuses[status] || statuses['Abierto'];
}

// ─── COMPONENTE DE SEGUIMIENTO ANIMADO EN TABLAS ───
function renderTableTracker(r) {
  if (!r) return '-';
  const status = r.status || 'Abierto';
  const safeResponse = typeof escapeHTML === 'function' ? escapeHTML(r.provider_response || '') : (r.provider_response || '');
  
  if (safeResponse) {
    return `<div style="font-size:12px;color:var(--ok);font-weight:700;display:flex;align-items:center;gap:6px">
      <span class="table-tracker-dot ok"></span> 💬 ${safeResponse}
    </div>`;
  }
  
  let stepIndex = 0;
  let statusText = 'Recibido · En espera';
  let dotClass = '';
  
  if (status === 'En revisión') {
    stepIndex = 1;
    statusText = 'En revisión por el equipo...';
    dotClass = 'warn';
  } else if (status === 'En proceso') {
    stepIndex = 2;
    statusText = 'En proceso de solución...';
    dotClass = '';
  } else if (status === 'Resuelto') {
    stepIndex = 3;
    statusText = 'Solucionado con éxito';
    dotClass = 'ok';
  } else if (status === 'Rechazado') {
    stepIndex = 1;
    statusText = 'Solicitud rechazada';
    dotClass = 'bad';
  }
  
  const stepsHTML = [0, 1, 2, 3].map(i => {
    let cls = 'table-tracker-step';
    if (status === 'Rechazado' && i === stepIndex) cls += ' bad';
    else if (i < stepIndex) cls += ' completed';
    else if (i === stepIndex) cls += ' active';
    return `<div class="${cls}"></div>`;
  }).join('');

  return `
    <div class="table-tracker">
      <div class="table-tracker-steps">
        ${stepsHTML}
      </div>
      <div class="table-tracker-info">
        <span class="table-tracker-dot ${dotClass}"></span>
        <span>${statusText}</span>
      </div>
    </div>
  `;
}

// ─── CÁLCULO DE TIEMPOS ───
function calculateResponseTime(createdAt, resolvedAt) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const resolved = resolvedAt ? new Date(resolvedAt) : new Date();
  const diffMs = resolved - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  return `${diffHours}h`;
}

function formatTimeAgo(date) {
  if (!date) return 'Sin fecha';
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return 'hace unos segundos';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  
  return d.toLocaleDateString('es-ES');
}

function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ─── GENERACIÓN DE PROGRESO VISUAL ───
function generateProgressSteps(currentStatus) {
  const steps = ['Abierto', 'En revisión', 'En proceso', 'Resuelto'];
  const currentIndex = steps.indexOf(currentStatus);
  
  return steps.map((step, index) => {
    const isCompleted = index < currentIndex;
    const isActive = index === currentIndex;
    const info = getStatusInfo(step);
    
    return `
      <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
        <div class="progress-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
          ${isActive ? '●' : isCompleted ? '✓' : index + 1}
        </div>
        <div class="progress-label">${step}</div>
      </div>
    `;
  }).join('');
}

// ─── COMPONENTE DE TARJETA DE REPORTE ───
function generateReportCard(report) {
  const category = getReportCategory(report.category || 'otro');
  const statusInfo = getStatusInfo(report.status);
  const hoursElapsed = calculateResponseTime(report.created_at, report.updated_at);
  const priority = getReportPriority(new Date() - new Date(report.created_at));
  
  const isUrgent = priority === 'urgente' || priority === 'critico';
  
  return `
    <div class="report-card fade-in ${report.status === 'Resuelto' ? 'resolved' : ''} ${report.status === 'Rechazado' ? 'rejected' : ''} ${isUrgent ? (priority === 'critico' ? 'critical' : 'urgent') : ''}">
      <div class="report-card-header">
        <div class="report-card-header-left">
          <span class="report-code">${report.code || 'SIN-CÓDIGO'}</span>
          <div class="report-title">${report.reason || 'Reporte sin asunto'}</div>
          <div class="report-product">📦 ${report.product_name || 'Producto no especificado'}</div>
          <div class="report-badges">
            <span class="report-category-badge ${report.category || 'otro'}">${category.icon} ${category.label}</span>
            <span class="report-priority-badge ${priority}">${priority === 'critico' ? '🔴' : priority === 'urgente' ? '🟠' : '🟢'} ${getPriorityLabel(priority)}</span>
          </div>
        </div>
      </div>

      <div class="report-progress">
        ${generateProgressSteps(report.status)}
      </div>

      <div class="report-time-info">
        <div class="time-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Creado: <strong>${formatTimeAgo(report.created_at)}</strong></span>
        </div>
        <div class="time-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
          </svg>
          <span>Tiempo: <strong>${hoursElapsed}</strong></span>
        </div>
      </div>

      ${report.description ? `
        <div class="report-description">
          <strong>Descripción:</strong><br>
          ${report.description}
        </div>
      ` : ''}

      <div class="report-stats">
        <div class="stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Mensajes: <strong>${(report.messages?.length || 0)}</strong></span>
        </div>
        <div class="stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Adjuntos: <strong>${(report.attachments?.length || 0)}</strong></span>
        </div>
        <div class="stat-item">
          <span>${statusInfo.icon} Estado: <strong>${report.status}</strong></span>
        </div>
      </div>

      <div class="report-actions">
        <button class="report-action-btn primary" onclick="expandReport('${report.id}')">
          📋 Ver detalles
        </button>
        <button class="report-action-btn" onclick="openReportChat('${report.id}')">
          💬 Mensajes
        </button>
        ${report.status !== 'Resuelto' && report.status !== 'Rechazado' ? `
          <button class="report-action-btn" onclick="markAsUrgent('${report.id}')">
            ⚡ Marcar urgente
          </button>
        ` : ''}
        <button class="report-action-btn" onclick="downloadReportPDF('${report.id}')">
          📥 Descargar
        </button>
      </div>
    </div>
  `;
}

// ─── FORMULARIO DE CREAR REPORTE MEJORADO ───
function generateReportForm(order = null) {
  if (!order) return '<p class="muted">No hay compras para reportar.</p>';
  
  return `
    <div class="report-form fade-in">
      <h3 style="margin-bottom:16px;font-size:18px;font-weight:800">Crear Reporte</h3>
      
      <div class="form-group">
        <label class="form-label">Producto <span class="required">*</span></label>
        <div style="padding:12px;background:var(--soft);border-radius:8px;color:var(--text);font-weight:600">
          ${order.product_name}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Categoría del problema <span class="required">*</span></label>
        <div class="category-grid">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="category" value="producto_no_llego" checked>
            <span>📦 No llegó</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="category" value="defectuoso">
            <span>⚠️ Defectuoso</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="category" value="cuenta_no_funciona">
            <span>🔐 No funciona</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="category" value="acceso_denegado">
            <span>🚫 Sin acceso</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="category" value="otro">
            <span>❓ Otro</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Asunto <span class="required">*</span></label>
        <input type="text" id="rpSubject" class="form-input" placeholder="Resumen breve del problema..." maxlength="100">
        <small class="form-help">Máximo 100 caracteres</small>
      </div>

      <div class="form-group">
        <label class="form-label">Descripción detallada <span class="required">*</span></label>
        <textarea id="rpDesc" class="form-textarea" placeholder="Cuéntanos qué pasó con más detalle... Incluye pasos que seguiste, mensajes de error, etc." maxlength="1000" oninput="updateCharCounter(this, 'rpDescCounter')"></textarea>
        <small class="form-help">Proporciona la máxima información posible</small>
        <div class="char-counter" id="rpDescCounter">0 / 1000</div>
      </div>

      <div class="form-group">
        <label class="form-label">Datos de la cuenta (si aplica)</label>
        <input type="text" id="rpAccountData" class="form-input" placeholder="Usuario, email, o datos relevantes..." value="${order.delivered_data || ''}">
        <small class="form-help">Esto ayuda al admin a investigar más rápido</small>
      </div>

      <div class="attachments-section">
        <div class="attachment-label">📸 Adjunta evidencia (opcional)</div>
        <div class="attachment-dropzone" id="dropzone" onclick="document.getElementById('fileInput').click()">
          <div class="attachment-icon">📁</div>
          <div class="attachment-text">Arrastra archivos aquí o haz clic</div>
          <div class="attachment-hint">Imágenes de error, screenshots, etc.</div>
        </div>
        <input type="file" id="fileInput" style="display:none" multiple accept="image/*,.pdf">
        <div class="attachment-list" id="fileList"></div>
      </div>

      <div class="form-group" style="margin-top:16px">
        <button class="primary" onclick="submitReportImproved('${order.id}')" style="width:100%;padding:12px;font-size:14px">
          ✅ Enviar Reporte
        </button>
      </div>
    </div>
  `;
}

// ─── UTILIDADES DE FORMULARIO ───
function updateCharCounter(textarea, counterId) {
  const counter = document.getElementById(counterId);
  const length = textarea.value.length;
  counter.textContent = `${length} / ${textarea.maxLength}`;
  
  if (length > textarea.maxLength * 0.9) {
    counter.classList.add('warning');
  } else {
    counter.classList.remove('warning');
  }
}

// ─── ACCIONES DE REPORTE ───
function expandReport(reportId) {
  const card = event.target.closest('.report-card');
  card.classList.toggle('expanded');
}

function markAsUrgent(reportId) {
  // Implementar marcación como urgente
  toast('Reporte marcado como urgente', 'ok');
  // Llamar API para actualizar
}

function openReportChat(reportId) {
  setView('reports');
  // Implementar modal de chat
  console.log('Abrir chat del reporte:', reportId);
}

function downloadReportPDF(reportId) {
  // Implementar descarga de PDF
  toast('Descargando reporte...', 'ok');
  console.log('Descargar PDF del reporte:', reportId);
}

function submitReportImproved(orderId) {
  const category = document.querySelector('input[name="category"]:checked')?.value || 'otro';
  const subject = document.getElementById('rpSubject')?.value;
  const description = document.getElementById('rpDesc')?.value;
  
  if (!subject || !description) {
    toast('Por favor completa todos los campos requeridos', 'bad');
    return;
  }
  
  // Aquí va la lógica de envío
  console.log('Enviando reporte mejorado:', { orderId, category, subject, description });
}

// ─── TIMELINE DE EVENTOS ───
function generateTimeline(events = []) {
  if (!events || events.length === 0) {
    return '<div class="muted" style="padding:12px;text-align:center">Sin eventos registrados</div>';
  }
  
  return `
    <div class="report-timeline">
      ${events.map(event => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-label">${event.event}</div>
            <div class="timeline-time">${formatDateTime(event.timestamp)}</div>
            ${event.actor ? `<div class="timeline-time">Por: ${event.actor}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── MEJORAS PARA ADMIN ───
function generateReportTableRowImproved(report) {
  const category = getReportCategory(report.category || 'otro');
  const statusInfo = getStatusInfo(report.status);
  const priority = getReportPriority(new Date() - new Date(report.created_at));
  
  return `
    <tr>
      <td>
        <div style="font-weight:700;margin-bottom:4px">${report.code}</div>
        <div style="font-size:11px;color:var(--muted)">${formatTimeAgo(report.created_at)}</div>
      </td>
      <td>${report.client_name || '-'}</td>
      <td>${category.icon} ${category.label}</td>
      <td><div style="word-break:break-word">${report.reason || '-'}</div></td>
      <td>
        <span style="display:inline-block;padding:6px 10px;background:${statusInfo.color}33;color:${statusInfo.color};border-radius:6px;font-size:11px;font-weight:700">
          ${statusInfo.icon} ${report.status}
        </span>
      </td>
      <td>
        <span class="report-priority-badge ${priority}">${getPriorityLabel(priority)}</span>
      </td>
      <td>
        <button class="report-action-btn primary" onclick="openReportDetail('${report.id}')" style="width:auto">
          Ver
        </button>
      </td>
    </tr>
  `;
}

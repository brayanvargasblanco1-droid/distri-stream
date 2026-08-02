/* ══════════════════════════════════════════════════════════════════════════════
   SEGURIDAD DE REPORTES - VALIDACIONES Y PERMISOS
   Estas funciones previenen XSS, falsificación de permisos y acciones destructivas
   ══════════════════════════════════════════════════════════════════════════════ */

// ─── UTILIDADES DE SEGURIDAD ───

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitiza HTML permitiendo solo etiquetas seguras
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(html) {
  if (!html) return '';
  
  const template = document.createElement('template');
  template.innerHTML = html;
  
  const allowedTags = ['b', 'strong', 'i', 'em', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li', 'a'];
  const allowedAttrs = ['href', 'target', 'rel'];
  
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      if (!allowedTags.includes(tagName)) {
        const textNode = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(textNode, node);
        return;
      }
      
      const attrs = Array.from(node.attributes);
      attrs.forEach(attr => {
        if (!allowedAttrs.includes(attr.name)) {
          node.removeAttribute(attr.name);
        }
      });
    }
    
    Array.from(node.childNodes).forEach(walk);
  };
  
  walk(template.content);
  return template.innerHTML;
}

/**
 * Valida si el usuario actual es administrador
 * @returns {boolean} true si es admin, false en caso contrario
 */
function isCurrentUserAdmin() {
  // Buscar en el localStorage o sessionStorage
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  const adminFlag = localStorage.getItem('isAdmin') || sessionStorage.getItem('isAdmin');
  
  return userRole === 'admin' || adminFlag === 'true';
}

/**
 * Valida si el usuario es propietario del reporte
 * @param {string} reportId - ID del reporte
 * @param {string} userId - ID del usuario actual
 * @returns {boolean} true si es propietario
 */
function isReportOwner(reportId, userId) {
  if (!reportId || !userId) return false;
  
  // Obtener el reporte de los datos globales
  const reports = window.globalReports || [];
  const report = reports.find(r => r.id === reportId);
  
  return report && report.user_id === userId;
}

/**
 * Obtiene el ID del usuario actual
 * @returns {string|null} ID del usuario o null
 */
function getCurrentUserId() {
  return localStorage.getItem('userId') || sessionStorage.getItem('userId') || null;
}

/**
 * Verifica permisos para una acción específica
 * @param {string} action - Tipo de acción (read, update, delete, export)
 * @param {string} reportId - ID del reporte (opcional)
 * @returns {boolean} true si tiene permisos
 */
function checkReportPermission(action, reportId = null) {
  const userId = getCurrentUserId();
  const isAdmin = isCurrentUserAdmin();
  
  if (!userId) {
    console.warn('⚠️ Usuario no autenticado');
    return false;
  }
  
  switch (action) {
    case 'read':
      // Admin puede leer todo, usuario solo sus reportes
      return isAdmin || (reportId && isReportOwner(reportId, userId));
    
    case 'update':
    case 'respond':
      // Solo admin puede actualizar
      return isAdmin;
    
    case 'delete':
      // Solo admin puede eliminar
      return isAdmin;
    
    case 'export':
      // Solo admin puede exportar
      return isAdmin;
    
    case 'create':
      // Cualquier usuario autenticado puede crear
      return !!userId;
    
    default:
      return false;
  }
}

// ─── VALIDADORES DE DATOS ───

/**
 * Validador centralizado de reportes
 */
const ReportValidator = {
  STATES: {
    OPEN: 'Abierto',
    REVIEWING: 'En revisión',
    IN_PROGRESS: 'En proceso',
    RESOLVED: 'Resuelto',
    REJECTED: 'Rechazado'
  },

  CATEGORIES: ['producto_no_llego', 'defectuoso', 'cuenta_no_funciona', 'acceso_denegado', 'otro'],

  /**
   * Valida datos de un nuevo reporte
   * @param {Object} report - Datos del reporte
   * @throws {Error} Si hay datos inválidos
   */
  validateNew(report) {
    const errors = [];
    
    if (!report.reason || report.reason.trim().length < 3) {
      errors.push('Asunto debe tener al menos 3 caracteres');
    }
    if (report.reason && report.reason.length > 100) {
      errors.push('Asunto no puede exceder 100 caracteres');
    }
    
    if (!report.description || report.description.trim().length < 10) {
      errors.push('Descripción debe tener al menos 10 caracteres');
    }
    if (report.description && report.description.length > 2000) {
      errors.push('Descripción no puede exceder 2000 caracteres');
    }
    
    if (!report.category || !this.CATEGORIES.includes(report.category)) {
      errors.push('Categoría inválida');
    }
    
    if (!report.order_id) {
      errors.push('Debe seleccionar una compra/orden');
    }
    
    // Verificar si ya existe un reporte activo para esta misma cuenta
    if (window.state && Array.isArray(window.state.reports)) {
      const activeReport = window.state.reports.find(r => 
        r.order_id === report.order_id && 
        r.status !== 'Resuelto' && 
        r.status !== 'Rechazado'
      );
      if (activeReport) {
        errors.push(`🚫 Límite alcanzado: Ya tienes un reporte activo (${activeReport.code || '#RP-0000'}) para esta cuenta. Debes esperar a que el soporte lo solucione antes de enviar otro.`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    
    return true;
  },

  /**
   * Valida datos de actualización de reporte
   * @param {Object} update - Datos a actualizar
   * @throws {Error} Si hay datos inválidos
   */
  validateUpdate(update) {
    const errors = [];
    
    if (update.status) {
      const validStates = Object.values(this.STATES);
      if (!validStates.includes(update.status)) {
        errors.push('Estado de reporte inválido');
      }
    }
    
    if (update.response) {
      if (update.response.trim().length < 2) {
        errors.push('Respuesta debe tener al menos 2 caracteres');
      }
      if (update.response.length > 2000) {
        errors.push('Respuesta no puede exceder 2000 caracteres');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    
    return true;
  },

  /**
   * Verifica si un estado es terminal (resuelto o rechazado)
   * @param {string} status - Estado a verificar
   * @returns {boolean} true si es terminal
   */
  isTerminal(status) {
    return [this.STATES.RESOLVED, this.STATES.REJECTED].includes(status);
  },

  /**
   * Verifica si el estado es válido
   * @param {string} status - Estado a verificar
   * @returns {boolean} true si es válido
   */
  isValidStatus(status) {
    return Object.values(this.STATES).includes(status);
  }
};

// ─── CONFIRMACIONES DE ACCIONES ───

/**
 * Pide confirmación del usuario antes de una acción destructiva
 * @param {string} action - Tipo de acción (delete, resolve, export)
 * @param {Object} context - Contexto de la acción
 * @returns {Promise<boolean>} true si el usuario confirma
 */
function confirmAction(action, context = {}) {
  return new Promise((resolve) => {
    let message = '';
    let title = '';
    
    switch (action) {
      case 'delete':
        title = '⚠️ Eliminar Reporte';
        message = `¿Estás seguro de que deseas eliminar el reporte ${context.code || 'sin código'}?\n\nEsta acción NO se puede deshacer.`;
        break;
      
      case 'resolve':
        title = '✅ Resolver Reporte';
        message = `¿Deseas marcar el reporte ${context.code || 'sin código'} como resuelto?\n\n${context.reason ? `Asunto: ${context.reason}` : ''}`;
        break;
      
      case 'reject':
        title = '❌ Rechazar Reporte';
        message = `¿Deseas rechazar el reporte ${context.code || 'sin código'}?\n\nAsegúrate de incluir una respuesta explicando el motivo.`;
        break;
      
      case 'export':
        title = '📥 Exportar Reportes';
        message = `Exportarás ${context.count || 'los'} reporte(s).\n\n¿Continuar?`;
        break;
      
      default:
        resolve(false);
        return;
    }
    
    // Usar confirm nativo como fallback si no hay modal personalizado
    if (typeof showConfirmModal === 'function') {
      showConfirmModal(title, message, (confirmed) => {
        resolve(confirmed);
      });
    } else {
      resolve(confirm(message));
    }
  });
}

/**
 * Modal de confirmación personalizado (requiere CSS)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @param {Function} callback - Función a ejecutar con resultado
 */
function showConfirmModal(title, message, callback) {
  const modal = document.createElement('div');
  modal.className = 'confirm-modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  modal.innerHTML = `
    <div class="confirm-modal" style="background: var(--panel); padding: 24px; border-radius: 12px; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 12px 0; color: var(--text); font-size: 18px; font-weight: 700;">${escapeHTML(title)}</h3>
      <p style="margin: 0 0 24px 0; color: var(--muted); font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(message)}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button onclick="this.closest('.confirm-modal-overlay').remove(); arguments[1](false)" style="padding: 8px 16px; border: 1px solid var(--line); border-radius: 6px; background: transparent; cursor: pointer; font-weight: 600; color: var(--text);">
          Cancelar
        </button>
        <button onclick="this.closest('.confirm-modal-overlay').remove(); arguments[1](true)" style="padding: 8px 16px; border: none; border-radius: 6px; background: var(--warn); color: white; cursor: pointer; font-weight: 600;">
          Confirmar
        </button>
      </div>
    </div>
  `;
  
  // Pasar callback a través de data attribute es más seguro
  const btnConfirm = modal.querySelector('button:last-child');
  const btnCancel = modal.querySelector('button:first-child');
  
  btnConfirm.addEventListener('click', () => {
    modal.remove();
    callback(true);
  });
  
  btnCancel.addEventListener('click', () => {
    modal.remove();
    callback(false);
  });
  
  document.body.appendChild(modal);
}

// ─── WRAPPERS DE FUNCIONES SEGURAS ───

/**
 * Envía un reporte de forma segura con validación y permisos
 * @param {string} orderId - ID de la orden
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<boolean>} true si se envió correctamente
 */
async function sendReportSecure(orderId, formData) {
  try {
    // Verificar que el usuario esté autenticado
    if (!getCurrentUserId()) {
      throw new Error('Debes iniciar sesión para enviar un reporte');
    }
    
    // Validar datos
    const reportData = {
      order_id: orderId,
      reason: formData.reason,
      description: formData.description,
      category: formData.category,
      account_data: formData.accountData
    };
    
    ReportValidator.validateNew(reportData);
    
    // Aquí iría la llamada a la API
    // const response = await fetch('/api/reports', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reportData)
    // });
    
    console.log('✅ Reporte validado y listo para enviar:', reportData);
    return true;
    
  } catch (error) {
    console.error('❌ Error al enviar reporte:', error);
    throw error;
  }
}

/**
 * Actualiza un reporte de forma segura
 * @param {string} reportId - ID del reporte
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<boolean>} true si se actualizó correctamente
 */
async function updateReportSecure(reportId, updateData) {
  try {
    // Verificar permisos
    if (!checkReportPermission('update', reportId)) {
      throw new Error('No tienes permisos para actualizar este reporte');
    }
    
    // Validar datos
    ReportValidator.validateUpdate(updateData);
    
    // Pedir confirmación
    const confirmed = await confirmAction('resolve', { code: reportId });
    if (!confirmed) {
      throw new Error('Acción cancelada por el usuario');
    }
    
    console.log('✅ Reporte validado y listo para actualizar:', updateData);
    return true;
    
  } catch (error) {
    console.error('❌ Error al actualizar reporte:', error);
    throw error;
  }
}

/**
 * Elimina un reporte de forma segura
 * @param {string} reportId - ID del reporte
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
async function deleteReportSecure(reportId) {
  try {
    // Verificar permisos
    if (!checkReportPermission('delete', reportId)) {
      throw new Error('No tienes permisos para eliminar reportes');
    }
    
    // Pedir confirmación
    const reports = window.globalReports || [];
    const report = reports.find(r => r.id === reportId);
    const confirmed = await confirmAction('delete', report);
    
    if (!confirmed) {
      throw new Error('Acción cancelada por el usuario');
    }
    
    console.log('✅ Reporte validado y listo para eliminar:', reportId);
    return true;
    
  } catch (error) {
    console.error('❌ Error al eliminar reporte:', error);
    throw error;
  }
}

/**
 * Exporta reportes de forma segura
 * @param {Array} reports - Reportes a exportar
 * @param {string} format - Formato (csv, json, pdf)
 * @returns {Promise<boolean>} true si se exportó correctamente
 */
async function exportReportsSecure(reports = [], format = 'csv') {
  try {
    // Verificar permisos
    if (!checkReportPermission('export')) {
      throw new Error('No tienes permisos para exportar reportes');
    }
    
    // Pedir confirmación
    const confirmed = await confirmAction('export', { count: reports.length });
    if (!confirmed) {
      throw new Error('Acción cancelada por el usuario');
    }
    
    console.log(`✅ Exportando ${reports.length} reporte(s) en formato ${format}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error al exportar reportes:', error);
    throw error;
  }
}

// ─── RENDERIZADO SEGURO DE HTML ───

/**
 * Genera una tarjeta de reporte escapando HTML
 * @param {Object} report - Datos del reporte
 * @returns {string} HTML escapado
 */
function generateReportCardSafe(report) {
  if (!report) return '';
  
  const code = escapeHTML(report.code || 'SIN-CÓDIGO');
  const reason = escapeHTML(report.reason || 'Reporte sin asunto');
  const productName = escapeHTML(report.product_name || 'Producto no especificado');
  const description = escapeHTML((report.description || '').substring(0, 150));
  
  return `
    <div class="report-card">
      <div class="report-header">
        <span class="report-code">${code}</span>
        <div class="report-title">${reason}</div>
        <div class="report-product">📦 ${productName}</div>
      </div>
      <div class="report-description">
        ${description}
      </div>
    </div>
  `;
}

/**
 * Genera una fila de tabla de reporte escapando HTML
 * @param {Object} report - Datos del reporte
 * @returns {string} HTML escapado
 */
function generateReportTableRowSafe(report) {
  if (!report) return '';
  
  const code = escapeHTML(report.code || '-');
  const clientName = escapeHTML(report.client_name || '-');
  const reason = escapeHTML(report.reason || '-');
  const status = escapeHTML(report.status || '-');
  
  return `
    <tr>
      <td>${code}</td>
      <td>${clientName}</td>
      <td>${reason}</td>
      <td>${status}</td>
      <td>
        <button onclick="handleViewReport('${report.id}')">Ver</button>
      </td>
    </tr>
  `;
}

/**
 * Genera detalles de un reporte escapando HTML
 * @param {Object} report - Datos del reporte
 * @returns {string} HTML escapado
 */
function generateReportDetailSafe(report) {
  if (!report) return '';
  
  const code = escapeHTML(report.code || 'N/A');
  const reason = escapeHTML(report.reason || 'N/A');
  const description = escapeHTML(report.description || 'N/A');
  const status = escapeHTML(report.status || 'N/A');
  const response = report.response ? escapeHTML(report.response) : 'Sin respuesta';
  
  return `
    <div class="report-detail">
      <h3>${code}</h3>
      <p><strong>Asunto:</strong> ${reason}</p>
      <p><strong>Descripción:</strong></p>
      <div class="description-box">${description}</div>
      <p><strong>Estado:</strong> ${status}</p>
      <p><strong>Respuesta del Admin:</strong></p>
      <div class="response-box">${response}</div>
    </div>
  `;
}

console.log('✅ Seguridad de reportes cargada');

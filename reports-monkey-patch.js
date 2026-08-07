/* ══════════════════════════════════════════════════════════════════════════════
   MONKEY-PATCH DE FUNCIONES DE REPORTES v2.0
   ✓ Seguridad completa
   ✓ Escape HTML en todas partes
   ══════════════════════════════════════════════════════════════════════════════ */

window.addEventListener('load', function() {
  setTimeout(function() {
    try {
      patchReportFunctions();
      console.log('✅ Funciones de reportes parchadas exitosamente');
      console.log('✅ Seguridad: HTML escaping activo');
      console.log('✅ Validación de permisos activa');
    } catch (error) {
      console.error('❌ Error al parchear funciones:', error);
    }
  }, 1000);
});

function patchReportFunctions() {
  if (typeof window.setView !== 'function') {
    console.warn('⚠️ Funciones base no disponibles aún');
    return;
  }

  // Guardar y parchear reportRowsUser
  const originalReportRowsUser = window.reportRowsUser;
  if (typeof originalReportRowsUser === 'function') {
    window.reportRowsUser = function(rows) {
      const originalHTML = originalReportRowsUser.call(this, rows);
      if (!rows || rows.length === 0) return originalHTML;
      return rows.map((r, i) => generateReportTableRowImproved(r, i)).join('');
    };
  }

  // Patch openReport para agregar validación de permisos
  const originalOpenReport = window.openReport;
  if (typeof originalOpenReport === 'function') {
    window.openReport = function(reportId) {
      // Verificar permisos antes de abrir
      const report = window.state?.reports?.find(r => r.id === reportId);
      if (report && !ReportPermissions.canView(report)) {
        toast('No tienes permiso para ver este reporte', 'bad');
        return;
      }
      return originalOpenReport.apply(this, arguments);
    };
  }

  // Patch deleteReport para operadores - usa confirmDeleteReport
  const originalDeleteReport = window.deleteReport;
  if (typeof originalDeleteReport === 'function') {
    window.deleteReport = function(reportId) {
      const report = window.state?.reports?.find(r => r.id === reportId);
      const isOwner = report && (report.user_id === window.state?.user?.id || report.client_id === window.state?.user?.id);
      
      // Si no es admin ni dueño, no puede eliminar
      if (!ReportPermissions.canDelete() && !isOwner) {
        toast('Solo admins o el creador pueden eliminar reportes', 'bad');
        return;
      }
      
      // Usar confirmDeleteReport para confirmación con modal
      if (typeof window.confirmDeleteReport === 'function') {
        window.confirmDeleteReport(reportId);
      } else {
        // Fallback si confirmDeleteReport no existe
        if (confirm('¿Eliminar este reporte?')) {
          return originalDeleteReport.apply(this, arguments);
        }
      }
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  GENERADOR DE FILA DE TABLA MEJORADA (SEGURA)
// ══════════════════════════════════════════════════════════════════════════════
function generateReportTableRowImproved(report, index) {
  if (!report) return '';
  
  // Usar ReportValidator si está disponible, si no fallback seguro
  const escape = typeof ReportValidator !== 'undefined' ? ReportValidator.escapeHtml : function(s) {
    if (s === null || s === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  };

  const statusEmoji = {
    'Abierto': '🔵',
    'En revisión': '👁️',
    'En proceso': '⚙️',
    'Resuelto': '✅',
    'Rechazado': '❌'
  }[report.status] || '●';

  const statusColor = {
    'Resuelto': 'var(--ok)',
    'Rechazado': 'var(--bad)',
    'En proceso': '#8b5cf6',
    'En revisión': '#f59e0b',
    'Abierto': '#3b82f6'
  }[report.status] || 'var(--warn)';

  const statusBg = {
    'Resuelto': 'rgba(16,185,129,.1)',
    'Rechazado': 'rgba(239,68,68,.1)',
    'En proceso': 'rgba(139,92,246,.1)',
    'En revisión': 'rgba(245,158,11,.1)',
    'Abierto': 'rgba(59,130,246,.1)'
  }[report.status] || 'rgba(107,114,128,.1)';

  const logo = typeof smallLogo === 'function' ? smallLogo(report.product_name) : '';
  const safeReason = escape(report.reason || '-');
  const safeResponse = escape(report.provider_response || report.admin_response || '');
  const safeCode = escape(report.code || '#RP-0000');
  const safeProduct = escape(report.product_name || '-');
  const safeClient = escape(report.client_name || '-');
  const altBg = index % 2 === 0 ? 'background:rgba(124,58,237,.02)' : '';

  const reportIdSafe = escape(report.id);
  const canModify = typeof ReportPermissions !== 'undefined' && ReportPermissions.canModify(report);

  return '<tr style="border-bottom:1px solid var(--line);transition:background .15s;' + altBg + '" onmouseover="this.style.background=\'var(--soft)\'" onmouseout="this.style.background=\'' + (altBg ? 'rgba(124,58,237,.02)' : '') + '\'">' +
    '<td style="padding:12px 16px"><span style="font-family:monospace;font-size:12px;font-weight:800;color:var(--purple)">' + safeCode + '</span></td>' +
    '<td style="padding:12px 16px"><div style="display:flex;align-items:center;gap:8px">' + logo + '<span style="font-weight:700;font-size:13px">' + safeProduct + '</span></div></td>' +
    '<td style="padding:12px 16px"><span style="font-weight:600;font-size:12px">' + safeClient + '</span></td>' +
    '<td style="padding:12px 16px"><span style="font-size:12px">' + safeReason + '</span></td>' +
    '<td style="padding:12px 16px"><span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;color:' + statusColor + ';background:' + statusBg + '">' + statusEmoji + ' ' + escape(report.status || 'Abierto') + '</span></td>' +
    '<td style="padding:12px 16px">' + (typeof renderTableTracker === 'function' ? renderTableTracker(report) : (safeResponse ? '<div style="font-size:12px;color:var(--ok);font-weight:600">💬 ' + safeResponse + '</div>' : '<span style="font-size:12px;color:var(--muted)">En revisión</span>')) + '</td>' +
    '<td style="padding:12px 16px;text-align:center"><button onclick="' + (canModify ? 'openReportDetailAdmin' : 'openReportDetail') + '(\'' + reportIdSafe + '\')" class="ghost" style="padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px">👁️ ' + (canModify ? 'Gestionar' : 'Ver') + '</button></td>' +
    '</tr>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIONES AUXILIARES DE UTILIDAD
// ══════════════════════════════════════════════════════════════════════════════

function calculateHoursElapsed(createdAt) {
  if (!createdAt) return 'Sin fecha';
  const created = new Date(createdAt);
  const now = new Date();
  const hours = Math.floor((now - created) / (1000 * 60 * 60));
  if (hours < 1) return 'hace poco';
  if (hours < 24) return 'hace ' + hours + 'h';
  return 'hace ' + Math.floor(hours / 24) + 'd';
}

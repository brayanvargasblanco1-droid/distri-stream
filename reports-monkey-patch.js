/* ══════════════════════════════════════════════════════════════════════════════
   MONKEY-PATCH DE FUNCIONES DE REPORTES
   Este script mejora visualmente las funciones existentes sin cambiar su lógica
   ══════════════════════════════════════════════════════════════════════════════ */

// Esperar a que el app esté listo
window.addEventListener('load', function() {
  setTimeout(function() {
    try {
      patchReportFunctions();
      console.log('✅ Funciones de reportes parchadas exitosamente');
    } catch (error) {
      console.error('❌ Error al parchear funciones:', error);
    }
  }, 1000);
});

function patchReportFunctions() {
  // Verificar que las funciones necesarias existan
  if (typeof window.setView !== 'function') {
    console.warn('⚠️ Funciones base no disponibles aún');
    return;
  }

  // Guardar la función original de reportRowsUser
  const originalReportRowsUser = window.reportRowsUser;

  // Reemplazar reportRowsUser SOLO para mejorar visualmente, manteniendo la lógica
  if (typeof originalReportRowsUser === 'function') {
    window.reportRowsUser = function(rows) {
      // Llamar a la función original primero
      const originalHTML = originalReportRowsUser.call(this, rows);
      
      // Si no hay reportes, retornar lo original
      if (!rows || rows.length === 0) {
        return originalHTML;
      }
      
      // Si hay reportes, formatear como filas de tabla
      return rows.map((r, i) => generateReportTableRowImproved(r, i)).join('');
    };
  }
}

// ─── GENERADOR DE FILA DE TABLA MEJORADA ───
function generateReportTableRowImproved(report, index) {
  if (!report) return '';
  
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
  const safeReason = typeof escapeHTML === 'function' ? escapeHTML(report.reason || '-') : (report.reason || '-');
  const safeResponse = typeof escapeHTML === 'function' ? escapeHTML(report.provider_response || '') : (report.provider_response || '');
  const altBg = index % 2 === 0 ? 'background:rgba(124,58,237,.02)' : '';

  return `
    <tr style="border-bottom:1px solid var(--line);transition:background .15s;${altBg}" onmouseover="this.style.background='var(--soft)'" onmouseout="this.style.background='${altBg ? 'rgba(124,58,237,.02)' : ''}'">
      <td style="padding:12px 16px"><span style="font-family:monospace;font-size:12px;font-weight:800;color:var(--purple)">${report.code || '#RP-0000'}</span></td>
      <td style="padding:12px 16px"><div style="display:flex;align-items:center;gap:8px">${logo}<span style="font-weight:700;font-size:13px">${report.product_name || '-'}</span></div></td>
      <td style="padding:12px 16px"><span style="font-size:12px;font-weight:600">${safeReason}</span></td>
      <td style="padding:12px 16px"><span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;color:${statusColor};background:${statusBg}">${statusEmoji} ${report.status || 'Abierto'}</span></td>
      <td style="padding:12px 16px">
        ${typeof renderTableTracker === 'function' ? renderTableTracker(report) : (safeResponse ? `<div style="font-size:12px;color:var(--ok);font-weight:600">💬 ${safeResponse}</div>` : `<span style="font-size:12px;color:var(--muted)">En revisión por el equipo</span>`)}
      </td>
      <td style="padding:12px 16px;text-align:center">
        <button onclick="openReportDetail('${report.id}')" class="ghost" style="padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px">👁️ Ver</button>
      </td>
    </tr>
  `;
}

// ─── FUNCIONES AUXILIARES DE UTILIDAD ───

function calculateHoursElapsed(createdAt) {
  if (!createdAt) return 'Sin fecha';
  const created = new Date(createdAt);
  const now = new Date();
  const hours = Math.floor((now - created) / (1000 * 60 * 60));
  if (hours < 1) return 'hace poco';
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}


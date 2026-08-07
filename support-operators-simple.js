/**
 * 🎯 SOPORTE SIMPLE PARA OPERADORES Y REVENDEDORES
 * Distrito Streaming - Simple y fácil de usar
 */

// ═══════════════════════════════════════════════════════════════
// 📊 CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SupportConfig = {
  estadosActivos: ['Abierto', 'En revisión', 'En proceso'],
  estadosResueltos: ['Resuelto', 'Rechazado'],
  
  getColor(status) {
    const colores = {
      'Abierto': '#3b82f6',
      'En revisión': '#f59e0b', 
      'En proceso': '#8b5cf6',
      'Resuelto': '#12a454',
      'Rechazado': '#ef4444'
    };
    return colores[status] || '#6b7280';
  },
  
  getIcon(status) {
    const iconos = {
      'Abierto': '📋',
      'En revisión': '👁️',
      'En proceso': '⚙️',
      'Resuelto': '✅',
      'Rechazado': '❌'
    };
    return iconos[status] || '📌';
  },
  
  tiempoPasado(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffHoras = Math.floor((ahora - fecha) / 3600000);
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffHoras < 1) return 'Hace minutos';
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 👤 PANEL DE SOPORTE SIMPLE PARA USUARIOS
// ═══════════════════════════════════════════════════════════════

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => SupportConfig.estadosActivos.includes(r.status));
  const resueltos = todos.filter(r => SupportConfig.estadosResueltos.includes(r.status));

  return `
    <div style="margin-bottom:16px">
      <!-- Resumen rápido -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:var(--blue)">${activos.length}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Activos</div>
        </div>
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:var(--ok)">${resueltos.length}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Resueltos</div>
        </div>
      </div>

      <!-- Pestañas simples -->
      <div style="display:flex;background:var(--soft);border-radius:10px;padding:4px;gap:4px">
        <button onclick="mostrarSoporteTab('activos')" id="tab_activos" style="flex:1;padding:10px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:var(--blue);color:#fff;transition:all .2s">
          🔵 Activos (${activos.length})
        </button>
        <button onclick="mostrarSoporteTab('resueltos')" id="tab_resueltos" style="flex:1;padding:10px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:transparent;color:var(--muted);transition:all .2s">
          ✅ Resueltos (${resueltos.length})
        </button>
      </div>

      <!-- Lista de reportes -->
      <div id="soporte_lista" style="margin-top:12px">
        ${renderSoporteLista(activos)}
      </div>
    </div>
  `;
}

// Tab activo actualmente
let soporteTabActual = 'activos';

function mostrarSoporteTab(tab) {
  soporteTabActual = tab;
  const todos = state.reports || [];
  const reportes = tab === 'activos' 
    ? todos.filter(r => SupportConfig.estadosActivos.includes(r.status))
    : todos.filter(r => SupportConfig.estadosResueltos.includes(r.status));

  // Cambiar estilo de botones
  ['tab_activos', 'tab_resueltos'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (id === `tab_${tab}`) {
      btn.style.background = 'var(--blue)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--muted)';
    }
  });

  // Actualizar lista
  const lista = document.getElementById('soporte_lista');
  if (lista) lista.innerHTML = renderSoporteLista(reportes);
}

function renderSoporteLista(reportes) {
  if (!reportes || reportes.length === 0) {
    return `
      <div style="text-align:center;padding:40px 20px;background:var(--panel);border:1px solid var(--line);border-radius:12px">
        <div style="font-size:40px;margin-bottom:12px">📭</div>
        <div style="font-size:14px;font-weight:700;color:var(--text)">Sin reportes</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${soporteTabActual === 'activos' ? 'No tienes reportes activos' : 'No tienes reportes resueltos'}</div>
      </div>
    `;
  }

  return reportes.map(r => `
    <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .2s" 
         onclick="verDetalleSoporte('${r.id}')"
         onmouseover="this.style.borderColor='var(--blue)';this.style.boxShadow='0 2px 8px rgba(8,119,255,.1)'"
         onmouseout="this.style.borderColor='var(--line)';this.style.boxShadow='none'">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;margin-bottom:4px">${esc(r.product_name || 'Reporte')}</div>
          <div style="font-size:11px;color:var(--muted)">${r.reason || 'Sin motivo'}</div>
        </div>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${SupportConfig.getColor(r.status)}20;color:${SupportConfig.getColor(r.status)}">
          ${SupportConfig.getIcon(r.status)} ${r.status}
        </span>
      </div>
      <div style="font-size:11px;color:var(--muted)">${SupportConfig.tiempoPasado(r.created_at)}</div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// 📋 DETALLE DE REPORTE SIMPLE
// ═══════════════════════════════════════════════════════════════

function verDetalleSoporte(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;

  const color = SupportConfig.getColor(r.status);

  openModal(`
    <div style="padding:20px">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${color}20;color:${color};margin-bottom:12px">
          ${SupportConfig.getIcon(r.status)} ${r.status}
        </div>
        <h2 style="margin:0;font-size:16px;font-weight:900">${esc(r.product_name || 'Reporte')}</h2>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${SupportConfig.tiempoPasado(r.created_at)}</div>
      </div>

      <!-- Detalles -->
      <div style="display:grid;gap:12px">
        ${r.reason ? `
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Motivo</div>
            <div style="padding:10px;background:var(--soft);border-radius:8px;font-size:13px">${esc(r.reason)}</div>
          </div>
        ` : ''}

        ${r.description ? `
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Descripción</div>
            <div style="padding:10px;background:var(--soft);border-radius:8px;font-size:13px">${esc(r.description)}</div>
          </div>
        ` : ''}

        ${r.account_data ? `
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Datos</div>
            <div style="padding:10px;background:var(--soft);border-radius:8px;font-size:12px;font-family:monospace">${esc(r.account_data)}</div>
          </div>
        ` : ''}

        ${r.provider_response ? `
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--ok);text-transform:uppercase;margin-bottom:6px">Respuesta</div>
            <div style="padding:12px;background:rgba(18,164,84,.08);border:1px solid rgba(18,164,84,.2);border-radius:8px;font-size:13px">
              ${esc(r.provider_response)}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Botón cerrar -->
      <button onclick="closeModal()" style="width:100%;margin-top:20px;padding:14px;border:none;border-radius:10px;background:var(--blue);color:#fff;font-size:14px;font-weight:700;cursor:pointer">
        Cerrar
      </button>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

console.log('✅ Soporte Simple cargado');

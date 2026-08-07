/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🎯 SOPORTE PREMIUM v2.0 - CLIENTES Y REVENDEDORES
 * Distrito Streaming - Panel de soporte completo y moderno
 * ════════════════════════════════════════════════════════════════════════════════
 */

const SupportCenter = {
  // Configuración de estados
  estados: {
    'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📋', step: 1 },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔍', step: 2 },
    'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '⚙️', step: 3 },
    'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅', step: 5 },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌', step: 5 }
  },

  // Configuración de categorías
  categorias: {
    'Producto no llegó': { icon: '📦', color: '#ef4444', label: 'Entrega' },
    'Defectuoso': { icon: '⚠️', color: '#f97316', label: 'Defectuoso' },
    'No funciona': { icon: '🚫', color: '#8b5cf6', label: 'Acceso' },
    'Otro': { icon: '❓', color: '#6b7280', label: 'General' }
  },

  // Tiempo relativo mejorado
  tiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  },

  // Tiempo detallado
  tiempoDetallado(dateStr) {
    if (!dateStr) return { texto: '-', dias: 0 };
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    let texto = '';
    if (diffDias > 0) texto += `${diffDias}d `;
    if (diffHoras % 24 > 0) texto += `${diffHoras % 24}h `;
    if (diffDias === 0 && diffMins > 0) texto += `${diffMins}m`;
    
    return { texto: texto.trim() || 'Ahora', dias: diffDias, horas: diffHoras };
  },

  getEstado(status) {
    return this.estados[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '📌', step: 0 };
  },

  getCategoria(reason) {
    if (!reason) return { icon: '📋', color: '#6b7280', label: 'General' };
    const r = reason.toLowerCase();
    if (r.includes('llegó') || r.includes('llegar') || r.includes('llego')) return { icon: '📦', color: '#ef4444', label: 'Entrega' };
    if (r.includes('defect') || r.includes('mal') || r.includes('roto')) return { icon: '⚠️', color: '#f97316', label: 'Defectuoso' };
    if (r.includes('funcion') || r.includes('acceso') || r.includes('clave')) return { icon: '🚫', color: '#8b5cf6', label: 'Acceso' };
    return { icon: '❓', color: '#6b7280', label: 'General' };
  },

  isStaff() { return state.user?.role === 'admin' || state.user?.role === 'operator'; },
  esDueno(report) { return report && state.user && (report.user_id === state.user.id || report.client_id === state.user.id); }
};

// ════════════════════════════════════════════════════════════════════════════════
// 🎨 PANEL PRINCIPAL v2
// ════════════════════════════════════════════════════════════════════════════════

let soporteTabActual = 'activos';
let soporteFiltroCategoria = 'todas';
let soporteBusqueda = '';

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  
  const stats = {
    total: todos.length,
    activos: activos.length,
    resueltos: resueltos.length,
    enProceso: todos.filter(r => r.status === 'En proceso').length,
    enRevision: todos.filter(r => r.status === 'En revisión').length
  };

  return `
    <div style="margin-bottom:16px">
      ${renderHeaderPremium(stats)}
      ${renderBarraAcciones()}
      ${renderTabsPremium(activos.length, resueltos.length)}
      <div id="soporte_lista_premium">${renderListaReportes(getReportesFiltrados())}</div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════
// 🎨 HEADER PREMIUM
// ════════════════════════════════════════════════════════════════════════════════

function renderHeaderPremium(stats) {
  return `
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:24px;margin-bottom:16px;color:#fff;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(118,75,162,0.3)">
      <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%"></div>
      <div style="position:absolute;bottom:-80px;left:-40px;width:250px;height:250px;background:rgba(255,255,255,0.05);border-radius:50%"></div>
      
      <div style="position:relative;z-index:1">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px">
          <div>
            <div style="font-size:11px;opacity:0.8;letter-spacing:1px;margin-bottom:4px;text-transform:uppercase">Centro de Soporte</div>
            <div style="font-size:24px;font-weight:900;margin-bottom:4px">Mis Reportes</div>
            <div style="font-size:13px;opacity:0.8">${stats.total === 0 ? 'No tienes reportes' : `Tienes ${stats.total} reporte${stats.total !== 1 ? 's' : ''}`}</div>
          </div>
          <button onclick="abrirFormularioNuevoReporte()" style="padding:12px 20px;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s"
            onmouseover="this.style.background='rgba(255,255,255,0.3)';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='rgba(255,255,255,0.2)';this.style.transform=''">
            ➕ Nuevo Reporte
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:14px;padding:16px;text-align:center;border:1px solid rgba(255,255,255,0.2)">
            <div style="font-size:32px;font-weight:900;margin-bottom:4px">${stats.total}</div>
            <div style="font-size:11px;opacity:0.8">Total</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:14px;padding:16px;text-align:center;border:1px solid rgba(255,255,255,0.2)">
            <div style="font-size:32px;font-weight:900;margin-bottom:4px;color:#fbbf24">${stats.enProceso}</div>
            <div style="font-size:11px;opacity:0.8">En Proceso</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:14px;padding:16px;text-align:center;border:1px solid rgba(255,255,255,0.2)">
            <div style="font-size:32px;font-weight:900;margin-bottom:4px;color:#f472b6">${stats.enRevision}</div>
            <div style="font-size:11px;opacity:0.8">En Revisión</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:14px;padding:16px;text-align:center;border:1px solid rgba(255,255,255,0.2)">
            <div style="font-size:32px;font-weight:900;margin-bottom:4px;color:#34d399">${stats.resueltos}</div>
            <div style="font-size:11px;opacity:0.8">Resueltos</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════
// 🔍 BARRA DE ACCIONES
// ════════════════════════════════════════════════════════════════════════════════

function renderBarraAcciones() {
  return `
    <div style="background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div style="flex:1;min-width:200px;position:relative">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px">🔍</span>
        <input type="text" id="soporte_busqueda" placeholder="Buscar por producto, motivo..." value="${soporteBusqueda}" oninput="filtrarReportes()" style="width:100%;padding:12px 12px 12px 42px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;background:var(--soft);color:var(--text);box-sizing:border-box">
      </div>
      
      <select id="soporte_filtro_categoria" onchange="filtrarReportes()" style="padding:12px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;background:var(--panel);color:var(--text);cursor:pointer;min-width:150px">
        <option value="todas">📋 Todas</option>
        <option value="entrega">📦 Entrega</option>
        <option value="defectuoso">⚠️ Defectuoso</option>
        <option value="acceso">🚫 Acceso</option>
        <option value="general">❓ General</option>
      </select>
      
      <select id="soporte_ordenar" onchange="filtrarReportes()" style="padding:12px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;background:var(--panel);color:var(--text);cursor:pointer">
        <option value="recientes">🕐 Más recientes</option>
        <option value="antiguos">🕐 Más antiguos</option>
        <option value="actualizado">🔄 Último actualizado</option>
      </select>
      
      ${SupportCenter.isStaff() ? `
        <button onclick="exportarReportes()" style="padding:12px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;background:var(--panel);color:var(--text);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s"
          onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'"
          onmouseout="this.style.borderColor='var(--line)';this.style.color='var(--text)'">
          📥 Exportar
        </button>
      ` : ''}
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════
// 📑 TABS PREMIUM
// ════════════════════════════════════════════════════════════════════════════════

function renderTabsPremium(cantActivos, cantResueltos) {
  return `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button onclick="soporteCambiarTab('activos')" id="tab_soporte_activos" style="flex:1;padding:14px;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff">
        🔵 Activos <span style="background:rgba(255,255,255,0.25);padding:4px 10px;border-radius:20px;font-size:12px">${cantActivos}</span>
      </button>
      <button onclick="soporteCambiarTab('resueltos')" id="tab_soporte_resueltos" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;background:var(--panel);color:var(--muted);transition:all .3s;display:flex;align-items:center;justify-content:center;gap:10px">
        ✅ Resueltos <span style="background:var(--soft);padding:4px 10px;border-radius:20px;font-size:12px">${cantResueltos}</span>
      </button>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════
// 📋 FILTRADO Y LISTA
// ════════════════════════════════════════════════════════════════════════════════

function getReportesFiltrados() {
  let reportes = state.reports || [];
  
  if (soporteTabActual === 'activos') {
    reportes = reportes.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  } else {
    reportes = reportes.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  }
  
  if (soporteBusqueda) {
    const busq = soporteBusqueda.toLowerCase();
    reportes = reportes.filter(r => 
      (r.product_name || '').toLowerCase().includes(busq) ||
      (r.reason || '').toLowerCase().includes(busq) ||
      (r.description || '').toLowerCase().includes(busq) ||
      (r.code || '').toLowerCase().includes(busq)
    );
  }
  
  if (soporteFiltroCategoria !== 'todas') {
    reportes = reportes.filter(r => {
      const cat = SupportCenter.getCategoria(r.reason);
      return cat.label.toLowerCase() === soporteFiltroCategoria;
    });
  }
  
  const ordenar = document.getElementById('soporte_ordenar')?.value || 'recientes';
  reportes.sort((a, b) => {
    switch (ordenar) {
      case 'antiguos': return new Date(a.created_at) - new Date(b.created_at);
      case 'actualizado': return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });
  
  return reportes;
}

function filtrarReportes() {
  soporteBusqueda = document.getElementById('soporte_busqueda')?.value || '';
  soporteFiltroCategoria = document.getElementById('soporte_filtro_categoria')?.value || 'todas';
  document.getElementById('soporte_lista_premium').innerHTML = renderListaReportes(getReportesFiltrados());
}

function soporteCambiarTab(tab) {
  soporteTabActual = tab;
  const tabActivo = document.getElementById('tab_soporte_activos');
  const tabResuelto = document.getElementById('tab_soporte_resueltos');
  
  if (tab === 'activos') {
    tabActivo.style.background = 'linear-gradient(135deg,#3b82f6,#2563eb)';
    tabActivo.style.color = '#fff';
    tabActivo.style.border = 'none';
    tabResuelto.style.background = 'var(--panel)';
    tabResuelto.style.color = 'var(--muted)';
    tabResuelto.style.border = '1.5px solid var(--line)';
  } else {
    tabResuelto.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    tabResuelto.style.color = '#fff';
    tabResuelto.style.border = 'none';
    tabActivo.style.background = 'var(--panel)';
    tabActivo.style.color = 'var(--muted)';
    tabActivo.style.border = '1.5px solid var(--line)';
  }
  
  filtrarReportes();
}

// ════════════════════════════════════════════════════════════════════════════════
// 📄 RENDERIZADO DE LISTA
// ════════════════════════════════════════════════════════════════════════════════

function renderListaReportes(reportes) {
  if (!reportes || reportes.length === 0) {
    return `
      <div style="text-align:center;padding:60px 20px;background:var(--panel);border:1px solid var(--line);border-radius:20px">
        <div style="font-size:64px;margin-bottom:16px;opacity:0.5">${soporteTabActual === 'activos' ? '📭' : '✅'}</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px">${soporteTabActual === 'activos' ? 'Sin reportes activos' : 'Sin reportes resueltos'}</div>
        <div style="font-size:14px;color:var(--muted);margin-bottom:24px">${soporteTabActual === 'activos' ? '¿Tienes un problema? Crea un nuevo reporte de soporte.' : 'Los reportes resueltos aparecerán aquí.'}</div>
        ${soporteTabActual === 'activos' ? `
          <button onclick="abrirFormularioNuevoReporte()" style="padding:14px 28px;background:linear-gradient(135deg,#667eea,#764ba2);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(118,75,162,0.3);transition:all .2s"
            onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(118,75,162,0.4)'"
            onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(118,75,162,0.3)'">
            ➕ Crear Reporte
          </button>
        ` : ''}
      </div>
    `;
  }

  return reportes.map(r => renderTarjetaReporte(r)).join('');
}

// ════════════════════════════════════════════════════════════════════════════════
// 🎴 TARJETA DE REPORTE
// ════════════════════════════════════════════════════════════════════════════════

function renderTarjetaReporte(report) {
  const estado = SupportCenter.getEstado(report.status);
  const categoria = SupportCenter.getCategoria(report.reason);
  const tiempo = SupportCenter.tiempoDetallado(report.updated_at || report.created_at);
  const progreso = Math.round((estado.step / 5) * 100);
  const tieneRespuesta = report.provider_response || report.admin_response;
  const ultimaActualizacion = report.updated_at ? SupportCenter.tiempo(report.updated_at) : SupportCenter.tiempo(report.created_at);

  return `
    <div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;margin-bottom:14px;overflow:hidden;transition:all .3s cubic-bezier(0.4,0,0.2,1);cursor:pointer"
    onclick="verDetalleSoporte('${report.id}')"
    onmouseover="this.style.borderColor='${estado.color}';this.style.boxShadow='0 8px 30px ${estado.color}20';this.style.transform='translateY(-2px)'"
    onmouseout="this.style.borderColor='var(--line)';this.style.boxShadow='none';this.style.transform='translateY(0)'">
      <div style="height:4px;background:linear-gradient(90deg,${estado.color},${estado.color}80)"></div>
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
          <div style="flex:1">
            <div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="font-size:12px;padding:4px 10px;background:${categoria.color}15;color:${categoria.color};border-radius:20px;font-weight:700">${categoria.icon} ${categoria.label}</span>
              ${report.code ? `<span style="font-size:11px;padding:4px 10px;background:var(--soft);color:var(--muted);border-radius:20px;font-weight:700;font-family:monospace">${report.code}</span>` : ''}
            </div>
            <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px">${esc(report.product_name || 'Producto')}</div>
            <div style="font-size:13px;color:var(--muted);line-height:1.4">${esc(report.reason || 'Sin motivo especificado')}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${estado.bg};color:${estado.color}">${estado.icon} ${report.status}</span>
            ${tiempo.dias > 0 ? `<span style="font-size:11px;color:var(--muted)">⏱️ ${tiempo.texto}</span>` : ''}
          </div>
        </div>
        
        ${!['Resuelto', 'Rechazado'].includes(report.status) ? `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:11px;font-weight:600;color:var(--muted)">Progreso</span>
              <span style="font-size:11px;font-weight:700;color:${estado.color}">${progreso}%</span>
            </div>
            <div style="height:6px;background:var(--soft);border-radius:3px;overflow:hidden">
              <div style="width:${progreso}%;height:100%;background:linear-gradient(90deg,${estado.color},${estado.color}cc);border-radius:3px;transition:width .5s ease"></div>
            </div>
          </div>
        ` : ''}
        
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--line)">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:12px;color:var(--muted)">📅 ${ultimaActualizacion}</span>
            ${report.order_id ? `<span style="font-size:12px;color:var(--muted)">📦 #${report.order_id.substring(0,8)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${tieneRespuesta ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:11px;font-weight:600">💬 Respuesta</span>` : ''}
            <span style="font-size:18px;color:var(--muted)">→</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════
// 📝 MODAL DETALLE v2
// ════════════════════════════════════════════════════════════════════════════════

function verDetalleSoporte(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;

  const estado = SupportCenter.getEstado(r.status);
  const categoria = SupportCenter.getCategoria(r.reason);
  const esDueno = SupportCenter.esDueno(r);
  const tiempo = SupportCenter.tiempoDetallado(r.created_at);
  const progreso = Math.round((estado.step / 5) * 100);

  openModal(`
    <div style="padding:0;max-height:85vh;overflow-y:auto">
      <div style="background:linear-gradient(135deg,${estado.color},${estado.color}cc);padding:28px 24px;color:#fff;position:relative">
        <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;background:rgba(255,255,255,0.1);border-radius:50%"></div>
        <div style="position:relative;z-index:1">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:20px;font-size:12px;font-weight:700;margin-bottom:12px">${categoria.icon} ${categoria.label}</div>
          <div style="font-size:22px;font-weight:900;margin-bottom:8px">${esc(r.product_name || 'Producto')}</div>
          ${r.code ? `<div style="font-size:13px;opacity:0.9;font-family:monospace;background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:6px;display:inline-block">${r.code}</div>` : ''}
        </div>
      </div>

      <div style="padding:24px">
        ${!['Resuelto', 'Rechazado'].includes(r.status) ? `
          <div style="margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:12px;font-weight:700;color:var(--muted)">ESTADO DEL REPORTE</span>
              <span style="font-size:12px;font-weight:800;color:${estado.color}">${estado.icon} ${r.status}</span>
            </div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${Object.entries(SupportCenter.estados).slice(0,4).map(([key,val],i)=>{
                const step=i+1;
                const isActive=estado.step>=step;
                return `<div style="flex:1;height:4px;border-radius:2px;background:${isActive?estado.color:'var(--line)'};${estado.step===step?'box-shadow:0 0 8px '+estado.color:''}"></div>`;
              }).join('')}
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:10px;color:var(--muted)">Abierto</span>
              <span style="font-size:10px;color:var(--muted)">Resuelto</span>
            </div>
          </div>
        ` : `
          <div style="padding:16px;background:${estado.bg};border:1px solid ${estado.color}30;border-radius:12px;text-align:center;margin-bottom:24px">
            <div style="font-size:32px;margin-bottom:8px">${estado.icon}</div>
            <div style="font-size:16px;font-weight:800;color:${estado.color}">Reporte ${r.status}</div>
            ${r.updated_at?`<div style="font-size:12px;color:var(--muted);margin-top:4px">el ${new Date(r.updated_at).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}
          </div>
        `}
        
        <div style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">📋 Detalle del Reporte</div>
          <div style="background:var(--soft);border-radius:14px;padding:18px">
            <div style="margin-bottom:${r.description?'16px':'0'}">
              <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">MOTIVO</div>
              <div style="font-size:14px;color:var(--text);line-height:1.5">${esc(r.reason||'Sin motivo especificado')}</div>
            </div>
            ${r.description?`<div><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">DESCRIPCIÓN</div><div style="font-size:14px;color:var(--text);line-height:1.6">${esc(r.description)}</div></div>`:''}
          </div>
        </div>
        
        ${r.account_data?`<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">🔐 Datos de Cuenta</div><div style="padding:14px;background:var(--soft);border-radius:12px;font-size:13px;font-family:monospace;white-space:pre-wrap;color:var(--text)">${esc(r.account_data)}</div></div>`:''}
        
        ${r.provider_response||r.admin_response?`<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">💬 Respuesta del Equipo</div><div style="padding:18px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:14px;font-size:14px;line-height:1.6;color:var(--text)">${esc(r.provider_response||r.admin_response)}</div></div>`:''}
        
        ${r.status==='Rechazado'&&r.rejection_reason?`<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">❌ Motivo del Rechazo</div><div style="padding:18px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;font-size:14px;line-height:1.6;color:var(--text)">${esc(r.rejection_reason)}</div></div>`:''}
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
          <div style="padding:14px;background:var(--soft);border-radius:12px;text-align:center">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Creado</div>
            <div style="font-size:13px;font-weight:700">${SupportCenter.tiempo(r.created_at)}</div>
          </div>
          ${r.order_id?`<div style="padding:14px;background:var(--soft);border-radius:12px;text-align:center"><div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Pedido</div><div style="font-size:13px;font-weight:700;font-family:monospace">#${r.order_id.substring(0,8)}</div></div>`:`<div style="padding:14px;background:var(--soft);border-radius:12px;text-align:center"><div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Tiempo</div><div style="font-size:13px;font-weight:700">${tiempo.texto}</div></div>`}
        </div>
        
        ${r.status==='Resuelto'?`
          <div style="padding:16px;background:var(--soft);border-radius:14px;margin-bottom:20px">
            <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:12px">⭐ ¿Cómo fue tu experiencia?</div>
            <div style="display:flex;gap:8px;justify-content:center">
              ${[1,2,3,4,5].map(n=>`<button onclick="calificarReporte('${r.id}',${n})" style="width:44px;height:44px;border-radius:50%;border:2px solid var(--line);background:var(--panel);font-size:18px;cursor:pointer;transition:all .2s"
                onmouseover="this.style.borderColor='#fbbf24';this.style.transform='scale(1.1)'"
                onmouseout="this.style.borderColor='var(--line)';this.style.transform='scale(1)'">⭐</button>`).join('')}
            </div>
          </div>
        `:''}
        
        <div style="display:flex;gap:12px">
          <button onclick="closeModal()" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s"
            onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'"
            onmouseout="this.style.borderColor='var(--line)';this.style.color='var(--text)'">Cerrar</button>
          ${(esDueno||SupportCenter.isStaff())&&!['Resuelto','Rechazado'].includes(r.status)?`<button onclick="closeModal();setTimeout(()=>confirmDeleteReport('${r.id}'),300)" style="flex:1;padding:14px;border:none;border-radius:12px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='#ef4444';this.style.color='#fff'"
            onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'">🗑️ Eliminar</button>`:''}
        </div>
      </div>
    </div>
  `);
}

// ════════════════════════════════════════════════════════════════════════════════
// 🔧 FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════════════════════

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function calificarReporte(id, stars) {
  toast(`¡Gracias por tu calificación de ${stars} estrella${stars > 1 ? 's' : ''}! ⭐`, 'success');
  closeModal();
}

function abrirFormularioNuevoReporte() {
  if (typeof createReport === 'function') createReport();
  else if (typeof showReportForm === 'function') showReportForm();
  else toast('Función de crear reporte no disponible', 'warning');
}

function exportarReportes() {
  const reportes = getReportesFiltrados();
  if (reportes.length === 0) { toast('No hay reportes para exportar', 'warning'); return; }
  
  const headers = ['Código', 'Producto', 'Motivo', 'Estado', 'Fecha', 'Última Actualización'];
  const rows = reportes.map(r => [
    r.code || '-', r.product_name || '-', r.reason || '-', r.status,
    new Date(r.created_at).toLocaleDateString('es-CO'),
    new Date(r.updated_at || r.created_at).toLocaleDateString('es-CO')
  ]);
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reportes_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  toast(`Exportados ${reportes.length} reportes`, 'success');
}

console.log('✅ Soporte Premium v2 cargado - Clientes y Revendedores');

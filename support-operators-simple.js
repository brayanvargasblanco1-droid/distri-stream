/**
 * SOPORTE PREMIUM v2.1 - CLIENTES Y REVENDEDORES
 * Distrito Streaming - Panel completo con gestión
 */

const SupportCenter = {
  estados: {
    'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📋', step: 1 },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔍', step: 2 },
    'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '⚙️', step: 3 },
    'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅', step: 5 },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌', step: 5 }
  },
  tiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return 'Hace ' + diffMins + 'm';
    if (diffHoras < 24) return 'Hace ' + diffHoras + 'h';
    if (diffDias < 7) return 'Hace ' + diffDias + 'd';
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  },
  tiempoDetallado(dateStr) {
    if (!dateStr) return { texto: '-', dias: 0 };
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);
    let texto = '';
    if (diffDias > 0) texto += diffDias + 'd ';
    if (diffHoras % 24 > 0) texto += (diffHoras % 24) + 'h ';
    if (diffDias === 0 && diffMins > 0) texto += diffMins + 'm';
    return { texto: texto.trim() || 'Ahora', dias: diffDias };
  },
  getEstado(status) { return this.estados[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '📌', step: 0 }; },
  getCategoria(reason) {
    if (!reason) return { icon: '📋', color: '#6b7280', label: 'General' };
    const r = reason.toLowerCase();
    if (r.includes('llegó') || r.includes('llegar')) return { icon: '📦', color: '#ef4444', label: 'Entrega' };
    if (r.includes('defect') || r.includes('mal')) return { icon: '⚠️', color: '#f97316', label: 'Defectuoso' };
    if (r.includes('funcion') || r.includes('acceso')) return { icon: '🚫', color: '#8b5cf6', label: 'Acceso' };
    return { icon: '❓', color: '#6b7280', label: 'General' };
  },
  isStaff() { return state.user?.role === 'admin' || state.user?.role === 'operator'; },
  esDueno(report) { return report && state.user && (report.user_id === state.user.id || report.client_id === state.user.id); }
};

let soporteTabActual = 'activos';

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  const stats = { total: todos.length, activos: activos.length, resueltos: resueltos.length };
  return '<div style="margin-bottom:16px">' + renderHeaderPremium(stats) + renderBarraAcciones() + renderTabsPremium(activos.length, resueltos.length) + '<div id="soporte_lista_premium">' + renderListaReportes(getReportesFiltrados()) + '</div></div>';
}

function renderHeaderPremium(stats) {
  const eliminarBtn = stats.total > 0 ? '<button onclick="eliminarTodosReportes()" style="padding:12px 16px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);border-radius:12px;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🗑️ Eliminar Todos (' + stats.total + ')</button>' : '';
  return '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:24px;margin-bottom:16px;color:#fff;position:relative;overflow:hidden"><div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%"></div><div style="position:absolute;bottom:-80px;left:-40px;width:250px;height:250px;background:rgba(255,255,255,0.05);border-radius:50%"></div><div style="position:relative;z-index:1"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;flex-wrap:wrap;gap:12px"><div><div style="font-size:11px;opacity:0.8;margin-bottom:4px">CENTRO DE SOPORTE</div><div style="font-size:24px;font-weight:900;margin-bottom:4px">Mis Reportes</div><div style="font-size:13px;opacity:0.8">' + (stats.total === 0 ? 'No tienes reportes' : 'Tienes ' + stats.total + ' reporte(s)') + '</div></div><div style="display:flex;gap:8px">' + eliminarBtn + '<button onclick="abrirFormularioNuevoReporte()" style="padding:12px 20px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer">➕ Nuevo Reporte</button></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"><div style="background:rgba(255,255,255,0.15);border-radius:14px;padding:16px;text-align:center"><div style="font-size:32px;font-weight:900">' + stats.total + '</div><div style="font-size:11px;opacity:0.8">Total</div></div><div style="background:rgba(255,255,255,0.15);border-radius:14px;padding:16px;text-align:center"><div style="font-size:32px;font-weight:900;color:#fbbf24">' + stats.activos + '</div><div style="font-size:11px;opacity:0.8">Activos</div></div><div style="background:rgba(255,255,255,0.15);border-radius:14px;padding:16px;text-align:center"><div style="font-size:32px;font-weight:900;color:#34d399">' + stats.resueltos + '</div><div style="font-size:11px;opacity:0.8">Resueltos</div></div></div></div></div>';
}

function renderBarraAcciones() {
  return '<div style="background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><div style="flex:1;min-width:200px"><input type="text" id="soporte_busqueda" placeholder="Buscar..." oninput="filtrarReportes()" style="width:100%;padding:12px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;background:var(--soft);color:var(--text);box-sizing:border-box"></div><select id="soporte_ordenar" onchange="filtrarReportes()" style="padding:12px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;background:var(--panel);color:var(--text);cursor:pointer"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option></select>' + (SupportCenter.isStaff() ? '<button onclick="exportarReportes()" style="padding:12px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;background:var(--panel);color:var(--text);cursor:pointer">📥 Exportar</button>' : '') + '</div>';
}

function renderTabsPremium(cantActivos, cantResueltos) {
  return '<div style="display:flex;gap:8px;margin-bottom:16px"><button onclick="soporteCambiarTab(\'activos\')" id="tab_activos" style="flex:1;padding:14px;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;gap:10px">🔵 Activos <span style="background:rgba(255,255,255,0.25);padding:4px 10px;border-radius:20px;font-size:12px">' + cantActivos + '</span></button><button onclick="soporteCambiarTab(\'resueltos\')" id="tab_resueltos" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;background:var(--panel);color:var(--muted);display:flex;align-items:center;justify-content:center;gap:10px">✅ Resueltos <span style="background:var(--soft);padding:4px 10px;border-radius:20px;font-size:12px">' + cantResueltos + '</span></button></div>';
}

function getReportesFiltrados() {
  let reportes = state.reports || [];
  if (soporteTabActual === 'activos') reportes = reportes.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  else reportes = reportes.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  const busq = (document.getElementById('soporte_busqueda')?.value || '').toLowerCase();
  if (busq) reportes = reportes.filter(r => (r.product_name || '').toLowerCase().includes(busq) || (r.reason || '').toLowerCase().includes(busq));
  const ordenar = document.getElementById('soporte_ordenar')?.value || 'recientes';
  if (ordenar === 'antiguos') reportes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  else reportes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return reportes;
}

function filtrarReportes() {
  document.getElementById('soporte_lista_premium').innerHTML = renderListaReportes(getReportesFiltrados());
}

function soporteCambiarTab(tab) {
  soporteTabActual = tab;
  const tabA = document.getElementById('tab_activos');
  const tabR = document.getElementById('tab_resueltos');
  if (tab === 'activos') {
    tabA.style.background = 'linear-gradient(135deg,#3b82f6,#2563eb)';
    tabA.style.color = '#fff';
    tabA.style.border = 'none';
    tabR.style.background = 'var(--panel)';
    tabR.style.color = 'var(--muted)';
    tabR.style.border = '1.5px solid var(--line)';
  } else {
    tabR.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    tabR.style.color = '#fff';
    tabR.style.border = 'none';
    tabA.style.background = 'var(--panel)';
    tabA.style.color = 'var(--muted)';
    tabA.style.border = '1.5px solid var(--line)';
  }
  filtrarReportes();
}

function renderListaReportes(reportes) {
  if (!reportes || reportes.length === 0) {
    return '<div style="text-align:center;padding:60px 20px;background:var(--panel);border:1px solid var(--line);border-radius:20px"><div style="font-size:64px;margin-bottom:16px;opacity:0.5">' + (soporteTabActual === 'activos' ? '📭' : '✅') + '</div><div style="font-size:18px;font-weight:800;margin-bottom:8px">' + (soporteTabActual === 'activos' ? 'Sin reportes activos' : 'Sin reportes resueltos') + '</div><div style="font-size:14px;color:var(--muted);margin-bottom:24px">' + (soporteTabActual === 'activos' ? '¿Tienes un problema? Crea un reporte.' : 'Los resueltos aparecerán aquí.') + '</div>' + (soporteTabActual === 'activos' ? '<button onclick="abrirFormularioNuevoReporte()" style="padding:14px 28px;background:linear-gradient(135deg,#667eea,#764ba2);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">➕ Crear Reporte</button>' : '') + '</div>';
  }
  return reportes.map(r => renderTarjetaReporte(r)).join('');
}

function renderTarjetaReporte(report) {
  const estado = SupportCenter.getEstado(report.status);
  const categoria = SupportCenter.getCategoria(report.reason);
  const tiempo = SupportCenter.tiempoDetallado(report.updated_at || report.created_at);
  const progreso = Math.round((estado.step / 5) * 100);
  const tieneRespuesta = report.provider_response || report.admin_response;
  const esDueno = SupportCenter.esDueno(report);
  return '<div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;margin-bottom:14px;overflow:hidden;transition:all .3s" onmouseover="this.style.borderColor=\'' + estado.color + '\'" onmouseout="this.style.borderColor=\'var(--line)\'"><div style="height:4px;background:' + estado.color + '"></div><div style="padding:20px"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px"><div style="flex:1"><div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:12px;padding:4px 10px;background:' + categoria.color + '15;color:' + categoria.color + ';border-radius:20px;font-weight:700">' + categoria.icon + ' ' + categoria.label + '</span>' + (report.code ? '<span style="font-size:11px;padding:4px 10px;background:var(--soft);color:var(--muted);border-radius:20px;font-weight:700;font-family:monospace">' + report.code + '</span>' : '') + '</div><div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px;cursor:pointer" onclick="verDetalleSoporte(\'' + report.id + '\')">' + esc(report.product_name || 'Producto') + '</div><div style="font-size:13px;color:var(--muted)">' + esc(report.reason || 'Sin motivo') + '</div></div><div style="text-align:right"><span style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;background:' + estado.bg + ';color:' + estado.color + '">' + estado.icon + ' ' + report.status + '</span>' + (tiempo.dias > 0 ? '<div style="font-size:11px;color:var(--muted);margin-top:4px">⏱️ ' + tiempo.texto + '</div>' : '') + '</div></div>' + (!['Resuelto', 'Rechazado'].includes(report.status) ? '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:11px;font-weight:600;color:var(--muted)">Progreso</span><span style="font-size:11px;font-weight:700;color:' + estado.color + '">' + progreso + '%</span></div><div style="height:6px;background:var(--soft);border-radius:3px;overflow:hidden"><div style="width:' + progreso + '%;height:100%;background:' + estado.color + ';border-radius:3px"></div></div></div>' : '') + '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--line)"><div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--muted)"><span>📅 ' + SupportCenter.tiempo(report.updated_at || report.created_at) + '</span>' + (report.order_id ? '<span>📦 #' + report.order_id.substring(0, 8) + '</span>' : '') + '</div><div style="display:flex;align-items:center;gap:8px">' + (tieneRespuesta ? '<span style="padding:4px 8px;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer" onclick="verDetalleSoporte(\'' + report.id + '\')">💬 Respuesta</span>' : '') + '<button onclick="verDetalleSoporte(\'' + report.id + '\')" style="padding:8px 16px;border:none;border-radius:10px;background:var(--blue);color:#fff;font-size:12px;font-weight:700;cursor:pointer">👁️ Ver</button>' + (esDueno || SupportCenter.isStaff() ? '<button onclick="event.stopPropagation();eliminarReporteIndividual(\'' + report.id + '\')" style="padding:8px 16px;border:none;border-radius:10px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>' : '') + '</div></div></div></div>';
}

function verDetalleSoporte(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;
  const estado = SupportCenter.getEstado(r.status);
  const categoria = SupportCenter.getCategoria(r.reason);
  const esDueno = SupportCenter.esDueno(r);
  openModal('<div style="padding:0;max-height:85vh;overflow-y:auto"><div style="background:linear-gradient(135deg,' + estado.color + ',#fff);padding:28px 24px;color:' + estado.color + ';text-align:center"><div style="font-size:12px;font-weight:700;opacity:0.8;margin-bottom:8px">' + categoria.icon + ' ' + categoria.label + '</div><div style="font-size:22px;font-weight:900">' + esc(r.product_name || 'Producto') + '</div>' + (r.code ? '<div style="font-size:13px;opacity:0.8;font-family:monospace;margin-top:8px">' + r.code + '</div>' : '') + '</div><div style="padding:24px">' + (!['Resuelto', 'Rechazado'].includes(r.status) ? '<div style="margin-bottom:24px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700;color:var(--muted)">ESTADO</span><span style="font-size:12px;font-weight:800;color:' + estado.color + '">' + estado.icon + ' ' + r.status + '</span></div><div style="height:6px;background:var(--soft);border-radius:3px"><div style="width:' + Math.round((estado.step / 5) * 100) + '%;height:100%;background:' + estado.color + ';border-radius:3px"></div></div></div>' : '<div style="padding:16px;background:' + estado.bg + ';border-radius:12px;text-align:center;margin-bottom:24px"><div style="font-size:32px;margin-bottom:8px">' + estado.icon + '</div><div style="font-size:16px;font-weight:800;color:' + estado.color + '">Reporte ' + r.status + '</div></div>') + '<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">MOTIVO</div><div style="padding:14px;background:var(--soft);border-radius:12px;font-size:14px">' + esc(r.reason || 'Sin motivo') + '</div></div>' + (r.description ? '<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">DESCRIPCIÓN</div><div style="padding:14px;background:var(--soft);border-radius:12px;font-size:14px">' + esc(r.description) + '</div></div>' : '') + (r.provider_response || r.admin_response ? '<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:#10b981;margin-bottom:6px">💬 SOLUCIÓN</div><div style="padding:18px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;font-size:14px;line-height:1.6">' + esc(r.provider_response || r.admin_response) + '</div></div>' : '') + (r.status === 'Rechazado' && r.rejection_reason ? '<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:#ef4444;margin-bottom:6px">❌ MOTIVO DEL RECHAZO</div><div style="padding:18px;background:rgba(239,68,68,0.08);border-radius:12px;font-size:14px">' + esc(r.rejection_reason) + '</div></div>' : '') + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px"><div style="padding:14px;background:var(--soft);border-radius:12px;text-align:center"><div style="font-size:10px;color:var(--muted);margin-bottom:4px">CREADO</div><div style="font-size:13px;font-weight:700">' + SupportCenter.tiempo(r.created_at) + '</div></div>' + (r.order_id ? '<div style="padding:14px;background:var(--soft);border-radius:12px;text-align:center"><div style="font-size:10px;color:var(--muted);margin-bottom:4px">PEDIDO</div><div style="font-size:13px;font-weight:700;font-family:monospace">#' + r.order_id.substring(0, 8) + '</div></div>' : '<div></div>') + '</div><div style="display:flex;gap:12px"><button onclick="closeModal()" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer">Cerrar</button>' + (esDueno || SupportCenter.isStaff() ? '<button onclick="closeModal();setTimeout(()=>eliminarReporteIndividual(\'' + r.id + '\'),300)" style="flex:1;padding:14px;border:none;border-radius:12px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>' : '') + '</div></div></div>');
}

// ELIMINAR
function eliminarReporteIndividual(id) {
  const reporte = state.reports.find(r => r.id === id);
  if (!reporte) { toast('Reporte no encontrado', 'error'); return; }
  openModal('<div style="padding:24px;text-align:center"><div style="font-size:64px;margin-bottom:16px">🗑️</div><div style="font-size:20px;font-weight:800;margin-bottom:8px">¿Eliminar reporte?</div><div style="font-size:14px;color:var(--muted);margin-bottom:24px">' + esc(reporte.product_name || 'Producto') + '<br><span style="font-size:12px">' + esc(reporte.reason || 'Sin motivo') + '</span></div><div style="display:flex;gap:12px"><button onclick="closeModal()" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer">Cancelar</button><button onclick="confirmarEliminarReporte(\'' + id + '\')" style="flex:1;padding:14px;border:none;border-radius:12px;background:#ef4444;color:#fff;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar</button></div></div>');
}

async function confirmarEliminarReporte(id) {
  closeModal();
  showLoading('Eliminando...');
  try {
    await api('reports', { method: 'DELETE', body: JSON.stringify({ id: id }) });
    toast('Reporte eliminado', 'success');
    await boot();
    setView('reports');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoading(); }
}

function eliminarTodosReportes() {
  const reportes = state.reports || [];
  if (reportes.length === 0) { toast('No hay reportes', 'warning'); return; }
  openModal('<div style="padding:24px;text-align:center"><div style="font-size:64px;margin-bottom:16px">⚠️</div><div style="font-size:20px;font-weight:800;margin-bottom:8px">¿Eliminar TODOS los reportes?</div><div style="font-size:14px;color:var(--muted);margin-bottom:24px">Se eliminarán <strong>' + reportes.length + ' reporte(s)</strong><br><span style="color:#ef4444">No se puede deshacer</span></div><div style="display:flex;gap:12px"><button onclick="closeModal()" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer">Cancelar</button><button onclick="confirmarEliminarTodos()" style="flex:1;padding:14px;border:none;border-radius:12px;background:#ef4444;color:#fff;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar Todo</button></div></div>');
}

async function confirmarEliminarTodos() {
  closeModal();
  showLoading('Eliminando todos...');
  try {
    const reportes = state.reports || [];
    for (const r of reportes) {
      await api('reports', { method: 'DELETE', body: JSON.stringify({ id: r.id }) });
    }
    toast(reportes.length + ' reportes eliminados', 'success');
    await boot();
    setView('reports');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoading(); }
}

// CREAR REPORTE
function abrirFormularioNuevoReporte() {
  const misOrdenes = (state.orders || []).filter(o => o.user_id === state.user?.id || o.client_id === state.user?.id);
  const misProductos = (state.products || []).filter(p => p.user_id === state.user?.id || p.client_id === state.user?.id);
  const opciones = [];
  const seen = new Set();
  misProductos.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); opciones.push({ id: p.id, name: p.name, type: 'producto', order_id: null }); } });
  misOrdenes.forEach(o => { if (!seen.has(o.product_name)) { seen.add(o.product_name); opciones.push({ id: o.id, name: o.product_name, type: 'orden', order_id: o.id }); } });

  if (opciones.length === 0) {
    openModal('<div style="padding:24px;text-align:center"><div style="font-size:64px;margin-bottom:16px">📦</div><div style="font-size:18px;font-weight:800;margin-bottom:8px">No hay productos</div><div style="font-size:14px;color:var(--muted);margin-bottom:24px">Primero compra o recibe una cuenta.</div><button onclick="closeModal()" style="padding:14px 28px;border:none;border-radius:12px;background:var(--blue);color:#fff;font-size:14px;font-weight:700;cursor:pointer">Entendido</button></div>');
    return;
  }

  openModal('<div style="padding:0;max-height:90vh;overflow-y:auto"><div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:24px;color:#fff;text-align:center"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:20px;font-weight:900">Nuevo Reporte</div></div><div style="padding:24px"><div style="margin-bottom:20px"><label style="display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">📦 Producto *</label><select id="reporte_producto" style="width:100%;padding:14px;border:1.5px solid var(--line);border-radius:12px;font-size:14px;background:var(--panel)"><option value="">Selecciona...</option>' + opciones.map(o => '<option value="' + o.id + '" data-type="' + o.type + '" data-order="' + (o.order_id || '') + '" data-name="' + o.name + '">' + o.name + '</option>').join('') + '</select></div><div style="margin-bottom:20px"><label style="display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">📋 Categoría *</label><select id="reporte_categoria" style="width:100%;padding:14px;border:1.5px solid var(--line);border-radius:12px;font-size:14px;background:var(--panel)"><option value="">Selecciona...</option><option value="Producto no llegó">📦 Producto no llegó</option><option value="Defectuoso">⚠️ Defectuoso</option><option value="No funciona">🚫 No funciona</option><option value="Otro">❓ Otro</option></select></div><div style="margin-bottom:20px"><label style="display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">📝 Motivo *</label><input type="text" id="reporte_motivo" placeholder="Ej: No puedo iniciar sesión" style="width:100%;padding:14px;border:1.5px solid var(--line);border-radius:12px;font-size:14px;background:var(--soft)"></div><div style="margin-bottom:24px"><label style="display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">📄 Descripción</label><textarea id="reporte_descripcion" rows="3" placeholder="Describe el problema..." style="width:100%;padding:14px;border:1.5px solid var(--line);border-radius:12px;font-size:14px;background:var(--soft);resize:vertical"></textarea></div><div style="display:flex;gap:12px"><button onclick="closeModal()" style="flex:1;padding:14px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer">Cancelar</button><button onclick="enviarNuevoReporte()" style="flex:1;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:14px;font-weight:700;cursor:pointer">➕ Crear</button></div></div></div>');
}

async function enviarNuevoReporte() {
  const sel = document.getElementById('reporte_producto');
  const opt = sel.options[sel.selectedIndex];
  if (!sel.value) { toast('Selecciona un producto', 'warning'); return; }
  if (!document.getElementById('reporte_categoria').value) { toast('Selecciona categoría', 'warning'); return; }
  if (!document.getElementById('reporte_motivo').value.trim()) { toast('Escribe el motivo', 'warning'); return; }

  showLoading('Creando...');
  try {
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        product_name: opt.dataset.name,
        reason: document.getElementById('reporte_motivo').value.trim(),
        description: document.getElementById('reporte_descripcion').value.trim() || null,
        order_id: opt.dataset.order || null,
        client_id: state.user?.id
      })
    });
    closeModal();
    toast('Reporte creado', 'success');
    await boot();
    setView('reports');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoading(); }
}

// UTILS
function esc(str) { if (!str) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

function exportarReportes() {
  const reportes = getReportesFiltrados();
  if (reportes.length === 0) { toast('No hay reportes', 'warning'); return; }
  const csv = [['Código', 'Producto', 'Motivo', 'Estado', 'Fecha'], ...reportes.map(r => [r.code || '-', r.product_name || '-', r.reason || '-', r.status, new Date(r.created_at).toLocaleDateString('es-CO')])].map(row => row.map(c => '"' + c + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reportes.csv'; a.click();
  toast('Exportados ' + reportes.length, 'success');
}

console.log('✅ Soporte Premium v2.1 - Clientes y Revendedores');

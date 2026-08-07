/**
 * SOPORTE PREMIUM v3 - DISEÑO CLARO Y FUNCIONAL
 * Distrito Streaming - Centro de Soporte para Clientes
 */

const Soporte = {
  // Estados con colores visibles
  estados: {
    'Abierto': { color: '#fff', bg: '#3b82f6', icon: '📋' },
    'En revisión': { color: '#fff', bg: '#f59e0b', icon: '🔍' },
    'En proceso': { color: '#fff', bg: '#8b5cf6', icon: '⚙️' },
    'Resuelto': { color: '#fff', bg: '#10b981', icon: '✅' },
    'Rechazado': { color: '#fff', bg: '#ef4444', icon: '❌' }
  },

  // Categorías
  categorias: {
    'Producto no llegó': { icon: '📦', color: '#ef4444' },
    'Defectuoso': { icon: '⚠️', color: '#f97316' },
    'No funciona': { icon: '🚫', color: '#8b5cf6' },
    'Otro': { icon: '❓', color: '#6b7280' }
  },

  // Tiempo relativo
  tiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return 'Hace ' + diffMins + 'm';
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return 'Hace ' + diffHoras + 'h';
    return 'Hace ' + Math.floor(diffHoras / 24) + 'd';
  },

  getEstado(s) { return this.estados[s] || { color: '#fff', bg: '#6b7280', icon: '📌' }; },
  
  getCategoria(r) {
    if (!r) return { icon: '❓', color: '#6b7280' };
    const l = r.toLowerCase();
    if (l.includes('llegó')) return { icon: '📦', color: '#ef4444' };
    if (l.includes('defect')) return { icon: '⚠️', color: '#f97316' };
    if (l.includes('funcion') || l.includes('acceso')) return { icon: '🚫', color: '#8b5cf6' };
    return { icon: '❓', color: '#6b7280' };
  },

  puedeEliminar(report) {
    if (!report || !state.user) return false;
    return report.user_id === state.user.id || 
           report.client_id === state.user.id ||
           state.user.role === 'admin' ||
           state.user.role === 'operator';
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 🎨 PANEL PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

let tabActual = 'activos';

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));

  return `
    <div style="max-width:800px;margin:0 auto">
      ${renderEncabezado(todos.length, activos.length, resueltos.length)}
      ${renderOpciones()}
      ${renderPestanas(activos.length, resueltos.length)}
      <div id="lista_reportes">${renderLista(tabActual === 'activos' ? activos : resueltos)}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// 📊 ENCABEZADO CON ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════════════

function renderEncabezado(total, activos, resueltos) {
  return `
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%);border-radius:16px;padding:24px;margin-bottom:16px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:11px;opacity:0.7;margin-bottom:4px">CENTRO DE SOPORTE</div>
          <div style="font-size:22px;font-weight:900">Mis Reportes</div>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="Soporte.mostrarCrear()" style="padding:12px 20px;background:#3b82f6;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px">
            ➕ Nuevo Reporte
          </button>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900">${total}</div>
          <div style="font-size:11px;opacity:0.7">TOTAL</div>
        </div>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#fbbf24">${activos}</div>
          <div style="font-size:11px;opacity:0.7">PENDIENTES</div>
        </div>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#34d399">${resueltos}</div>
          <div style="font-size:11px;opacity:0.7">RESUELTOS</div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// 🔍 OPCIONES (BUSCAR Y ORDENAR)
// ═══════════════════════════════════════════════════════════════════════

function renderOpciones() {
  return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap">
      <input type="text" id="buscar_reporte" placeholder="Buscar por producto..." 
        oninput="Soporte.filtrar()"
        style="flex:1;min-width:200px;padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px">
      <select id="ordenar_reporte" onchange="Soporte.filtrar()" 
        style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;background:#fff">
        <option value="nuevo">Más nuevos</option>
        <option value="viejo">Más antiguos</option>
      </select>
      ${state.reports?.length > 0 ? `
        <button onclick="Soporte.eliminarTodos()" 
          style="padding:10px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;font-weight:600;cursor:pointer">
          🗑️ Eliminar Todo
        </button>
      ` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// 📑 PESTAÑAS
// ═══════════════════════════════════════════════════════════════════════

function renderPestanas(activos, resueltos) {
  const activoA = tabActual === 'activos';
  return `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button onclick="Soporte.cambiarTab('activos')" 
        style="flex:1;padding:14px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;
          background:${activoA ? '#3b82f6' : '#fff'};color:${activoA ? '#fff' : '#6b7280'};
          border:1px solid ${activoA ? '#3b82f6' : '#e5e7eb'};
          display:flex;align-items:center;justify-content:center;gap:8px">
        📋 Activos <span style="background:${activoA ? 'rgba(255,255,255,0.2)' : '#f3f4f6'};padding:2px 10px;border-radius:20px;font-size:12px">${activos}</span>
      </button>
      <button onclick="Soporte.cambiarTab('resueltos')" 
        style="flex:1;padding:14px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;
          background:${!activoA ? '#10b981' : '#fff'};color:${!activoA ? '#fff' : '#6b7280'};
          border:1px solid ${!activoA ? '#10b981' : '#e5e7eb'};
          display:flex;align-items:center;justify-content:center;gap:8px">
        ✅ Resueltos <span style="background:${!activoA ? 'rgba(255,255,255,0.2)' : '#f3f4f6'};padding:2px 10px;border-radius:20px;font-size:12px">${resueltos}</span>
      </button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// 📄 LISTA DE REPORTES
// ═══════════════════════════════════════════════════════════════════════

function renderLista(reportes) {
  if (!reportes || reportes.length === 0) {
    const mensaje = tabActual === 'activos' 
      ? '¿Tienes un problema con tu cuenta?' 
      : 'No hay reportes resueltos';
    const boton = tabActual === 'activos' 
      ? '<button onclick="Soporte.mostrarCrear()" style="padding:14px 28px;background:#3b82f6;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">➕ Crear Reporte</button>'
      : '';
    return `
      <div style="text-align:center;padding:60px 20px;background:#fff;border:1px solid #e5e7eb;border-radius:16px">
        <div style="font-size:56px;margin-bottom:16px">${tabActual === 'activos' ? '📭' : '✅'}</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#1f2937">${mensaje}</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:24px">
          ${tabActual === 'activos' ? 'Crea un reporte para obtener ayuda.' : 'Los reportes resueltos aparecerán aquí.'}
        </div>
        ${boton}
      </div>
    `;
  }

  return reportes.map(r => renderTarjeta(r)).join('');
}

function renderTarjeta(r) {
  const estado = Soporte.getEstado(r.status);
  const cat = Soporte.getCategoria(r.reason);
  const puedeEliminar = Soporte.puedeEliminar(r);
  const tieneRespuesta = r.provider_response || r.admin_response;
  const esResuelto = ['Resuelto', 'Rechazado'].includes(r.status);

  return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;margin-bottom:12px;overflow:hidden;transition:all .2s"
      onmouseover="this.style.borderColor='#3b82f6';this.style.boxShadow='0 4px 12px rgba(59,130,246,0.15)'"
      onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
      
      <div style="height:4px;background:${estado.bg}"></div>
      
      <div style="padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="padding:4px 10px;background:${cat.color}20;color:${cat.color};border-radius:20px;font-size:11px;font-weight:700">
                ${cat.icon} ${r.reason || 'General'}
              </span>
              ${r.code ? `<span style="padding:4px 8px;background:#f3f4f6;color:#6b7280;border-radius:6px;font-size:11px;font-family:monospace">${r.code}</span>` : ''}
            </div>
            <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
            ${r.description ? `<div style="font-size:13px;color:#6b7280;line-height:1.4">${escHtml(r.description)}</div>` : ''}
          </div>
          <span style="padding:8px 14px;background:${estado.bg};color:${estado.color};border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">
            ${estado.icon} ${r.status}
          </span>
        </div>

        ${tieneRespuesta ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#15803d;margin-bottom:6px">💬 RESPUESTA DEL EQUIPO:</div>
            <div style="font-size:13px;color:#1f2937;line-height:1.5">${escHtml(tieneRespuesta)}</div>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #f3f4f6">
          <div style="font-size:12px;color:#6b7280">
            📅 ${Soporte.tiempo(r.updated_at || r.created_at)}
            ${r.order_id ? ` · 📦 #${r.order_id.substring(0,8)}` : ''}
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="Soporte.verDetalle('${r.id}')" 
              style="padding:8px 16px;background:#3b82f6;border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer">
              👁️ Ver
            </button>
            ${puedeEliminar ? `
              <button onclick="Soporte.eliminar('${r.id}')" 
                style="padding:8px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:12px;font-weight:700;cursor:pointer">
                🗑️ Eliminar
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
// 📝 DETALLE DEL REPORTE
// ═══════════════════════════════════════════════════════════════════════

Soporte.verDetalle = function(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) { toast('Reporte no encontrado', 'bad'); return; }
  
  const estado = Soporte.getEstado(r.status);
  const cat = Soporte.getCategoria(r.reason);
  const puedeEliminar = Soporte.puedeEliminar(r);

  openModal(`
    <div style="padding:0">
      <div style="background:${estado.bg};padding:24px;text-align:center;color:${estado.color}">
        <div style="font-size:40px;margin-bottom:8px">${cat.icon}</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
        <div style="font-size:14px;font-weight:700;padding:6px 16px;background:rgba(255,255,255,0.2);border-radius:20px;display:inline-block">${estado.icon} ${r.status}</div>
      </div>
      
      <div style="padding:20px">
        <div style="margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px">MOTIVO</div>
          <div style="padding:12px;background:#f9fafb;border-radius:10px;font-size:14px">${escHtml(r.reason || 'Sin motivo')}</div>
        </div>
        
        ${r.description ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px">DESCRIPCIÓN</div>
            <div style="padding:12px;background:#f9fafb;border-radius:10px;font-size:14px;line-height:1.5">${escHtml(r.description)}</div>
          </div>
        ` : ''}
        
        ${r.provider_response || r.admin_response ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#15803d;margin-bottom:6px">💬 SOLUCIÓN</div>
            <div style="padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;font-size:14px;line-height:1.6">${escHtml(r.provider_response || r.admin_response)}</div>
          </div>
        ` : ''}
        
        ${r.status === 'Rechazado' && r.rejection_reason ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#dc2626;margin-bottom:6px">❌ RECHAZO</div>
            <div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:14px">${escHtml(r.rejection_reason)}</div>
          </div>
        ` : ''}
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          <div style="padding:12px;background:#f9fafb;border-radius:10px;text-align:center">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">CREADO</div>
            <div style="font-size:13px;font-weight:700">${Soporte.tiempo(r.created_at)}</div>
          </div>
          ${r.order_id ? `
            <div style="padding:12px;background:#f9fafb;border-radius:10px;text-align:center">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px">PEDIDO</div>
              <div style="font-size:13px;font-weight:700;font-family:monospace">#${r.order_id.substring(0,8)}</div>
            </div>
          ` : '<div></div>'}
        </div>
        
        <div style="display:flex;gap:12px">
          <button onclick="closeModal()" style="flex:1;padding:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Cerrar</button>
          ${puedeEliminar ? `
            <button onclick="closeModal();setTimeout(()=>Soporte.eliminar('${r.id}'),300)" style="flex:1;padding:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>
          ` : ''}
        </div>
      </div>
    </div>
  `);
};

// ═══════════════════════════════════════════════════════════════════════
// 🗑️ ELIMINAR REPORTES
// ═══════════════════════════════════════════════════════════════════════

Soporte.eliminar = function(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) { toast('Reporte no encontrado', 'bad'); return; }
  
  openModal(`
    <div style="padding:24px;text-align:center">
      <div style="font-size:56px;margin-bottom:16px">🗑️</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">¿Eliminar este reporte?</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:24px">
        <strong>${escHtml(r.product_name || 'Producto')}</strong><br>
        <span style="font-size:12px">${escHtml(r.reason || 'Sin motivo')}</span>
      </div>
      <div style="display:flex;gap:12px">
        <button onclick="closeModal()" style="flex:1;padding:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Cancelar</button>
        <button onclick="Soporte.confirmarEliminar('${id}')" style="flex:1;padding:14px;background:#dc2626;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>
      </div>
    </div>
  `);
};

Soporte.confirmarEliminar = async function(id) {
  closeModal();
  showLoading('Eliminando...');
  try {
    await api('reports', { method: 'DELETE', body: JSON.stringify({ id: id }) });
    toast('Reporte eliminado', 'ok');
    await boot();
    setView('reports');
  } catch(e) {
    toast('Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
};

Soporte.eliminarTodos = function() {
  const reportes = state.reports || [];
  if (reportes.length === 0) { toast('No hay reportes', 'bad'); return; }
  
  openModal(`
    <div style="padding:24px;text-align:center">
      <div style="font-size:56px;margin-bottom:16px">⚠️</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">¿Eliminar TODOS los reportes?</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:24px">
        Se eliminarán <strong>${reportes.length} reporte(s)</strong><br>
        <span style="color:#dc2626">Esta acción no se puede deshacer</span>
      </div>
      <div style="display:flex;gap:12px">
        <button onclick="closeModal()" style="flex:1;padding:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Cancelar</button>
        <button onclick="Soporte.confirmarEliminarTodos()" style="flex:1;padding:14px;background:#dc2626;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">🗑️ Eliminar Todo</button>
      </div>
    </div>
  `);
};

Soporte.confirmarEliminarTodos = async function() {
  closeModal();
  showLoading('Eliminando todos...');
  try {
    const reportes = state.reports || [];
    for (const r of reportes) {
      await api('reports', { method: 'DELETE', body: JSON.stringify({ id: r.id }) });
    }
    toast(reportes.length + ' reportes eliminados', 'ok');
    await boot();
    setView('reports');
  } catch(e) {
    toast('Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ➕ CREAR REPORTE
// ═══════════════════════════════════════════════════════════════════════

Soporte.mostrarCrear = function() {
  // Obtener productos del usuario
  const ordenes = (state.orders || []).filter(o => 
    o.user_id === state.user?.id || o.client_id === state.user?.id
  );
  const productos = (state.products || []).filter(p =>
    p.user_id === state.user?.id || p.client_id === state.user?.id
  );
  
  // Combinar sin duplicados
  const opciones = [];
  const seen = new Set();
  
  productos.forEach(p => {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      opciones.push({ name: p.name, id: p.id, tipo: 'Producto' });
    }
  });
  
  ordenes.forEach(o => {
    if (!seen.has(o.product_name)) {
      seen.add(o.product_name);
      opciones.push({ name: o.product_name, id: o.id, tipo: 'Orden #' + o.id.substring(0,8) });
    }
  });

  if (opciones.length === 0) {
    openModal(`
      <div style="padding:24px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">Sin productos disponibles</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:24px">
          Primero debes comprar o recibir una cuenta para crear un reporte.
        </div>
        <button onclick="closeModal()" style="padding:14px 28px;background:#3b82f6;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Entendido</button>
      </div>
    `);
    return;
  }

  openModal(`
    <div style="padding:0">
      <div style="background:linear-gradient(135deg,#3b82f6,#1e40af);padding:24px;text-align:center;color:#fff">
        <div style="font-size:32px;margin-bottom:8px">➕</div>
        <div style="font-size:20px;font-weight:900">Nuevo Reporte</div>
      </div>
      
      <div style="padding:20px">
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px">📦 Producto o Cuenta *</label>
          <select id="crear_producto" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;background:#fff">
            <option value="">Selecciona un producto...</option>
            ${opciones.map(o => `<option value="${o.id}|${o.name}">${o.name} (${o.tipo})</option>`).join('')}
          </select>
        </div>
        
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px">📋 Tipo de Problema *</label>
          <select id="crear_categoria" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;background:#fff">
            <option value="">Selecciona...</option>
            <option value="Producto no llegó">📦 Producto no llegó</option>
            <option value="Defectuoso">⚠️ Defectuoso</option>
            <option value="No funciona">🚫 No funciona</option>
            <option value="Otro">❓ Otro</option>
          </select>
        </div>
        
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px">📝 Descripción del Problema *</label>
          <textarea id="crear_descripcion" rows="4" placeholder="Describe detalladamente el problema..." style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;resize:vertical;font-family:inherit"></textarea>
        </div>
        
        <div style="display:flex;gap:12px">
          <button onclick="closeModal()" style="flex:1;padding:14px;background:#fff;border:1px solid #d1d5db;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Cancelar</button>
          <button onclick="Soporte.crearReporte()" style="flex:1;padding:14px;background:#3b82f6;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">➕ Crear Reporte</button>
        </div>
      </div>
    </div>
  `);
};

Soporte.crearReporte = async function() {
  const productoSelect = document.getElementById('crear_producto');
  const categoria = document.getElementById('crear_categoria').value;
  const descripcion = document.getElementById('crear_descripcion').value.trim();
  
  if (!productoSelect.value) { toast('Selecciona un producto', 'bad'); return; }
  if (!categoria) { toast('Selecciona el tipo de problema', 'bad'); return; }
  if (!descripcion) { toast('Describe el problema', 'bad'); return; }
  
  const [id, name] = productoSelect.value.split('|');
  
  showLoading('Creando reporte...');
  try {
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        product_name: name,
        reason: categoria,
        description: descripcion,
        order_id: id,
        client_id: state.user?.id
      })
    });
    closeModal();
    toast('Reporte creado exitosamente', 'ok');
    await boot();
    setView('reports');
  } catch(e) {
    toast('Error: ' + e.message, 'bad');
  } finally {
    hideLoading();
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 🔍 FILTRAR Y CAMBIAR TAB
// ═══════════════════════════════════════════════════════════════════════

Soporte.cambiarTab = function(tab) {
  tabActual = tab;
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  
  document.getElementById('lista_reportes').innerHTML = renderLista(tab === 'activos' ? activos : resueltos);
  
  // Actualizar botones de pestañas
  const btnActivos = document.querySelector('[onclick="Soporte.cambiarTab(\'activos\')"]');
  const btnResueltos = document.querySelector('[onclick="Soporte.cambiarTab(\'resueltos\')"]');
  
  if (btnActivos && btnResueltos) {
    if (tab === 'activos') {
      btnActivos.style.background = '#3b82f6';
      btnActivos.style.color = '#fff';
      btnResueltos.style.background = '#fff';
      btnResueltos.style.color = '#6b7280';
    } else {
      btnActivos.style.background = '#fff';
      btnActivos.style.color = '#6b7280';
      btnResueltos.style.background = '#10b981';
      btnResueltos.style.color = '#fff';
    }
  }
};

Soporte.filtrar = function() {
  const busqueda = (document.getElementById('buscar_reporte')?.value || '').toLowerCase();
  const ordenar = document.getElementById('ordenar_reporte')?.value || 'nuevo';
  
  let reportes = state.reports || [];
  
  if (tabActual === 'activos') {
    reportes = reportes.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  } else {
    reportes = reportes.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  }
  
  if (busqueda) {
    reportes = reportes.filter(r => 
      (r.product_name || '').toLowerCase().includes(busqueda) ||
      (r.reason || '').toLowerCase().includes(busqueda)
    );
  }
  
  if (ordenar === 'viejo') {
    reportes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    reportes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  document.getElementById('lista_reportes').innerHTML = renderLista(reportes);
};

// ═══════════════════════════════════════════════════════════════════════
// 🔧 UTILIDADES
// ═══════════════════════════════════════════════════════════════════════

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

console.log('✅ Soporte Premium v3 cargado - Diseño claro y funcional');

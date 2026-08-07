/**
 * SOPORTE PREMIUM v4 - ESTÉTICA PREMIUM + FUNCIONAL
 * Enfoque: Qué pasa → Qué pasó → Solución
 */

const Soporte = {
  // Estados con estilo premium
  estados: {
    'Abierto': { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📋', label: 'Abierto' },
    'En revisión': { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: '🔍', label: 'En revisión' },
    'En proceso': { color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', icon: '⚙️', label: 'En proceso' },
    'Resuelto': { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: '✅', label: 'Resuelto' },
    'Rechazado': { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '❌', label: 'Rechazado' }
  },

  getEstado(s) { return this.estados[s] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: '📌', label: s }; },
  
  puedeEliminar(r) {
    if (!r || !state.user) return false;
    return r.user_id === state.user.id || r.client_id === state.user.id || 
           state.user.role === 'admin' || state.user.role === 'operator';
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 PANEL PRINCIPAL PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

let soporteTab = 'activos';

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));

  return `
    <div class="soporte-container">
      ${renderHeaderPremium(todos.length, activos.length, resueltos.length)}
      ${renderTabsPremium(activos.length, resueltos.length)}
      <div id="soporte_lista">${renderReportes(soporteTab === 'activos' ? activos : resueltos)}</div>
    </div>
    <style>
      .soporte-container { max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .soporte-header {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
        border-radius: 20px;
        padding: 28px;
        color: white;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(67, 56, 202, 0.3);
      }
      .soporte-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        border-radius: 50%;
      }
      .soporte-header::after {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -10%;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
        border-radius: 50%;
      }
      .soporte-header-content { position: relative; z-index: 1; }
      .soporte-title { font-size: 11px; letter-spacing: 2px; opacity: 0.8; margin-bottom: 4px; text-transform: uppercase; }
      .soporte-subtitle { font-size: 26px; font-weight: 800; margin-bottom: 20px; }
      .soporte-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .soporte-stat {
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 16px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s ease;
      }
      .soporte-stat:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }
      .soporte-stat-value { font-size: 32px; font-weight: 800; }
      .soporte-stat-label { font-size: 11px; opacity: 0.8; margin-top: 4px; }
      .soporte-btn-crear {
        position: absolute;
        top: 28px;
        right: 28px;
        padding: 12px 20px;
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 12px;
        color: white;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .soporte-btn-crear:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }
      .soporte-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      .soporte-tab {
        flex: 1;
        padding: 16px;
        border: none;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .soporte-tab-count {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
      }
      .soporte-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        margin-bottom: 16px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }
      .soporte-card:hover {
        border-color: #6366f1;
        box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
        transform: translateY(-4px);
      }
      .soporte-card-header {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .soporte-card-info { flex: 1; }
      .soporte-card-product { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 8px; }
      .soporte-card-motivo { 
        font-size: 13px; 
        color: #6b7280; 
        background: #f3f4f6;
        padding: 8px 12px;
        border-radius: 8px;
        display: inline-block;
      }
      .soporte-card-badge {
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
      .soporte-card-body { padding: 0 20px 20px; }
      .soporte-solucion {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border: 1px solid #6ee7b7;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 16px;
        position: relative;
      }
      .soporte-solucion::before {
        content: '💬 SOLUCIÓN';
        position: absolute;
        top: -10px;
        left: 16px;
        background: #10b981;
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }
      .soporte-solucion-texto { font-size: 14px; color: #065f46; line-height: 1.6; padding-top: 8px; }
      .soporte-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #f3f4f6;
      }
      .soporte-card-meta { font-size: 12px; color: #9ca3af; }
      .soporte-card-actions { display: flex; gap: 10px; }
      .soporte-btn {
        padding: 10px 18px;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .soporte-btn-ver { background: #6366f1; color: white; }
      .soporte-btn-ver:hover { background: #4f46e5; transform: scale(1.05); }
      .soporte-btn-eliminar { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .soporte-btn-eliminar:hover { background: #dc2626; color: white; }
      .soporte-empty {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border: 2px dashed #e5e7eb;
        border-radius: 20px;
      }
      .soporte-empty-icon { font-size: 64px; margin-bottom: 16px; }
      .soporte-empty-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }
      .soporte-empty-text { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
      .soporte-modal {
        background: white;
        border-radius: 24px;
        overflow: hidden;
        max-height: 90vh;
        overflow-y: auto;
      }
      .soporte-modal-header {
        padding: 24px;
        text-align: center;
        position: relative;
      }
      .soporte-modal-body { padding: 24px; }
      .soporte-modal-footer { padding: 16px 24px 24px; display: flex; gap: 12px; }
      .soporte-form-group { margin-bottom: 20px; }
      .soporte-form-label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .soporte-form-input, .soporte-form-select, .soporte-form-textarea {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        background: white;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .soporte-form-input:focus, .soporte-form-select:focus, .soporte-form-textarea:focus {
        border-color: #6366f1;
        outline: none;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .soporte-card { animation: fadeIn 0.3s ease; }
    </style>
    
    <script>
      // Event listeners para tabs
      document.addEventListener('click', function(e) {
        if (e.target.matches('[data-tab]') || e.target.closest('[data-tab]')) {
          const tab = e.target.closest('[data-tab]').dataset.tab;
          cambiarTabSoporte(tab);
        }
      });
    </script>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 HEADER PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

function renderHeaderPremium(total, activos, resueltos) {
  return `
    <div class="soporte-header">
      <button class="soporte-btn-crear" onclick="Soporte.mostrarCrear()">
        ➕ Nuevo
      </button>
      <div class="soporte-header-content">
        <div class="soporte-title">Centro de Soporte</div>
        <div class="soporte-subtitle">Mis Reportes</div>
        <div class="soporte-stats">
          <div class="soporte-stat">
            <div class="soporte-stat-value">${total}</div>
            <div class="soporte-stat-label">Total</div>
          </div>
          <div class="soporte-stat">
            <div class="soporte-stat-value" style="color:#fbbf24">${activos}</div>
            <div class="soporte-stat-label">Pendientes</div>
          </div>
          <div class="soporte-stat">
            <div class="soporte-stat-value" style="color:#34d399">${resueltos}</div>
            <div class="soporte-stat-label">Resueltos</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📑 TABS
// ═══════════════════════════════════════════════════════════════════════════

function renderTabsPremium(activos, resueltos) {
  const tabA = soporteTab === 'activos';
  return `
    <div class="soporte-tabs">
      <button class="soporte-tab" data-tab="activos" style="background:${tabA ? '#6366f1' : 'white'};color:${tabA ? 'white' : '#6b7280'};border:2px solid ${tabA ? '#6366f1' : '#e5e7eb'}">
        📋 Activos <span class="soporte-tab-count" style="background:${tabA ? 'rgba(255,255,255,0.2)' : '#f3f4f6'};color:${tabA ? 'white' : '#6b7280'}">${activos}</span>
      </button>
      <button class="soporte-tab" data-tab="resueltos" style="background:${!tabA ? '#10b981' : 'white'};color:${!tabA ? 'white' : '#6b7280'};border:2px solid ${!tabA ? '#10b981' : '#e5e7eb'}">
        ✅ Resueltos <span class="soporte-tab-count" style="background:${!tabA ? 'rgba(255,255,255,0.2)' : '#f3f4f6'};color:${!tabA ? 'white' : '#6b7280'}">${resueltos}</span>
      </button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📄 LISTA DE REPORTES
// ═══════════════════════════════════════════════════════════════════════════

function renderReportes(reportes) {
  if (!reportes || reportes.length === 0) {
    const icon = soporteTab === 'activos' ? '📭' : '✅';
    const title = soporteTab === 'activos' ? 'Sin reportes activos' : 'Sin reportes resueltos';
    const text = soporteTab === 'activos' ? '¿Tienes un problema? Crea un reporte.' : 'Los reportes resueltos aparecerán aquí.';
    return `
      <div class="soporte-empty">
        <div class="soporte-empty-icon">${icon}</div>
        <div class="soporte-empty-title">${title}</div>
        <div class="soporte-empty-text">${text}</div>
        ${soporteTab === 'activos' ? '<button class="soporte-btn soporte-btn-ver" onclick="Soporte.mostrarCrear()">➕ Crear Reporte</button>' : ''}
      </div>
    `;
  }

  return reportes.map((r, i) => renderCardPremium(r, i)).join('');
}

function renderCardPremium(r, index) {
  const estado = Soporte.getEstado(r.status);
  const puedeEliminar = Soporte.puedeEliminar(r);
  const tieneSolucion = r.provider_response || r.admin_response;
  const esResuelto = ['Resuelto', 'Rechazado'].includes(r.status);

  // Tiempo
  const fecha = new Date(r.updated_at || r.created_at);
  const ahora = new Date();
  const diffMins = Math.floor((ahora - fecha) / 60000);
  let tiempo = 'Ahora';
  if (diffMins >= 60) {
    const horas = Math.floor(diffMins / 60);
    if (horas >= 24) tiempo = `Hace ${Math.floor(horas/24)}d`;
    else tiempo = `Hace ${horas}h`;
  } else if (diffMins > 0) {
    tiempo = `Hace ${diffMins}m`;
  }

  return `
    <div class="soporte-card" style="animation-delay: ${index * 0.05}s" onclick="Soporte.verDetalle('${r.id}')">
      <div class="soporte-card-header">
        <div class="soporte-card-info">
          <div class="soporte-card-product">${escHtml(r.product_name || 'Producto')}</div>
          <div class="soporte-card-motivo">${escHtml(r.reason || 'Sin motivo')}</div>
        </div>
        <div class="soporte-card-badge" style="background:${estado.bg};color:${estado.color};border:1px solid ${estado.border}">
          ${estado.icon} ${estado.label}
        </div>
      </div>
      
      ${tieneSolucion ? `
        <div class="soporte-card-body">
          <div class="soporte-solucion">
            <div class="soporte-solucion-texto">${escHtml(tieneSolucion)}</div>
          </div>
        </div>
      ` : ''}
      
      <div class="soporte-card-footer">
        <div class="soporte-card-meta">
          📅 ${tiempo}
          ${r.order_id ? ` · 📦 #${r.order_id.substring(0,8)}` : ''}
        </div>
        <div class="soporte-card-actions" onclick="event.stopPropagation()">
          <button class="soporte-btn soporte-btn-ver" onclick="Soporte.verDetalle('${r.id}')">
            👁️ Ver
          </button>
          ${puedeEliminar ? `
            <button class="soporte-btn soporte-btn-eliminar" onclick="Soporte.eliminar('${r.id}')">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 CAMBIAR TAB
// ═══════════════════════════════════════════════════════════════════════════

function cambiarTabSoporte(tab) {
  soporteTab = tab;
  const todos = state.reports || [];
  const reportes = tab === 'activos' 
    ? todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status))
    : todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));
  
  // Actualizar lista
  document.getElementById('soporte_lista').innerHTML = renderReportes(reportes);
  
  // Actualizar tabs visualmente
  document.querySelectorAll('[data-tab]').forEach(btn => {
    const isActivos = btn.dataset.tab === 'activos';
    const isSelected = (tab === 'activos' && isActivos) || (tab === 'resueltos' && !isActivos);
    
    if (isSelected) {
      btn.style.background = isActivos ? '#6366f1' : '#10b981';
      btn.style.color = 'white';
      btn.style.borderColor = isActivos ? '#6366f1' : '#10b981';
      btn.querySelector('.soporte-tab-count').style.background = 'rgba(255,255,255,0.2)';
      btn.querySelector('.soporte-tab-count').style.color = 'white';
    } else {
      btn.style.background = 'white';
      btn.style.color = '#6b7280';
      btn.style.borderColor = '#e5e7eb';
      btn.querySelector('.soporte-tab-count').style.background = '#f3f4f6';
      btn.querySelector('.soporte-tab-count').style.color = '#6b7280';
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 👁️ VER DETALLE
// ═══════════════════════════════════════════════════════════════════════════

Soporte.verDetalle = function(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) { toast('Reporte no encontrado', 'bad'); return; }
  
  const estado = Soporte.getEstado(r.status);
  const puedeEliminar = Soporte.puedeEliminar(r);
  const fecha = new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  openModal(`
    <div class="soporte-modal">
      <div class="soporte-modal-header" style="background:linear-gradient(135deg,${estado.color},${estado.color}dd)">
        <div style="font-size:48px;margin-bottom:12px">${estado.icon}</div>
        <div style="font-size:22px;font-weight:800;color:white;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
        <div style="display:inline-block;padding:8px 20px;background:rgba(255,255,255,0.2);border-radius:20px;color:white;font-size:14px;font-weight:700">${estado.label}</div>
      </div>
      
      <div class="soporte-modal-body">
        <div class="soporte-form-group">
          <div class="soporte-form-label">📋 MOTIVO</div>
          <div style="padding:16px;background:#f9fafb;border-radius:12px;font-size:15px">${escHtml(r.reason || 'Sin motivo')}</div>
        </div>
        
        ${r.description ? `
          <div class="soporte-form-group">
            <div class="soporte-form-label">📄 DESCRIPCIÓN</div>
            <div style="padding:16px;background:#f9fafb;border-radius:12px;font-size:14px;line-height:1.6;color:#374151">${escHtml(r.description)}</div>
          </div>
        ` : ''}
        
        ${r.provider_response || r.admin_response ? `
          <div class="soporte-form-group">
            <div class="soporte-form-label" style="color:#059669">💬 SOLUCIÓN</div>
            <div style="padding:20px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:14px;font-size:15px;line-height:1.7;color:#065f46">${escHtml(r.provider_response || r.admin_response)}</div>
          </div>
        ` : ''}
        
        ${r.status === 'Rechazado' && r.rejection_reason ? `
          <div class="soporte-form-group">
            <div class="soporte-form-label" style="color:#dc2626">❌ MOTIVO DEL RECHAZO</div>
            <div style="padding:16px;background:#fef2f2;border-radius:12px;font-size:14px;color:#991b1b">${escHtml(r.rejection_reason)}</div>
          </div>
        ` : ''}
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">
          <div style="padding:14px;background:#f9fafb;border-radius:12px;text-align:center">
            <div style="font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Creado</div>
            <div style="font-size:13px;font-weight:700">${fecha}</div>
          </div>
          ${r.order_id ? `
            <div style="padding:14px;background:#f9fafb;border-radius:12px;text-align:center">
              <div style="font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Pedido</div>
              <div style="font-size:13px;font-weight:700;font-family:monospace">#${r.order_id.substring(0,8)}</div>
            </div>
          ` : '<div></div>'}
        </div>
      </div>
      
      <div class="soporte-modal-footer">
        <button onclick="closeModal()" style="flex:1;padding:16px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer">Cerrar</button>
        ${puedeEliminar ? `
          <button onclick="closeModal();setTimeout(()=>Soporte.eliminar('${r.id}'),300)" style="flex:1;padding:16px;background:#fef2f2;border:2px solid #fecaca;border-radius:12px;color:#dc2626;font-size:15px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>
        ` : ''}
      </div>
    </div>
  `);
};

// ═══════════════════════════════════════════════════════════════════════════
// 🗑️ ELIMINAR
// ═══════════════════════════════════════════════════════════════════════════

Soporte.eliminar = function(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) { toast('Reporte no encontrado', 'bad'); return; }
  
  openModal(`
    <div style="padding:32px;text-align:center">
      <div style="font-size:64px;margin-bottom:16px">🗑️</div>
      <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">¿Eliminar este reporte?</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:24px">
        <strong>${escHtml(r.product_name || 'Producto')}</strong><br>
        ${escHtml(r.reason || '')}
      </div>
      <div style="display:flex;gap:12px">
        <button onclick="closeModal()" style="flex:1;padding:16px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer">Cancelar</button>
        <button onclick="Soporte.confirmarEliminar('${id}')" style="flex:1;padding:16px;background:#dc2626;border:none;border-radius:12px;color:white;font-size:15px;font-weight:700;cursor:pointer">🗑️ Eliminar</button>
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
    hideLoading();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ➕ CREAR REPORTE
// ═══════════════════════════════════════════════════════════════════════════

Soporte.mostrarCrear = function() {
  // Obtener productos y órdenes del usuario
  const ordenes = (state.orders || []).filter(o => o.user_id === state.user?.id || o.client_id === state.user?.id);
  const productos = (state.products || []).filter(p => p.user_id === state.user?.id || p.client_id === state.user?.id);
  
  const opciones = [];
  const seen = new Set();
  
  productos.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); opciones.push({ name: p.name, id: p.id, tipo: 'Producto' }); } });
  ordenes.forEach(o => { if (!seen.has(o.product_name)) { seen.add(o.product_name); opciones.push({ name: o.product_name, id: o.id, tipo: 'Orden' }); } });

  if (opciones.length === 0) {
    openModal(`
      <div style="padding:32px;text-align:center">
        <div style="font-size:64px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:8px">Sin productos disponibles</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:24px">Primero compra o recibe una cuenta.</div>
        <button onclick="closeModal()" style="padding:14px 28px;background:#6366f1;border:none;border-radius:12px;color:white;font-size:15px;font-weight:700;cursor:pointer">Entendido</button>
      </div>
    `);
    return;
  }

  openModal(`
    <div class="soporte-modal">
      <div class="soporte-modal-header" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">
        <div style="font-size:40px;margin-bottom:8px">➕</div>
        <div style="font-size:20px;font-weight:800;color:white">Nuevo Reporte</div>
      </div>
      
      <div class="soporte-modal-body">
        <div class="soporte-form-group">
          <label class="soporte-form-label">📦 Producto o Cuenta *</label>
          <select id="crear_producto" class="soporte-form-select">
            <option value="">Selecciona...</option>
            ${opciones.map(o => `<option value="${o.id}|${o.name}">${o.name} (${o.tipo})</option>`).join('')}
          </select>
        </div>
        
        <div class="soporte-form-group">
          <label class="soporte-form-label">📋 Tipo de Problema *</label>
          <select id="crear_categoria" class="soporte-form-select">
            <option value="">Selecciona...</option>
            <option value="Producto no llegó">📦 Producto no llegó</option>
            <option value="Defectuoso">⚠️ Defectuoso</option>
            <option value="No funciona">🚫 No funciona</option>
            <option value="Otro">❓ Otro</option>
          </select>
        </div>
        
        <div class="soporte-form-group">
          <label class="soporte-form-label">📝 Describe el problema *</label>
          <textarea id="crear_descripcion" class="soporte-form-textarea" rows="4" placeholder="Cuéntanos qué pasó..."></textarea>
        </div>
      </div>
      
      <div class="soporte-modal-footer">
        <button onclick="closeModal()" style="flex:1;padding:16px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer">Cancelar</button>
        <button onclick="Soporte.crearReporte()" style="flex:1;padding:16px;background:#6366f1;border:none;border-radius:12px;color:white;font-size:15px;font-weight:700;cursor:pointer">➕ Crear</button>
      </div>
    </div>
  `);
};

Soporte.crearReporte = async function() {
  const sel = document.getElementById('crear_producto');
  const cat = document.getElementById('crear_categoria').value;
  const desc = document.getElementById('crear_descripcion').value.trim();
  
  if (!sel.value) { toast('Selecciona un producto', 'bad'); return; }
  if (!cat) { toast('Selecciona el tipo de problema', 'bad'); return; }
  if (!desc) { toast('Describe el problema', 'bad'); return; }
  
  const [id, name] = sel.value.split('|');
  
  showLoading('Creando...');
  try {
    await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        product_name: name,
        reason: cat,
        description: desc,
        order_id: id,
        client_id: state.user?.id
      })
    });
    closeModal();
    toast('Reporte creado', 'ok');
    await boot();
    setView('reports');
  } catch(e) {
    toast('Error: ' + e.message, 'bad');
    hideLoading();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

console.log('✅ Soporte Premium v4 - Estética premium + Funcional');

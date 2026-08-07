/**
 * SOPORTE PREMIUM v10 - COLORES MORADOS CORREGIDOS
 */

const Soporte = {
  tabActual: 'pendientes',
  
  estados: {
    'Abierto': { color: '#7c3aed', bg: '#f5f3ff', icon: '📋' },
    'En revisión': { color: '#f59e0b', bg: '#fffbeb', icon: '🔍' },
    'En proceso': { color: '#8b5cf6', bg: '#f5f3ff', icon: '⚙️' },
    'Resuelto': { color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    'Rechazado': { color: '#ef4444', bg: '#fef2f2', icon: '❌' }
  },
  
  getEstado(s) { return this.estados[s] || { color: '#7c3aed', bg: '#f5f3ff', icon: '📌' }; },
  
  puedeEliminar(r) {
    if (!r || !state.user) return false;
    return r.user_id === state.user.id || r.client_id === state.user.id || 
           state.user.role === 'admin' || state.user.role === 'operator';
  },
  
  getReportes() {
    const todos = state.reports || [];
    switch(this.tabActual) {
      case 'pendientes': return todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
      case 'resueltos': return todos.filter(r => r.status === 'Resuelto');
      case 'rechazados': return todos.filter(r => r.status === 'Rechazado');
      default: return todos;
    }
  },
  
  cambiarTab(tab) {
    this.tabActual = tab;
    this.render();
  },
  
  render() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const esActivo = btn.dataset.tab === this.tabActual;
      if (esActivo) {
        btn.style.background = '#7c3aed';
        btn.style.color = 'white';
        btn.style.borderColor = '#7c3aed';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#6b7280';
        btn.style.borderColor = '#e5e7eb';
      }
    });
    document.getElementById('soporte_lista').innerHTML = this.renderReportes();
  },
  
  renderReportes() {
    const reportes = this.getReportes().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (reportes.length === 0) {
      const info = {
        pendientes: { icon: '📋', titulo: 'No hay reportes pendientes' },
        resueltos: { icon: '✅', titulo: 'No hay reportes resueltos' },
        rechazados: { icon: '❌', titulo: 'No hay reportes rechazados' }
      };
      const i = info[this.tabActual];
      return `
        <div style="text-align:center;padding:60px 20px;background:white;border-radius:16px;border:2px dashed #e5e7eb">
          <div style="font-size:64px;margin-bottom:16px">${i.icon}</div>
          <div style="font-size:18px;font-weight:700;color:#111827">${i.titulo}</div>
        </div>
      `;
    }
    
    return reportes.map((r, i) => this.renderCard(r, i)).join('');
  },
  
  renderCard(r, index) {
    const estado = this.getEstado(r.status);
    const tiempo = this.getTiempo(r.created_at);
    
    return `
      <div onclick="Soporte.verDetalle('${r.id}')" style="background:white;border:1px solid #e5e7eb;border-radius:16px;margin-bottom:12px;padding:18px 20px;cursor:pointer;transition:all 0.3s"
        onmouseover="this.style.borderColor='#7c3aed';this.style.boxShadow='0 4px 12px rgba(124,58,237,0.15)'"
        onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="flex:1">
            <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
            <div style="font-size:13px;color:#6b7280">${escHtml(r.reason || 'Sin motivo')} · ${tiempo}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:${estado.bg};color:${estado.color}">${estado.icon} ${r.status}</span>
            <span style="color:#9ca3af;font-size:18px">→</span>
          </div>
        </div>
      </div>
    `;
  },
  
  getTiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    if (diffMins < 60) return `Hace ${diffMins}min`;
    const horas = Math.floor(diffMins / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas/24)}d`;
  },
  
  verDetalle(id) {
    const r = state.reports.find(x => x.id === id);
    if (!r) { toast('No encontrado', 'bad'); return; }
    
    const estado = this.getEstado(r.status);
    const puedeEliminar = this.puedeEliminar(r);
    const solucion = r.provider_response || r.admin_response;
    const rechazo = r.status === 'Rechazado' ? r.rejection_reason : null;
    const fecha = new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    openModal(`
      <div style="background:white;border-radius:20px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:24px;text-align:center;color:white">
          <div style="font-size:40px;margin-bottom:8px">${estado.icon}</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
          <div style="font-size:14px;opacity:0.9">${r.status}</div>
        </div>
        
        <div style="padding:20px">
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px">📋 MOTIVO</div>
            <div style="padding:12px;background:#f9fafb;border-radius:10px;font-size:14px">${escHtml(r.reason || 'Sin motivo')}</div>
          </div>
          
          ${r.description ? `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px">📄 DESCRIPCIÓN</div>
              <div style="padding:12px;background:#f9fafb;border-radius:10px;font-size:14px;line-height:1.5">${escHtml(r.description)}</div>
            </div>
          ` : ''}
          
          ${solucion ? `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;margin-bottom:6px">💬 RESPUESTA</div>
              <div style="padding:16px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:12px;font-size:14px;line-height:1.6;color:#065f46">${escHtml(solucion)}</div>
            </div>
          ` : ''}
          
          ${rechazo ? `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:6px">❌ RECHAZADO</div>
              <div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;font-size:14px;line-height:1.6;color:#991b1b">${escHtml(rechazo)}</div>
            </div>
          ` : ''}
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            <div style="padding:12px;background:#f9fafb;border-radius:10px;text-align:center">
              <div style="font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">📅 CREADO</div>
              <div style="font-size:13px;font-weight:600">${fecha}</div>
            </div>
            ${r.order_id ? `
              <div style="padding:12px;background:#f9fafb;border-radius:10px;text-align:center">
                <div style="font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">📦 PEDIDO</div>
                <div style="font-size:13px;font-weight:600;font-family:monospace">#${r.order_id.substring(0,8)}</div>
              </div>
            ` : '<div></div>'}
          </div>
          
          <div style="display:flex;gap:10px">
            <button onclick="closeModal()" style="flex:1;padding:14px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer">Cerrar</button>
            ${puedeEliminar ? `
              <button onclick="Soporte.confirmarEliminar('${r.id}')" style="flex:1;padding:14px;background:#fef2f2;border:2px solid #fecaca;border-radius:12px;color:#dc2626;font-size:14px;font-weight:600;cursor:pointer">🗑️ Eliminar</button>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  },
  
  eliminar(id) {
    const r = state.reports.find(x => x.id === id);
    if (!r) { toast('No encontrado', 'bad'); return; }
    
    openModal(`
      <div style="padding:32px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">🗑️</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px">¿Eliminar este reporte?</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:24px">${escHtml(r.product_name || 'Producto')}</div>
        <div style="display:flex;gap:12px">
          <button onclick="closeModal()" style="flex:1;padding:14px;background:white;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
          <button onclick="Soporte.confirmarEliminar('${r.id}')" style="flex:1;padding:14px;background:#dc2626;border:none;border-radius:10px;color:white;font-size:14px;font-weight:600;cursor:pointer">🗑️ Eliminar</button>
        </div>
      </div>
    `);
  },
  
  async confirmarEliminar(id) {
    closeModal();
    showLoading('Eliminando...');
    try {
      await api('reports', { method: 'DELETE', body: JSON.stringify({ id: id }) });
      toast('Eliminado', 'ok');
      await boot();
      setView('reports');
    } catch(e) {
      toast('Error: ' + e.message, 'bad');
      hideLoading();
    }
  },
  
  mostrarCrear() {
    const ordenes = (state.orders || []).filter(o => o.user_id === state.user?.id || o.client_id === state.user?.id);
    const productos = (state.products || []).filter(p => p.user_id === state.user?.id || p.client_id === state.user?.id);
    
    const opciones = [];
    const seen = new Set();
    productos.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); opciones.push({ name: p.name, id: p.id }); } });
    ordenes.forEach(o => { if (!seen.has(o.product_name)) { seen.add(o.product_name); opciones.push({ name: o.product_name, id: o.id }); } });
    
    if (opciones.length === 0) {
      openModal(`
        <div style="padding:32px;text-align:center">
          <div style="font-size:56px;margin-bottom:16px">📦</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:8px">Sin productos</div>
          <div style="font-size:14px;color:#6b7280;margin-bottom:24px">Primero compra o recibe una cuenta.</div>
          <button onclick="closeModal()" style="padding:12px 24px;background:#7c3aed;border:none;border-radius:10px;color:white;font-size:14px;font-weight:600;cursor:pointer">Entendido</button>
        </div>
      `);
      return;
    }
    
    openModal(`
      <div style="background:white;border-radius:20px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:24px;text-align:center;color:white">
          <div style="font-size:32px;margin-bottom:8px">➕</div>
          <div style="font-size:18px;font-weight:700">Nuevo Reporte</div>
        </div>
        <div style="padding:24px">
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px">📦 Producto</label>
            <select id="crear_producto" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px">
              <option value="">Selecciona...</option>
              ${opciones.map(o => `<option value="${o.id}|${o.name}">${o.name}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px">📋 Problema</label>
            <select id="crear_categoria" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px">
              <option value="">Selecciona...</option>
              <option value="Producto no llegó">📦 Producto no llegó</option>
              <option value="Defectuoso">⚠️ Defectuoso</option>
              <option value="No funciona">🚫 No funciona</option>
              <option value="Otro">❓ Otro</option>
            </select>
          </div>
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px">📝 Describe qué pasó</label>
            <textarea id="crear_descripcion" rows="4" placeholder="Cuéntanos qué pasó..." style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;resize:vertical"></textarea>
          </div>
          <div style="display:flex;gap:12px">
            <button onclick="closeModal()" style="flex:1;padding:14px;background:white;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
            <button onclick="Soporte.crearReporte()" style="flex:1;padding:14px;background:#7c3aed;border:none;border-radius:10px;color:white;font-size:14px;font-weight:600;cursor:pointer">Crear</button>
          </div>
        </div>
      </div>
    `);
  },
  
  async crearReporte() {
    const sel = document.getElementById('crear_producto');
    const cat = document.getElementById('crear_categoria');
    const desc = document.getElementById('crear_descripcion');
    
    if (!sel.value) { toast('Selecciona producto', 'bad'); return; }
    if (!cat.value) { toast('Selecciona problema', 'bad'); return; }
    if (!desc.value.trim()) { toast('Describe qué pasó', 'bad'); return; }
    
    const [id, name] = sel.value.split('|');
    
    showLoading('Creando...');
    try {
      await api('reports', {
        method: 'POST',
        body: JSON.stringify({
          product_name: name,
          reason: cat.value,
          description: desc.value.trim(),
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
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

function reportsUserSimple() {
  const stats = {
    pendientes: (state.reports || []).filter(r => !['Resuelto', 'Rechazado'].includes(r.status)).length,
    resueltos: (state.reports || []).filter(r => r.status === 'Resuelto').length,
    rechazados: (state.reports || []).filter(r => r.status === 'Rechazado').length
  };
  
  return `
    <div style="max-width:700px;margin:0 auto">
      
      <!-- HEADER CUADRITO MORADO -->
      <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);border-radius:20px;padding:28px;margin-bottom:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%"></div>
        <div style="position:absolute;bottom:-80px;left:-40px;width:250px;height:250px;background:rgba(255,255,255,0.05);border-radius:50%"></div>
        
        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Centro de Soporte</div>
            <h1 style="font-size:26px;font-weight:800;color:white;margin:0">Mis Reportes</h1>
          </div>
          <button onclick="Soporte.mostrarCrear()" style="padding:14px 24px;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);border-radius:14px;color:white;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px">
            ➕ Nuevo Reporte
          </button>
        </div>
      </div>
      
      <!-- TABS MORADOS -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <button onclick="Soporte.cambiarTab('pendientes')" data-tab="pendientes" class="tab-btn" style="${Soporte.tabActual === 'pendientes' ? 'background:#7c3aed;color:white;border-color:#7c3aed' : 'background:white;color:#6b7280;border-color:#e5e7eb'}">
          📋 Pendientes <span class="tab-count">${stats.pendientes}</span>
        </button>
        <button onclick="Soporte.cambiarTab('resueltos')" data-tab="resueltos" class="tab-btn" style="${Soporte.tabActual === 'resueltos' ? 'background:#7c3aed;color:white;border-color:#7c3aed' : 'background:white;color:#6b7280;border-color:#e5e7eb'}">
          ✅ Resueltos <span class="tab-count">${stats.resueltos}</span>
        </button>
        <button onclick="Soporte.cambiarTab('rechazados')" data-tab="rechazados" class="tab-btn" style="${Soporte.tabActual === 'rechazados' ? 'background:#7c3aed;color:white;border-color:#7c3aed' : 'background:white;color:#6b7280;border-color:#e5e7eb'}">
          ❌ Rechazados <span class="tab-count">${stats.rechazados}</span>
        </button>
      </div>
      
      <style>
        .tab-btn { padding:14px 16px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;font-weight:700;color:#6b7280;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:8px }
        .tab-btn:hover { border-color:#7c3aed }
        .tab-count { padding:3px 8px;background:#f3f4f6;color:#6b7280;border-radius:20px;font-size:12px }
      </style>
      
      <!-- Lista -->
      <div id="soporte_lista">${Soporte.renderReportes()}</div>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

console.log('✅ Soporte Premium v10 - Colores morados');

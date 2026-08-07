/**
 * SOPORTE PREMIUM v12 - TU REPORTE vs RESPUESTA DEL ADMIN
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
      btn.style.background = esActivo ? '#7c3aed' : 'white';
      btn.style.color = esActivo ? 'white' : '#6b7280';
      btn.style.borderColor = esActivo ? '#7c3aed' : '#e5e7eb';
      btn.querySelector('.count').style.background = esActivo ? 'rgba(255,255,255,0.25)' : '#f3f4f6';
      btn.querySelector('.count').style.color = esActivo ? 'white' : '#6b7280';
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
    const solucion = r.provider_response || r.admin_response;
    const rechazo = r.status === 'Rechazado' ? r.rejection_reason : null;
    const bordeColor = estado.color;
    
    return `
      <div onclick="Soporte.verDetalle('${r.id}')" style="background:white;border-radius:18px;margin-bottom:16px;overflow:hidden;cursor:pointer;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);border:2px solid transparent;animation:slideIn 0.5s ease ${index * 0.1}s both"
        onmouseover="this.style.borderColor='${bordeColor}';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px ${bordeColor}25'"
        onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)';this.style.boxShadow='none'">
        
        <!-- Barra de color -->
        <div style="height:5px;background:linear-gradient(90deg,${bordeColor},${bordeColor}80)"></div>
        
        <div style="padding:20px">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
            <div style="flex:1">
              <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">${this.getServiceIcon(r.product_name)}</span>
                ${escHtml(r.product_name || 'Producto')}
              </div>
              <span style="display:inline-flex;padding:8px 14px;background:${estado.bg};color:${estado.color};border-radius:10px;font-size:13px;font-weight:700;align-items:center;gap:6px">
                ${estado.icon} ${r.status}
              </span>
            </div>
            <div style="color:#7c3aed;font-size:22px;font-weight:700">→</div>
          </div>
          
          <!-- 📝 TU REPORTE -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:12px">
            <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">
              📝 TU REPORTE
            </div>
            <div style="font-size:14px;color:#374151;line-height:1.6">
              <strong style="color:#7c3aed">Problema:</strong> ${escHtml(r.reason || 'Sin motivo')}
            </div>
            ${r.description ? `
              <div style="font-size:13px;color:#6b7280;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">
                ${escHtml(r.description)}
              </div>
            ` : ''}
          </div>
          
          <!-- 💬 RESPUESTA DEL ADMINISTRADOR -->
          ${solucion ? `
            <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:12px;padding:14px;margin-bottom:12px">
              <div style="font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">
                💬 RESPUESTA DEL ADMINISTRADOR
              </div>
              <div style="font-size:14px;color:#065f46;line-height:1.7">
                ${escHtml(solucion)}
              </div>
            </div>
          ` : ''}
          
          <!-- ❌ MOTIVO DEL RECHAZO -->
          ${rechazo ? `
            <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:12px">
              <div style="font-size:10px;font-weight:800;color:#dc2626;text-transform:uppercase;margin-bottom:8px">
                ❌ MOTIVO DEL RECHAZO
              </div>
              <div style="font-size:14px;color:#991b1b;line-height:1.6">
                ${escHtml(rechazo)}
              </div>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #f1f5f9">
            <span style="font-size:12px;color:#94a3b8">🕐 ${tiempo}</span>
            ${r.order_id ? `<span style="font-size:12px;color:#94a3b8">📦 #${r.order_id.substring(0,8)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  getServiceIcon(name) {
    if (!name) return '📦';
    const n = name.toLowerCase();
    if (n.includes('netflix')) return '🎬';
    if (n.includes('spotify')) return '🎵';
    if (n.includes('disney')) return '🏰';
    if (n.includes('prime')) return '📺';
    if (n.includes('hbo') || n.includes('max')) return '🎥';
    if (n.includes('youtube')) return '▶️';
    return '📦';
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
          <div style="font-size:40px;margin-bottom:8px">${this.getServiceIcon(r.product_name)}</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:4px">${escHtml(r.product_name || 'Producto')}</div>
          <div style="font-size:14px;opacity:0.9;display:flex;align-items:center;justify-content:center;gap:8px">
            ${estado.icon} ${r.status}
          </div>
        </div>
        
        <div style="padding:20px">
          <!-- 📝 TU REPORTE -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px">
            <div style="font-size:10px;font-weight:800;color:#7c3aed;text-transform:uppercase;margin-bottom:10px">📝 TU REPORTE</div>
            <div style="font-size:15px;color:#374151;margin-bottom:8px"><strong>Problema:</strong> ${escHtml(r.reason || 'Sin motivo')}</div>
            ${r.description ? `<div style="font-size:14px;color:#6b7280;line-height:1.6">${escHtml(r.description)}</div>` : ''}
          </div>
          
          <!-- 💬 RESPUESTA DEL ADMINISTRADOR -->
          ${solucion ? `
            <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:12px;padding:16px;margin-bottom:16px">
              <div style="font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;margin-bottom:10px">💬 RESPUESTA DEL ADMINISTRADOR</div>
              <div style="font-size:15px;color:#065f46;line-height:1.7">${escHtml(solucion)}</div>
            </div>
          ` : ''}
          
          <!-- ❌ RECHAZO -->
          ${rechazo ? `
            <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:16px">
              <div style="font-size:10px;font-weight:800;color:#dc2626;text-transform:uppercase;margin-bottom:10px">❌ MOTIVO DEL RECHAZO</div>
              <div style="font-size:14px;color:#991b1b;line-height:1.6">${escHtml(rechazo)}</div>
            </div>
          ` : ''}
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            <div style="padding:14px;background:#f8fafc;border-radius:10px;text-align:center">
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px">📅 Creado</div>
              <div style="font-size:13px;font-weight:600">${fecha}</div>
            </div>
            ${r.order_id ? `
              <div style="padding:14px;background:#f8fafc;border-radius:10px;text-align:center">
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px">📦 Pedido</div>
                <div style="font-size:13px;font-weight:600;font-family:monospace">#${r.order_id.substring(0,8)}</div>
              </div>
            ` : '<div></div>'}
          </div>
          
          <div style="display:flex;gap:10px">
            <button onclick="closeModal()" style="flex:1;padding:16px;background:#7c3aed;border:none;border-radius:12px;font-size:15px;font-weight:700;color:white;cursor:pointer;transition:all 0.3s"
              onmouseover="this.style.background='#6d28d9'"
              onmouseout="this.style.background='#7c3aed'">
              ✓ Cerrar
            </button>
            ${puedeEliminar ? `
              <button onclick="Soporte.confirmarEliminar('${r.id}')" style="flex:1;padding:16px;background:#fef2f2;border:2px solid #fecaca;border-radius:12px;font-size:15px;font-weight:700;color:#dc2626;cursor:pointer">
                🗑️ Eliminar
              </button>
            ` : ''}
          </div>
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
        <div style="padding:32px;text-align:center;background:white;border-radius:16px">
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
    <style>
      @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    <div style="max-width:700px;margin:0 auto">
      
      <!-- HEADER MORADO -->
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
      
      <!-- TABS -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <button onclick="Soporte.cambiarTab('pendientes')" data-tab="pendientes" class="tab-btn">
          📋 Pendientes <span class="count" style="padding:4px 10px;background:#f3f4f6;color:#6b7280;border-radius:20px;font-size:12px;font-weight:700">${stats.pendientes}</span>
        </button>
        <button onclick="Soporte.cambiarTab('resueltos')" data-tab="resueltos" class="tab-btn">
          ✅ Resueltos <span class="count" style="padding:4px 10px;background:#f3f4f6;color:#6b7280;border-radius:20px;font-size:12px;font-weight:700">${stats.resueltos}</span>
        </button>
        <button onclick="Soporte.cambiarTab('rechazados')" data-tab="rechazados" class="tab-btn">
          ❌ Rechazados <span class="count" style="padding:4px 10px;background:#f3f4f6;color:#6b7280;border-radius:20px;font-size:12px;font-weight:700">${stats.rechazados}</span>
        </button>
      </div>
      
      <style>
        .tab-btn { padding:14px 16px;background:white;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;font-weight:700;color:#6b7280;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:8px }
        .tab-btn:hover { border-color:#7c3aed }
      </style>
      
      <div id="soporte_lista">${Soporte.renderReportes()}</div>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

console.log('✅ Soporte Premium v12 - Tu Reporte vs Respuesta');

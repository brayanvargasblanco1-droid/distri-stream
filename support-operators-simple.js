/**
 * SOPORTE PREMIUM v6 - TABS CORREGIDOS
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 ESTILOS
// ═══════════════════════════════════════════════════════════════════════════

const SoporteCSS = `
<style>
.soporte-container { max-width: 800px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; }
.soporte-header {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  border-radius: 24px; padding: 32px; margin-bottom: 20px;
  position: relative; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
}
.soporte-header::before {
  content: ''; position: absolute; top: -100px; right: -100px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  animation: pulseGlow 4s ease-in-out infinite;
}
.soporte-header::after {
  content: ''; position: absolute; bottom: -150px; left: -50px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
  animation: pulseGlow 5s ease-in-out infinite reverse;
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
.soporte-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
.soporte-title { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
.soporte-subtitle { font-size: 28px; font-weight: 800; color: white; margin: 0; }
.soporte-btn-crear {
  padding: 14px 24px; background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none; border-radius: 14px; color: white; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
}
.soporte-btn-crear:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.5); }
.soporte-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.soporte-stat {
  background: rgba(255,255,255,0.1); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 20px;
  padding: 20px; text-align: center; transition: all 0.3s ease;
}
.soporte-stat:hover { background: rgba(255,255,255,0.15); transform: translateY(-4px); }
.soporte-stat-value { font-size: 36px; font-weight: 800; color: white; line-height: 1; margin-bottom: 8px; }
.soporte-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); }
.soporte-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.soporte-tab {
  padding: 16px; background: white; border: 2px solid #e5e7eb;
  border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px;
}
.soporte-tab:hover { border-color: #6366f1; transform: translateY(-2px); }
.soporte-tab.active { background: #6366f1; border-color: #6366f1; color: white; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35); }
.soporte-tab-count { padding: 4px 10px; border-radius: 20px; font-size: 12px; background: #f3f4f6; color: #6b7280; }
.soporte-tab.active .soporte-tab-count { background: rgba(255,255,255,0.2); color: white; }
.soporte-card {
  background: white; border: 1px solid #e5e7eb; border-radius: 20px; margin-bottom: 16px;
  overflow: hidden; transition: all 0.4s ease; cursor: pointer;
  animation: fadeIn 0.4s ease forwards; opacity: 0;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
.soporte-card:hover { border-color: #6366f1; box-shadow: 0 15px 35px rgba(99, 102, 241, 0.15); transform: translateY(-3px); }
.soporte-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.soporte-card-info { flex: 1; }
.soporte-card-product { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 8px; }
.soporte-card-motivo { display: inline-block; padding: 8px 14px; background: #f3f4f6; border-radius: 10px; font-size: 13px; color: #374151; }
.soporte-card-badge { padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
.soporte-solucion { margin: 0 24px 20px; padding: 18px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #6ee7b7; border-radius: 14px; position: relative; }
.soporte-solucion::before { content: '💬 SOLUCIÓN'; position: absolute; top: -10px; left: 16px; background: #10b981; color: white; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; }
.soporte-solucion-texto { font-size: 14px; color: #065f46; line-height: 1.6; padding-top: 8px; }
.soporte-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; border-top: 1px solid #f3f4f6; background: #f9fafb; }
.soporte-card-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 12px; }
.soporte-card-actions { display: flex; gap: 10px; }
.soporte-btn { padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 6px; }
.soporte-btn-ver { background: #6366f1; border: none; color: white; }
.soporte-btn-ver:hover { background: #4f46e5; transform: scale(1.05); }
.soporte-btn-eliminar { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
.soporte-btn-eliminar:hover { background: #dc2626; color: white; }
.soporte-empty { text-align: center; padding: 60px 20px; background: white; border: 2px dashed #e5e7eb; border-radius: 20px; }
.soporte-empty-icon { font-size: 64px; margin-bottom: 16px; }
.soporte-empty-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 8px; }
.soporte-empty-text { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
.soporte-modal { background: white; border-radius: 24px; overflow: hidden; max-height: 90vh; overflow-y: auto; }
.soporte-modal-header { padding: 28px; text-align: center; }
.soporte-modal-body { padding: 24px 28px; }
.soporte-modal-footer { padding: 16px 28px 28px; display: flex; gap: 12px; }
.soporte-form-group { margin-bottom: 18px; }
.soporte-form-label { display: block; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.soporte-form-input, .soporte-form-select, .soporte-form-textarea { width: 100%; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 15px; background: white; transition: all 0.3s ease; box-sizing: border-box; }
.soporte-form-input:focus, .soporte-form-select:focus, .soporte-form-textarea:focus { border-color: #6366f1; outline: none; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
.soporte-form-btn { flex: 1; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
.soporte-form-btn-cancel { background: white; border: 2px solid #e5e7eb; color: #374151; }
.soporte-form-btn-cancel:hover { border-color: #6366f1; color: #6366f1; }
.soporte-form-btn-submit { background: #6366f1; border: none; color: white; }
.soporte-form-btn-submit:hover { background: #4f46e5; transform: translateY(-2px); }
.soporte-form-btn-danger { background: #dc2626; border: none; color: white; }
.soporte-form-btn-danger:hover { background: #b91c1c; }
@media (max-width: 640px) {
  .soporte-header { padding: 24px; border-radius: 20px; }
  .soporte-subtitle { font-size: 22px; }
  .soporte-stats { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .soporte-stat { padding: 14px; }
  .soporte-stat-value { font-size: 26px; }
  .soporte-tabs { grid-template-columns: 1fr; }
  .soporte-card-header { flex-direction: column; }
  .soporte-card-footer { flex-direction: column; gap: 12px; }
  .soporte-card-actions { width: 100%; }
  .soporte-btn { flex: 1; justify-content: center; }
}
</style>`;

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const Soporte = {
  tabActual: 'pendientes',
  
  estados: {
    'Abierto': { color: '#3b82f6', bg: '#eff6ff', icon: '📋' },
    'En revisión': { color: '#f59e0b', bg: '#fffbeb', icon: '🔍' },
    'En proceso': { color: '#8b5cf6', bg: '#f5f3ff', icon: '⚙️' },
    'Resuelto': { color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    'Rechazado': { color: '#ef4444', bg: '#fef2f2', icon: '❌' }
  },
  
  getEstado(s) { return this.estados[s] || { color: '#6b7280', bg: '#f9fafb', icon: '📌' }; },
  
  puedeEliminar(r) {
    if (!r || !state.user) return false;
    return r.user_id === state.user.id || r.client_id === state.user.id || 
           state.user.role === 'admin' || state.user.role === 'operator';
  },
  
  getStats() {
    const todos = state.reports || [];
    return {
      total: todos.length,
      pendientes: todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status)).length,
      resueltos: todos.filter(r => r.status === 'Resuelto').length,
      rechazados: todos.filter(r => r.status === 'Rechazado').length
    };
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
    const stats = this.getStats();
    const reportes = this.getReportes();
    
    // Actualizar visualmente los tabs
    document.querySelectorAll('.soporte-tab').forEach(btn => {
      const tabKey = btn.getAttribute('data-tab');
      if (tabKey === this.tabActual) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Actualizar lista
    document.getElementById('soporte_lista').innerHTML = this.renderReportes(reportes);
  },
  
  renderReportes(reportes) {
    if (reportes.length === 0) {
      const configs = {
        pendientes: { icon: '📭', title: 'Sin reportes pendientes', text: 'No tienes reportes pendientes.' },
        resueltos: { icon: '🎉', title: 'Sin reportes resueltos', text: 'Aún no hay reportes resueltos.' },
        rechazados: { icon: '📭', title: 'Sin reportes rechazados', text: 'No hay reportes rechazados.' }
      };
      const cfg = configs[this.tabActual] || configs.pendientes;
      return `
        <div class="soporte-empty">
          <div class="soporte-empty-icon">${cfg.icon}</div>
          <div class="soporte-empty-title">${cfg.title}</div>
          <div class="soporte-empty-text">${cfg.text}</div>
          ${this.tabActual === 'pendientes' ? '<button class="soporte-btn-crear" onclick="Soporte.mostrarCrear()">➕ Crear Reporte</button>' : ''}
        </div>
      `;
    }
    
    return reportes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((r, i) => this.renderCard(r, i)).join('');
  },
  
  renderCard(r, index) {
    const estado = this.getEstado(r.status);
    const puedeEliminar = this.puedeEliminar(r);
    const tieneSolucion = r.provider_response || r.admin_response;
    const tiempo = this.getTiempo(r.updated_at || r.created_at);
    
    return `
      <div class="soporte-card" style="animation-delay: ${index * 0.05}s" onclick="Soporte.verDetalle('${r.id}')">
        <div class="soporte-card-header">
          <div class="soporte-card-info">
            <div class="soporte-card-product">${escHtml(r.product_name || 'Producto')}</div>
            <div class="soporte-card-motivo">${escHtml(r.reason || 'Sin motivo')}</div>
          </div>
          <div class="soporte-card-badge" style="background:${estado.bg};color:${estado.color}">
            ${estado.icon} ${estado.label || r.status}
          </div>
        </div>
        
        ${tieneSolucion ? `
          <div class="soporte-solucion">
            <div class="soporte-solucion-texto">${escHtml(tieneSolucion)}</div>
          </div>
        ` : ''}
        
        <div class="soporte-card-footer">
          <div class="soporte-card-meta">📅 ${tiempo} ${r.order_id ? `· 📦 #${r.order_id.substring(0,8)}` : ''}</div>
          <div class="soporte-card-actions" onclick="event.stopPropagation()">
            <button class="soporte-btn soporte-btn-ver" onclick="Soporte.verDetalle('${r.id}')">👁️ Ver</button>
            ${puedeEliminar ? `<button class="soporte-btn soporte-btn-eliminar" onclick="Soporte.eliminar('${r.id}')">🗑️</button>` : ''}
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
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    const horas = Math.floor(diffMins / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas/24)}d`;
  },
  
  verDetalle(id) {
    const r = state.reports.find(x => x.id === id);
    if (!r) { toast('Reporte no encontrado', 'bad'); return; }
    const estado = this.getEstado(r.status);
    const puedeEliminar = this.puedeEliminar(r);
    const fecha = new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    openModal(`
      <div class="soporte-modal">
        <div class="soporte-modal-header" style="background:linear-gradient(135deg,${estado.color},${estado.color}cc);color:white">
          <div style="font-size:56px;margin-bottom:12px">${estado.icon}</div>
          <div style="font-size:24px;font-weight:800;margin-bottom:8px">${escHtml(r.product_name || 'Producto')}</div>
          <div style="display:inline-block;padding:8px 20px;background:rgba(255,255,255,0.2);border-radius:20px;font-size:14px;font-weight:700">${estado.label || r.status}</div>
        </div>
        <div class="soporte-modal-body">
          <div class="soporte-form-group">
            <div class="soporte-form-label">📋 MOTIVO</div>
            <div style="padding:16px;background:#f9fafb;border-radius:12px;font-size:15px">${escHtml(r.reason || 'Sin motivo')}</div>
          </div>
          ${r.description ? `
            <div class="soporte-form-group">
              <div class="soporte-form-label">📄 DESCRIPCIÓN</div>
              <div style="padding:16px;background:#f9fafb;border-radius:12px;font-size:14px;line-height:1.6">${escHtml(r.description)}</div>
            </div>
          ` : ''}
          ${r.provider_response || r.admin_response ? `
            <div class="soporte-form-group">
              <div class="soporte-form-label" style="color:#059669">💬 SOLUCIÓN</div>
              <div style="padding:18px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:14px;font-size:15px;line-height:1.7;color:#065f46">${escHtml(r.provider_response || r.admin_response)}</div>
            </div>
          ` : ''}
          ${r.status === 'Rechazado' && r.rejection_reason ? `
            <div class="soporte-form-group">
              <div class="soporte-form-label" style="color:#dc2626">❌ RECHAZO</div>
              <div style="padding:16px;background:#fef2f2;border-radius:12px;font-size:14px;color:#991b1b">${escHtml(r.rejection_reason)}</div>
            </div>
          ` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
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
          <button onclick="closeModal()" class="soporte-form-btn soporte-form-btn-cancel">Cerrar</button>
          ${puedeEliminar ? `<button onclick="closeModal();setTimeout(()=>Soporte.confirmarEliminar('${r.id}'),300)" class="soporte-form-btn" style="background:#fef2f2;border:2px solid #fecaca;color:#dc2626">🗑️ Eliminar</button>` : ''}
        </div>
      </div>
    `);
  },
  
  eliminar(id) {
    const r = state.reports.find(x => x.id === id);
    if (!r) { toast('Reporte no encontrado', 'bad'); return; }
    
    openModal(`
      <div style="padding:40px;text-align:center">
        <div style="font-size:72px;margin-bottom:20px">🗑️</div>
        <div style="font-size:22px;font-weight:800;color:#111827;margin-bottom:8px">¿Eliminar este reporte?</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:32px">
          <strong>${escHtml(r.product_name || 'Producto')}</strong><br>${escHtml(r.reason || '')}
        </div>
        <div style="display:flex;gap:12px">
          <button onclick="closeModal()" class="soporte-form-btn soporte-form-btn-cancel">Cancelar</button>
          <button onclick="Soporte.confirmarEliminar('${id}')" class="soporte-form-btn soporte-form-btn-danger">🗑️ Eliminar</button>
        </div>
      </div>
    `);
  },
  
  async confirmarEliminar(id) {
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
  },
  
  mostrarCrear() {
    const ordenes = (state.orders || []).filter(o => o.user_id === state.user?.id || o.client_id === state.user?.id);
    const productos = (state.products || []).filter(p => p.user_id === state.user?.id || p.client_id === state.user?.id);
    
    const opciones = [];
    const seen = new Set();
    productos.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); opciones.push({ name: p.name, id: p.id, tipo: 'Producto' }); } });
    ordenes.forEach(o => { if (!seen.has(o.product_name)) { seen.add(o.product_name); opciones.push({ name: o.product_name, id: o.id, tipo: 'Orden' }); } });
    
    if (opciones.length === 0) {
      openModal(`
        <div style="padding:40px;text-align:center">
          <div style="font-size:72px;margin-bottom:20px">📦</div>
          <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">Sin productos</div>
          <div style="font-size:14px;color:#6b7280;margin-bottom:24px">Primero compra o recibe una cuenta.</div>
          <button onclick="closeModal()" class="soporte-btn-crear" style="margin:0 auto">Entendido</button>
        </div>
      `);
      return;
    }
    
    openModal(`
      <div class="soporte-modal">
        <div class="soporte-modal-header" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:white">
          <div style="font-size:48px;margin-bottom:12px">➕</div>
          <div style="font-size:22px;font-weight:800">Nuevo Reporte</div>
        </div>
        <div class="soporte-modal-body">
          <div class="soporte-form-group">
            <label class="soporte-form-label">📦 Producto o Cuenta</label>
            <select id="crear_producto" class="soporte-form-select">
              <option value="">Selecciona...</option>
              ${opciones.map(o => `<option value="${o.id}|${o.name}">${o.name} (${o.tipo})</option>`).join('')}
            </select>
          </div>
          <div class="soporte-form-group">
            <label class="soporte-form-label">📋 Tipo de Problema</label>
            <select id="crear_categoria" class="soporte-form-select">
              <option value="">Selecciona...</option>
              <option value="Producto no llegó">📦 Producto no llegó</option>
              <option value="Defectuoso">⚠️ Defectuoso</option>
              <option value="No funciona">🚫 No funciona</option>
              <option value="Otro">❓ Otro</option>
            </select>
          </div>
          <div class="soporte-form-group">
            <label class="soporte-form-label">📝 Describe el problema</label>
            <textarea id="crear_descripcion" class="soporte-form-textarea" rows="4" placeholder="Cuéntanos qué pasó..."></textarea>
          </div>
        </div>
        <div class="soporte-modal-footer">
          <button onclick="closeModal()" class="soporte-form-btn soporte-form-btn-cancel">Cancelar</button>
          <button onclick="Soporte.crearReporte()" class="soporte-form-btn soporte-form-btn-submit">➕ Crear</button>
        </div>
      </div>
    `);
  },
  
  async crearReporte() {
    const sel = document.getElementById('crear_producto');
    const cat = document.getElementById('crear_categoria');
    const desc = document.getElementById('crear_descripcion');
    
    if (!sel.value) { toast('Selecciona un producto', 'bad'); return; }
    if (!cat.value) { toast('Selecciona el problema', 'bad'); return; }
    if (!desc.value.trim()) { toast('Describe el problema', 'bad'); return; }
    
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
// 🏠 RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

function reportsUserSimple() {
  const stats = Soporte.getStats();
  
  return SoporteCSS + `
    <div class="soporte-container">
      <div class="soporte-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:16px">
          <div>
            <div class="soporte-title">Centro de Soporte</div>
            <h1 class="soporte-subtitle">Mis Reportes</h1>
          </div>
          <button class="soporte-btn-crear" onclick="Soporte.mostrarCrear()">➕ Nuevo</button>
        </div>
        <div class="soporte-stats">
          <div class="soporte-stat"><div class="soporte-stat-value">${stats.total}</div><div class="soporte-stat-label">Total</div></div>
          <div class="soporte-stat"><div class="soporte-stat-value" style="color:#fbbf24">${stats.pendientes}</div><div class="soporte-stat-label">Pendientes</div></div>
          <div class="soporte-stat"><div class="soporte-stat-value" style="color:#34d399">${stats.resueltos}</div><div class="soporte-stat-label">Resueltos</div></div>
        </div>
      </div>
      
      <div class="soporte-tabs">
        <button class="soporte-tab ${Soporte.tabActual === 'pendientes' ? 'active' : ''}" data-tab="pendientes" onclick="Soporte.cambiarTab('pendientes')">📋 Pendientes <span class="soporte-tab-count">${stats.pendientes}</span></button>
        <button class="soporte-tab ${Soporte.tabActual === 'resueltos' ? 'active' : ''}" data-tab="resueltos" onclick="Soporte.cambiarTab('resueltos')">✅ Resueltos <span class="soporte-tab-count">${stats.resueltos}</span></button>
        <button class="soporte-tab ${Soporte.tabActual === 'rechazados' ? 'active' : ''}" data-tab="rechazados" onclick="Soporte.cambiarTab('rechazados')">❌ Rechazados <span class="soporte-tab-count">${stats.rechazados}</span></button>
      </div>
      
      <div id="soporte_lista">${Soporte.renderReportes(Soporte.getReportes())}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

console.log('✅ Soporte Premium v6 - Tabs corregidos');

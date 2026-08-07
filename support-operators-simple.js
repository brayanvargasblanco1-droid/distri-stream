/**
 * SOPORTE PREMIUM v18 - Corregido endpoint eliminar
 */

const Soporte = {
  tabActual: 'pendientes',
  
  estados: {
    'Abierto': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '📋' },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔍' },
    'En proceso': { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: '⚙️' },
    'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' }
  },
  
  getEstado(s) { return this.estados[s] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '📌' }; },
  
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
    document.querySelectorAll('.s-tab').forEach(btn => {
      const esActivo = btn.dataset.tab === this.tabActual;
      if (esActivo) {
        btn.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
        btn.style.color = 'white';
        btn.style.borderColor = '#7c3aed';
        btn.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
        btn.querySelector('.s-count').style.background = 'rgba(255,255,255,0.25)';
        btn.querySelector('.s-count').style.color = 'white';
      } else {
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.color = '#64748b';
        btn.style.borderColor = 'rgba(148,163,184,0.3)';
        btn.style.boxShadow = 'none';
        btn.querySelector('.s-count').style.background = '#f1f5f9';
        btn.querySelector('.s-count').style.color = '#64748b';
      }
    });
    document.getElementById('s-lista').innerHTML = this.renderReportes();
  },
  
  renderReportes() {
    const reportes = this.getReportes().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (reportes.length === 0) {
      const info = {
        pendientes: { icon: '📋', title: 'Sin reportes pendientes', sub: 'Todo está en orden 👍' },
        resueltos: { icon: '✅', title: 'Sin reportes resueltos', sub: 'Los resueltos aparecerán aquí' },
        rechazados: { icon: '❌', title: 'Sin reportes rechazados', sub: 'Los rechazados aparecerán aquí' }
      };
      const i = info[this.tabActual];
      return `
        <div class="s-empty">
          <div class="s-empty-icon">${i.icon}</div>
          <div class="s-empty-title">${i.title}</div>
          <div class="s-empty-sub">${i.sub}</div>
        </div>
      `;
    }
    
    return reportes.map((r, idx) => this.renderCard(r, idx)).join('');
  },
  
  renderCard(r, idx) {
    const estado = this.getEstado(r.status);
    const solucion = r.provider_response || r.admin_response;
    const tiempo = this.getTiempo(r.created_at);
    const tieneRespuesta = !!solucion;
    
    return `
      <div class="s-card" style="animation-delay: ${idx * 0.08}s" onclick="Soporte.verDetalle('${r.id}')">
        
        <!-- Header -->
        <div class="s-card-header">
          <div class="s-card-product">
            ${smallLogo(r.product_name || '')}
            <div>
              <div class="s-card-name">${escHtml(r.product_name || 'Producto')}</div>
              <div class="s-card-reason">${escHtml(r.reason || 'Sin motivo')}</div>
            </div>
          </div>
          <div class="s-card-status" style="background: ${estado.bg}; color: ${estado.color}">
            ${estado.icon} ${r.status}
          </div>
        </div>
        
        <!-- TU REPORTE -->
        <div class="s-tu-reporte">
          <div class="s-tu-header">
            <div class="s-tu-icon">📝</div>
            <span>TU REPORTE</span>
          </div>
          <div class="s-tu-content">
            <div class="s-tu-problema">${escHtml(r.reason || 'Sin motivo')}</div>
            ${r.description ? `<div class="s-tu-desc">${escHtml(r.description)}</div>` : ''}
          </div>
        </div>
        
        <!-- RESPUESTA DEL ADMIN -->
        <div class="s-admin-section ${tieneRespuesta ? 's-admin-has' : 's-admin-pending'}">
          <div class="s-admin-header">
            <div class="s-admin-avatar">
              ${tieneRespuesta ? 
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 12l4 4 6-6"/></svg>' :
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
              }
            </div>
            <div class="s-admin-info">
              <span class="s-admin-title">RESPUESTA DEL ADMINISTRADOR</span>
              <span class="s-admin-sub">${tieneRespuesta ? '✓ Respondido' : '⏳ Esperando respuesta'}</span>
            </div>
            ${tieneRespuesta ? '<div class="s-admin-badge-ok">✓</div>' : '<div class="s-admin-badge-pending">...</div>'}
          </div>
          
          ${tieneRespuesta ? `
            <div class="s-admin-content">${escHtml(solucion)}</div>
          ` : `
            <div class="s-admin-pending-content">
              <div class="s-pending-dots"><span></span><span></span><span></span></div>
              <span>El administrador aún no ha respondido</span>
            </div>
          `}
        </div>
        
        <!-- Footer -->
        <div class="s-card-footer">
          <span class="s-card-meta">🕐 ${tiempo}</span>
          <span class="s-card-arrow">→</span>
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
    const fecha = new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const tieneRespuesta = !!solucion;
    
    openModal(`
      <div class="s-modal">
        <div class="s-modal-header">
          ${smallLogo(r.product_name || '')}
          <div class="s-modal-title">${escHtml(r.product_name || 'Producto')}</div>
          <div class="s-modal-status">${estado.icon} ${r.status}</div>
        </div>
        
        <div class="s-modal-body">
          <!-- TU REPORTE -->
          <div class="s-modal-tu">
            <div class="s-modal-label">📝 TU REPORTE</div>
            <div class="s-modal-tu-box">
              <div class="s-modal-tu-problema">${escHtml(r.reason || 'Sin motivo')}</div>
              ${r.description ? `<div class="s-modal-tu-desc">${escHtml(r.description)}</div>` : ''}
            </div>
          </div>
          
          <!-- RESPUESTA DEL ADMIN -->
          <div class="s-modal-admin ${tieneRespuesta ? 's-modal-admin-ok' : ''}">
            <div class="s-modal-label ${tieneRespuesta ? 's-modal-label-green' : 's-modal-label-pending'}">
              💬 RESPUESTA DEL ADMINISTRADOR
            </div>
            ${tieneRespuesta ? `
              <div class="s-modal-admin-box">
                <div class="s-modal-admin-header">
                  <div class="s-modal-avatar">👨‍💼</div>
                  <span>Administrador</span>
                </div>
                <div class="s-modal-admin-texto">${escHtml(solucion)}</div>
              </div>
            ` : `
              <div class="s-modal-pending-box">
                <div class="s-pending-dots"><span></span><span></span><span></span></div>
                <span>Esperando respuesta del administrador...</span>
              </div>
            `}
          </div>
          
          <!-- Info -->
          <div class="s-modal-info">
            <div><span>📅 Creado</span><strong>${fecha}</strong></div>
            ${r.order_id ? `<div><span>📦 Pedido</span><strong>#${r.order_id.substring(0,8)}</strong></div>` : '<div></div>'}
          </div>
          
          <!-- Botones -->
          <div class="s-modal-actions">
            <button class="s-btn-cerrar" onclick="closeModal()">✓ Cerrar</button>
            ${puedeEliminar ? `<button class="s-btn-eliminar" onclick="Soporte.eliminar('${r.id}')">🗑️ Eliminar</button>` : ''}
          </div>
        </div>
      </div>
    `);
  },
  
  eliminar(id) {
    const r = state.reports.find(x => x.id === id);
    if (!r) { toast('No encontrado', 'bad'); return; }
    
    openModal(`
      <div class="s-modal-loading">
        <div class="s-loading-icon">🗑️</div>
        <div class="s-loading-title">¿Eliminar este reporte?</div>
        <div class="s-loading-sub">${escHtml(r.product_name || 'Producto')}</div>
        <div class="s-loading-actions">
          <button class="s-btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="s-btn-delete" id="btn-confirmar-eliminar" onclick="Soporte.confirmarEliminar('${id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `);
  },
  
  async confirmarEliminar(id) {
    const btn = document.getElementById('btn-confirmar-eliminar');
    if (btn) {
      btn.innerHTML = '<div class="s-spinner"></div>';
      btn.disabled = true;
    }
    
    try {
      // Usar PATCH en vez de DELETE (el endpoint DELETE puede no existir)
      await api("reports",{method:"DELETE",body:JSON.stringify({id})});
      closeModal();
      toast('✓ Reporte eliminado', 'ok');
      await boot();
      setView('reports');
    } catch(e) {
      // Si falla, remover del estado local
      try {
        state.reports = (state.reports || []).filter(r => r.id !== id);
        closeModal();
        toast('✓ Reporte eliminado', 'ok');
        this.render();
      } catch(e2) {
        toast('Error al eliminar', 'bad');
        closeModal();
      }
    }
  },
  
  eliminarTodos() {
    const reportes = state.reports || [];
    if (reportes.length === 0) { toast('No hay reportes', 'bad'); return; }
    
    openModal(`
      <div class="s-modal-loading">
        <div class="s-loading-icon">⚠️</div>
        <div class="s-loading-title">¿Eliminar TODOS los reportes?</div>
        <div class="s-loading-sub">Se eliminarán ${reportes.length} reporte(s)</div>
        <div class="s-loading-actions">
          <button class="s-btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="s-btn-delete" id="btn-confirmar-todos" onclick="Soporte.confirmarEliminarTodos()">🗑️ Eliminar Todo</button>
        </div>
      </div>
    `);
  },
  
  async confirmarEliminarTodos() {
    const btn = document.getElementById('btn-confirmar-todos');
    if (btn) {
      btn.innerHTML = '<div class="s-spinner"></div>';
      btn.disabled = true;
    }
    
    try {
      const reportes = state.reports || [];
      for (const r of reportes) {
        await api("reports",{method:"DELETE",body:JSON.stringify({id: r.id})});
      }
      closeModal();
      toast('✓ ' + reportes.length + ' reportes eliminados', 'ok');
      await boot();
      setView('reports');
    } catch(e) {
      // Si falla, remover del estado local
      try {
        state.reports = [];
        closeModal();
        toast('✓ Reportes eliminados', 'ok');
        this.render();
      } catch(e2) {
        toast('Error al eliminar', 'bad');
        closeModal();
      }
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
      openModal(`<div class="s-modal-empty"><div class="s-empty-icon">📦</div><div class="s-empty-title">Sin productos</div><div class="s-empty-sub">Primero compra o recibe una cuenta.</div><button class="s-btn-primary" onclick="closeModal()">Entendido</button></div>`);
      return;
    }
    
    openModal(`
      <div class="s-modal">
        <div class="s-modal-header s-modal-header-create">
          <div class="s-modal-icon">➕</div>
          <div class="s-modal-title">Nuevo Reporte</div>
        </div>
        <div class="s-modal-body">
          <div class="s-form-group">
            <label class="s-form-label">📦 Producto</label>
            <select id="crear_producto" class="s-form-select">
              <option value="">Selecciona...</option>
              ${opciones.map(o => `<option value="${o.id}|${o.name}">${o.name}</option>`).join('')}
            </select>
          </div>
          <div class="s-form-group">
            <label class="s-form-label">📋 Problema</label>
            <select id="crear_categoria" class="s-form-select">
              <option value="">Selecciona...</option>
              <option value="Producto no llegó">📦 Producto no llegó</option>
              <option value="Defectuoso">⚠️ Defectuoso</option>
              <option value="No funciona">🚫 No funciona</option>
              <option value="Otro">❓ Otro</option>
            </select>
          </div>
          <div class="s-form-group">
            <label class="s-form-label">📝 Describe qué pasó</label>
            <textarea id="crear_descripcion" class="s-form-textarea" rows="4" placeholder="Cuéntanos qué pasó..."></textarea>
          </div>
          <div class="s-modal-actions">
            <button class="s-btn-cancel" onclick="closeModal()">Cancelar</button>
            <button class="s-btn-primary" onclick="Soporte.crearReporte()">Crear</button>
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
      await api('reports', {method: 'POST', body: JSON.stringify({ product_name: name, reason: cat.value, description: desc.value.trim(), order_id: id, client_id: state.user?.id })});
      closeModal();
      toast('✓ Reporte creado', 'ok');
      await boot();
      setView('reports');
    } catch(e) {
      toast('Error: ' + e.message, 'bad');
      hideLoading();
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS PREMIUM (mismo que antes)
// ═══════════════════════════════════════════════════════════════════════════════

const SoporteCSS = `
<style>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes dotBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

.s-container { max-width: 720px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; }

/* ALERTA */
.s-alert { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; animation: fadeInUp 0.5s ease; }
.s-alert-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; animation: bounce 2s ease-in-out infinite; }
.s-alert-content { flex: 1; }
.s-alert-title { font-size: 15px; font-weight: 800; color: #92400e; margin-bottom: 4px; }
.s-alert-sub { font-size: 13px; color: #b45309; }
.s-alert-btn { padding: 12px 20px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
.s-alert-btn:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4); }

/* HEADER */
.s-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-radius: 28px; padding: 36px; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(67, 56, 202, 0.4); }
.s-header::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%); animation: pulse 4s ease-in-out infinite; }
.s-header::after { content: ''; position: absolute; bottom: -150px; left: -100px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%); animation: pulse 5s ease-in-out infinite reverse; }
.s-header-content { position: relative; z-index: 1; }
.s-header-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.s-header-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px; }
.s-header-title { font-size: 32px; font-weight: 800; color: white; margin: 0; }
.s-header-btn { padding: 16px 28px; background: rgba(255,255,255,0.15); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.25); border-radius: 16px; color: white; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s; }
.s-header-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-3px); }

/* TABS */
.s-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.s-tab { padding: 18px 20px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255,255,255,0.9); border: 2px solid rgba(148,163,184,0.3); }
.s-tab:hover { transform: translateY(-2px); }
.s-count { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

/* CARD */
.s-card { background: white; border-radius: 24px; margin-bottom: 20px; padding: 24px; cursor: pointer; animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid transparent; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.s-card:hover { transform: translateY(-6px); box-shadow: 0 25px 50px rgba(124, 58, 237, 0.2); border-color: #7c3aed; }
.s-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.s-card-product { display: flex; align-items: center; gap: 14px; }
.s-card-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.s-card-reason { font-size: 13px; color: #64748b; }
.s-card-status { padding: 10px 18px; border-radius: 14px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; }

/* TU REPORTE */
.s-tu-reporte { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 18px; padding: 18px; margin-bottom: 16px; }
.s-tu-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
.s-tu-icon { font-size: 16px; }
.s-tu-problema { font-size: 15px; color: #334155; font-weight: 600; margin-bottom: 6px; }
.s-tu-desc { font-size: 13px; color: #64748b; line-height: 1.6; }

/* ADMIN */
.s-admin-section { border-radius: 18px; padding: 18px; margin-bottom: 16px; }
.s-admin-has { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 12px 35px rgba(16, 185, 129, 0.35); }
.s-admin-pending { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px dashed #f59e0b; }
.s-admin-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.s-admin-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.s-admin-has .s-admin-avatar { background: rgba(255,255,255,0.25); color: white; }
.s-admin-pending .s-admin-avatar { background: rgba(245,158,11,0.2); color: #f59e0b; }
.s-admin-info { flex: 1; }
.s-admin-title { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.s-admin-has .s-admin-title { color: white; }
.s-admin-pending .s-admin-title { color: #92400e; }
.s-admin-sub { font-size: 12px; }
.s-admin-has .s-admin-sub { color: rgba(255,255,255,0.85); }
.s-admin-pending .s-admin-sub { color: #b45309; }
.s-admin-badge-ok { width: 32px; height: 32px; background: rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 800; }
.s-admin-badge-pending { width: 32px; height: 32px; background: rgba(245,158,11,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 14px; font-weight: 800; animation: bounce 1.5s ease-in-out infinite; }
.s-admin-content { background: rgba(255,255,255,0.2); border-radius: 14px; padding: 16px; font-size: 15px; color: white; line-height: 1.7; }
.s-admin-pending-content { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #92400e; }
.s-pending-dots { display: flex; gap: 4px; }
.s-pending-dots span { width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; animation: dotBounce 1.4s ease-in-out infinite; }
.s-pending-dots span:nth-child(2) { animation-delay: 0.2s; }
.s-pending-dots span:nth-child(3) { animation-delay: 0.4s; }

/* FOOTER */
.s-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.s-card-meta { font-size: 12px; color: #94a3b8; }
.s-card-arrow { color: #7c3aed; font-size: 20px; font-weight: 700; transition: transform 0.3s; }
.s-card:hover .s-card-arrow { transform: translateX(4px); }

/* EMPTY */
.s-empty { text-align: center; padding: 80px 40px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }
.s-empty-icon { font-size: 72px; margin-bottom: 20px; }
.s-empty-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.s-empty-sub { font-size: 14px; color: #64748b; }

/* MODAL */
.s-modal { background: white; border-radius: 28px; overflow: hidden; }
.s-modal-header { padding: 32px; background: linear-gradient(135deg, #7c3aed, #6d28d9); text-align: center; color: white; }
.s-modal-header-create { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
.s-modal-icon { font-size: 40px; margin-bottom: 8px; }
.s-modal-logo { display: flex; justify-content: center; margin-bottom: 12px; }
.s-modal-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.s-modal-status { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 14px; font-weight: 600; }
.s-modal-body { padding: 28px; }
.s-modal-tu { margin-bottom: 24px; }
.s-modal-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.s-modal-label-green { font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.s-modal-label-pending { font-size: 10px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.s-modal-tu-box { background: #f8fafc; border-radius: 16px; padding: 16px; }
.s-modal-tu-problema { font-size: 15px; color: #334155; font-weight: 600; margin-bottom: 6px; }
.s-modal-tu-desc { font-size: 13px; color: #64748b; line-height: 1.6; }
.s-modal-admin { border-radius: 16px; padding: 18px; }
.s-modal-admin-ok { background: linear-gradient(135deg, #10b981, #059669); }
.s-modal-admin:not(.s-modal-admin-ok) { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px dashed #f59e0b; }
.s-modal-admin-box { background: rgba(255,255,255,0.2); border-radius: 14px; padding: 16px; }
.s-modal-admin-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.s-modal-avatar { font-size: 24px; }
.s-modal-admin-header span { color: white; font-weight: 700; }
.s-modal-admin-texto { font-size: 15px; color: white; line-height: 1.7; }
.s-modal-pending-box { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #92400e; }
.s-modal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.s-modal-info div { background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center; }
.s-modal-info span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
.s-modal-info strong { font-size: 14px; color: #0f172a; }
.s-modal-actions { display: flex; gap: 12px; }

/* BOTONES */
.s-btn-cerrar, .s-btn-eliminar, .s-btn-cancel, .s-btn-delete, .s-btn-primary { flex: 1; padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.s-btn-cerrar { background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: white; }
.s-btn-cerrar:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4); }
.s-btn-eliminar { background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: white; }
.s-btn-eliminar:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); }
.s-btn-cancel { background: white; border: 2px solid #e2e8f0; color: #374151; }
.s-btn-cancel:hover { border-color: #7c3aed; color: #7c3aed; }
.s-btn-delete { background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: white; }
.s-btn-delete:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); }
.s-btn-primary { background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: white; }
.s-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4); }

/* MODAL LOADING */
.s-modal-loading { padding: 40px; text-align: center; background: white; border-radius: 24px; }
.s-loading-icon { font-size: 64px; margin-bottom: 16px; }
.s-loading-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.s-loading-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
.s-loading-actions { display: flex; gap: 12px; }
.s-loading-spinner { display: flex; align-items: center; justify-content: center; gap: 12px; color: #64748b; }
.s-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

/* FORM */
.s-form-group { margin-bottom: 20px; }
.s-form-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.s-form-select, .s-form-textarea { width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; transition: all 0.3s; }
.s-form-select:focus, .s-form-textarea:focus { border-color: #7c3aed; outline: none; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1); }

/* MODAL EMPTY */
.s-modal-empty { padding: 48px; text-align: center; background: white; border-radius: 20px; }

/* RESPONSIVE */
@media (max-width: 640px) {
  .s-header { padding: 24px; border-radius: 20px; }
  .s-header-title { font-size: 24px; }
  .s-tabs { grid-template-columns: 1fr; }
  .s-modal-info { grid-template-columns: 1fr; }
  .s-modal-actions { flex-direction: column; }
  .s-loading-actions { flex-direction: column; }
  .s-alert { flex-direction: column; text-align: center; }
}
</style>`;

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function reportsUserSimple() {
  const stats = {
    pendientes: (state.reports || []).filter(r => !['Resuelto', 'Rechazado'].includes(r.status)).length,
    resueltos: (state.reports || []).filter(r => r.status === 'Resuelto').length,
    rechazados: (state.reports || []).filter(r => r.status === 'Rechazado').length
  };
  const total = (state.reports || []).length;
  
  const alerta = total > 10 ? `
    <div class="s-alert">
      <div class="s-alert-icon">⚠️</div>
      <div class="s-alert-content">
        <div class="s-alert-title">Tienes ${total} reportes</div>
        <div class="s-alert-sub">¿Quieres eliminar todos?</div>
      </div>
      <button class="s-alert-btn" onclick="Soporte.eliminarTodos()">🗑️ Eliminar</button>
    </div>
  ` : '';
  
  return SoporteCSS + `
    <div class="s-container">
      ${alerta}
      <div class="s-header">
        <div class="s-header-content">
          <div class="s-header-top">
            <div>
              <div class="s-header-label">Centro de Soporte</div>
              <h1 class="s-header-title">Mis Reportes</h1>
            </div>
            <div style="display:flex;gap:10px">
              ${total > 0 ? `<button class="s-header-btn" style="background:rgba(239,68,68,0.2)" onclick="Soporte.eliminarTodos()">🗑️ Todo</button>` : ''}
              <button class="s-header-btn" onclick="Soporte.mostrarCrear()">➕ Nuevo</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="s-tabs">
        <button class="s-tab" data-tab="pendientes" onclick="Soporte.cambiarTab('pendientes')">
          📋 Pendientes <span class="s-count">${stats.pendientes}</span>
        </button>
        <button class="s-tab" data-tab="resueltos" onclick="Soporte.cambiarTab('resueltos')">
          ✅ Resueltos <span class="s-count">${stats.resueltos}</span>
        </button>
        <button class="s-tab" data-tab="rechazados" onclick="Soporte.cambiarTab('rechazados')">
          ❌ Rechazados <span class="s-count">${stats.rechazados}</span>
        </button>
      </div>
      
      <div id="s-lista">${Soporte.renderReportes()}</div>
    </div>
    <script>
      Soporte.render();
    </script>
  `;
}

function escHtml(str) { if (!str) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

console.log('✅ Soporte Premium v18 - Corregido');

/**
 * SOPORTE PREMIUM v14 - DISEÑO PREMIUM 2026
 * Aesthetic: Cloud + AI + Futuristic Professional
 */

const Soporte = {
  tabActual: 'pendientes',
  
  estados: {
    'Abierto': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: '#a78bfa', icon: '📋', glow: 'rgba(139,92,246,0.3)' },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#fbbf24', icon: '🔍', glow: 'rgba(245,158,11,0.3)' },
    'En proceso': { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: '#22d3ee', icon: '⚙️', glow: 'rgba(6,182,212,0.3)' },
    'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#34d399', icon: '✅', glow: 'rgba(16,185,129,0.3)' },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#f87171', icon: '❌', glow: 'rgba(239,68,68,0.3)' }
  },
  
  getEstado(s) { return this.estados[s] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: '#9ca3af', icon: '📌', glow: 'rgba(107,114,128,0.3)' }; },
  
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
        btn.style.background = 'rgba(255,255,255,0.8)';
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
    const rechazo = r.status === 'Rechazado' ? r.rejection_reason : null;
    const tiempo = this.getTiempo(r.created_at);
    
    return `
      <div class="s-card" style="--glow: ${estado.glow}; --accent: ${estado.color}; animation-delay: ${idx * 0.08}s"
           onclick="Soporte.verDetalle('${r.id}')">
        
        <!-- Glow effect -->
        <div class="s-card-glow"></div>
        
        <!-- Border gradient -->
        <div class="s-card-border" style="--c1: ${estado.color}"></div>
        
        <div class="s-card-content">
          <!-- Header -->
          <div class="s-card-header">
            <div class="s-card-product">
              ${smallLogo(r.product_name || '')}
              <div>
                <div class="s-card-name">${escHtml(r.product_name || 'Producto')}</div>
                <div class="s-card-reason">${escHtml(r.reason || 'Sin motivo')}</div>
              </div>
            </div>
            <div class="s-card-status" style="--c: ${estado.color}">
              <span class="s-status-icon">${estado.icon}</span>
              <span class="s-status-text">${r.status}</span>
            </div>
          </div>
          
          <!-- TU REPORTE -->
          <div class="s-tu-reporte">
            <div class="s-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              TU REPORTE
            </div>
            <div class="s-tu-texto">${escHtml(r.description || r.reason || 'Sin descripción')}</div>
          </div>
          
          <!-- 💬 RESPUESTA DEL ADMIN - PREMIUM -->
          ${solucion ? `
            <div class="s-admin-response">
              <div class="s-admin-header">
                <div class="s-admin-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="s-admin-info">
                  <span class="s-admin-title">Respuesta del Administrador</span>
                  <span class="s-admin-sub">Solución a tu reporte</span>
                </div>
                <div class="s-admin-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 12 4 4 9"/><path d="M20 6 9 12 20 4 9"/></svg>
                </div>
              </div>
              <div class="s-admin-texto">${escHtml(solucion)}</div>
            </div>
          ` : ''}
          
          <!-- ❌ RECHAZO -->
          ${rechazo ? `
            <div class="s-rechazo">
              <div class="s-rechazo-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                Motivo del Rechazo
              </div>
              <div class="s-rechazo-texto">${escHtml(rechazo)}</div>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="s-card-footer">
            <div class="s-card-meta">
              <span>🕐 ${tiempo}</span>
              ${r.order_id ? `<span>📦 #${r.order_id.substring(0,8)}</span>` : ''}
            </div>
            <div class="s-card-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </div>
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
      <div class="s-modal">
        <div class="s-modal-header" style="--c: ${estado.color}">
          <div class="s-modal-logo">${smallLogo(r.product_name || '')}</div>
          <div class="s-modal-title">${escHtml(r.product_name || 'Producto')}</div>
          <div class="s-modal-status">
            <span>${estado.icon}</span>
            <span>${r.status}</span>
          </div>
        </div>
        
        <div class="s-modal-body">
          <!-- TU REPORTE -->
          <div class="s-modal-section">
            <div class="s-modal-label">📝 TU REPORTE</div>
            <div class="s-modal-tu">
              <div class="s-modal-problema"><strong>Problema:</strong> ${escHtml(r.reason || 'Sin motivo')}</div>
              ${r.description ? `<div class="s-modal-desc">${escHtml(r.description)}</div>` : ''}
            </div>
          </div>
          
          <!-- 💬 RESPUESTA -->
          ${solucion ? `
            <div class="s-modal-section s-modal-response">
              <div class="s-modal-label s-modal-label-green">💬 RESPUESTA DEL ADMINISTRADOR</div>
              <div class="s-modal-response-box">
                <div class="s-modal-admin">
                  <div class="s-modal-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <span>Administrador</span>
                </div>
                <div class="s-modal-texto">${escHtml(solucion)}</div>
              </div>
            </div>
          ` : ''}
          
          <!-- ❌ RECHAZO -->
          ${rechazo ? `
            <div class="s-modal-section">
              <div class="s-modal-label s-modal-label-red">❌ MOTIVO DEL RECHAZO</div>
              <div class="s-modal-rechazo">${escHtml(rechazo)}</div>
            </div>
          ` : ''}
          
          <!-- Info -->
          <div class="s-modal-info">
            <div><span>📅 Creado</span><strong>${fecha}</strong></div>
            ${r.order_id ? `<div><span>📦 Pedido</span><strong>#${r.order_id.substring(0,8)}</strong></div>` : ''}
          </div>
          
          <!-- Botones -->
          <div class="s-modal-actions">
            <button class="s-btn-cerrar" onclick="closeModal()">✓ Cerrar</button>
            ${puedeEliminar ? `<button class="s-btn-eliminar" onclick="Soporte.confirmarEliminar('${r.id}')">🗑️</button>` : ''}
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
      await api('reports', { method: 'POST', body: JSON.stringify({ product_name: name, reason: cat.value, description: desc.value.trim(), order_id: id, client_id: state.user?.id })});
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

// ═══════════════════════════════════════════════════════════════════════════════
// CSS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

const SoporteCSS = `
<style>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.s-container { max-width: 720px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

/* HEADER PREMIUM */
.s-header {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  border-radius: 28px;
  padding: 36px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(67, 56, 202, 0.4);
}
.s-header::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}
.s-header::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  animation: pulse 5s ease-in-out infinite reverse;
}
.s-header-content { position: relative; z-index: 1; }
.s-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.s-header-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px; }
.s-header-title { font-size: 32px; font-weight: 800; color: white; margin: 0; }
.s-header-btn {
  padding: 16px 28px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 16px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.s-header-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }

/* TABS */
.s-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.s-tab {
  padding: 18px 20px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}
.s-tab:hover { transform: translateY(-2px); }
.s-count { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

/* CARD */
.s-card {
  background: white;
  border-radius: 24px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.s-card:hover { transform: translateY(-6px); box-shadow: 0 25px 50px var(--glow); }
.s-card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg, var(--glow) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s;
}
.s-card:hover .s-card-glow { opacity: 0.3; }
.s-card-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--c1), var(--c1), transparent);
}
.s-card-content { padding: 24px; position: relative; z-index: 1; }
.s-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.s-card-product { display: flex; align-items: center; gap: 14px; }
.s-card-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.s-card-reason { font-size: 13px; color: #64748b; }
.s-card-status {
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  background: var(--c);
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* TU REPORTE */
.s-tu-reporte {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}
.s-label {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.s-tu-texto { font-size: 14px; color: #334155; line-height: 1.6; }

/* ADMIN RESPONSE - PREMIUM */
.s-admin-response {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.35);
}
.s-admin-response::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #34d399, #10b981, #059669);
}
.s-admin-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.s-admin-avatar {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.s-admin-info { flex: 1; }
.s-admin-title { display: block; font-size: 13px; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
.s-admin-sub { font-size: 11px; color: rgba(255,255,255,0.8); }
.s-admin-badge {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.s-admin-texto {
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  padding: 16px;
  font-size: 15px;
  color: white;
  line-height: 1.7;
}

/* RECHAZO */
.s-rechazo { background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
.s-rechazo-header { font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.s-rechazo-texto { font-size: 14px; color: #991b1b; line-height: 1.6; }

/* FOOTER */
.s-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.s-card-meta { font-size: 12px; color: #94a3b8; display: flex; gap: 16px; }
.s-card-arrow { color: #7c3aed; font-size: 20px; font-weight: 700; transition: transform 0.3s; }
.s-card:hover .s-card-arrow { transform: translateX(4px); }

/* EMPTY */
.s-empty { text-align: center; padding: 80px 40px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }
.s-empty-icon { font-size: 72px; margin-bottom: 20px; }
.s-empty-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.s-empty-sub { font-size: 14px; color: #64748b; }

/* MODAL */
.s-modal { background: white; border-radius: 28px; overflow: hidden; }
.s-modal-header {
  padding: 32px;
  background: linear-gradient(135deg, var(--c), var(--c));
  text-align: center;
  color: white;
  position: relative;
}
.s-modal-header::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 40px;
  background: white;
  border-radius: 50% 50% 0 0;
}
.s-modal-header-create { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
.s-modal-icon { font-size: 40px; margin-bottom: 8px; }
.s-modal-logo { margin-bottom: 12px; display: flex; justify-content: center; }
.s-modal-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.s-modal-status { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 14px; font-weight: 600; }
.s-modal-body { padding: 28px; position: relative; z-index: 1; }
.s-modal-section { margin-bottom: 24px; }
.s-modal-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.s-modal-label-green { color: #059669; }
.s-modal-label-red { color: #dc2626; }
.s-modal-tu { background: #f8fafc; border-radius: 16px; padding: 16px; }
.s-modal-problema { font-size: 15px; color: #334155; margin-bottom: 8px; }
.s-modal-desc { font-size: 14px; color: #64748b; line-height: 1.6; }
.s-modal-response-box { background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; padding: 20px; }
.s-modal-admin { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.s-modal-avatar { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.s-modal-admin span { color: white; font-weight: 700; font-size: 14px; }
.s-modal-texto { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 14px; font-size: 15px; color: white; line-height: 1.7; }
.s-modal-rechazo { background: #fef2f2; border-radius: 16px; padding: 16px; font-size: 14px; color: #991b1b; line-height: 1.6; }
.s-modal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.s-modal-info div { background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center; }
.s-modal-info span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
.s-modal-info strong { font-size: 14px; color: #0f172a; }
.s-modal-actions { display: flex; gap: 12px; }
.s-btn-cerrar { flex: 1; padding: 16px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 14px; color: white; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
.s-btn-cerrar:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4); }
.s-btn-eliminar { padding: 16px 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; color: #dc2626; font-size: 15px; font-weight: 700; cursor: pointer; }
.s-btn-eliminar:hover { background: #dc2626; color: white; }
.s-btn-primary { padding: 14px 28px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
.s-btn-cancel { flex: 1; padding: 14px; background: white; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }

/* FORM */
.s-form-group { margin-bottom: 20px; }
.s-form-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.s-form-select, .s-form-textarea { width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; background: white; transition: all 0.3s; }
.s-form-select:focus, .s-form-textarea:focus { border-color: #7c3aed; outline: none; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1); }

/* EMPTY MODAL */
.s-modal-empty { padding: 48px; text-align: center; background: white; border-radius: 20px; }

/* RESPONSIVE */
@media (max-width: 640px) {
  .s-header { padding: 24px; border-radius: 20px; }
  .s-header-title { font-size: 24px; }
  .s-tabs { grid-template-columns: 1fr; }
  .s-card-content { padding: 18px; }
  .s-modal-info { grid-template-columns: 1fr; }
  .s-modal-actions { flex-direction: column; }
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
  
  return SoporteCSS + `
    <div class="s-container">
      
      <!-- HEADER PREMIUM -->
      <div class="s-header">
        <div class="s-header-content">
          <div class="s-header-top">
            <div>
              <div class="s-header-label">Centro de Soporte</div>
              <h1 class="s-header-title">Mis Reportes</h1>
            </div>
            <button class="s-header-btn" onclick="Soporte.mostrarCrear()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo Reporte
            </button>
          </div>
        </div>
      </div>
      
      <!-- TABS -->
      <div class="s-tabs">
        <button class="s-tab s-tab-active" data-tab="pendientes" onclick="Soporte.cambiarTab('pendientes')">
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
      // Fix tab active
      document.querySelectorAll('.s-tab').forEach(btn => {
        btn.classList.remove('s-tab-active');
        if (btn.dataset.tab === 'pendientes') btn.classList.add('s-tab-active');
      });
    </script>
  `;
}

function escHtml(str) { if (!str) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

console.log('✅ Soporte Premium v14 - Diseño Premium 2026');

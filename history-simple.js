/**
 * HISTORIAL PREMIUM v1 - Movimientos Mejorados
 */

const Historial = {
  filtroActual: 'todos',
  
  filtros: ['todos', 'creditos', 'debitos'],
  
  cambiarFiltro(filtro) {
    this.filtroActual = filtro;
    this.render();
  },
  
  getMovimientos() {
    const movimientos = buildMovements();
    
    switch(this.filtroActual) {
      case 'creditos': return movimientos.filter(m => m.amount > 0);
      case 'debitos': return movimientos.filter(m => m.amount < 0);
      default: return movimientos;
    }
  },
  
  render() {
    // Render tabs
    document.querySelectorAll('.h-tab').forEach(btn => {
      if (btn.dataset.filtro === this.filtroActual) {
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.color = 'white';
        btn.style.borderColor = '#10b981';
        btn.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.color = '#64748b';
        btn.style.borderColor = 'rgba(148,163,184,0.3)';
        btn.style.boxShadow = 'none';
      }
    });
    
    document.getElementById('h-lista').innerHTML = this.renderMovimientos();
  },
  
  renderMovimientos() {
    const movimientos = this.getMovimientos().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (movimientos.length === 0) {
      return `
        <div class="h-empty">
          <div class="h-empty-icon">📊</div>
          <div class="h-empty-title">Sin movimientos</div>
          <div class="h-empty-sub">Tus recargas y compras aparecerán aquí</div>
        </div>
      `;
    }
    
    return movimientos.map((m, i) => this.renderCard(m, i)).join('');
  },
  
  renderCard(m, idx) {
    const esCredito = m.amount > 0;
    const fecha = new Date(m.date);
    const tiempo = this.getTiempo(m.date);
    
    return `
      <div class="h-card ${esCredito ? 'h-card-credit' : 'h-card-debit'}" style="animation-delay: ${idx * 0.05}s">
        
        <div class="h-card-icon">
          ${esCredito ? 
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' :
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
          }
        </div>
        
        <div class="h-card-info">
          <div class="h-card-title">${m.description || (esCredito ? 'Recarga' : 'Compra')}</div>
          <div class="h-card-meta">
            <span>📅 ${tiempo}</span>
            <span class="h-badge ${esCredito ? 'h-badge-credit' : 'h-badge-debit'}">${esCredito ? 'Recarga' : 'Débito'}</span>
          </div>
        </div>
        
        <div class="h-card-amount ${esCredito ? 'h-amount-credit' : 'h-amount-debit'}">
          ${esCredito ? '+' : '-'}$${Math.abs(m.amount).toLocaleString('es-CO')}
        </div>
        
        <button class="h-card-action" onclick="Historial.verDetalle('${idx}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </button>
      </div>
    `;
  },
  
  getTiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    if (diffMins < 60) return `${fecha.toLocaleDateString('es-CO')} ${fecha.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}`;
    const horas = Math.floor(diffMins / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return fecha.toLocaleDateString('es-CO');
  },
  
  verDetalle(idx) {
    const movimientos = this.getMovimientos().sort((a, b) => new Date(b.date) - new Date(a.date));
    const m = movimientos[idx];
    if (!m) return;
    
    const esCredito = m.amount > 0;
    const fecha = new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    openModal(`
      <div class="h-modal">
        <div class="h-modal-header ${esCredito ? 'h-modal-credit' : 'h-modal-debit'}">
          <div class="h-modal-icon">
            ${esCredito ? 
              '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' :
              '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
            }
          </div>
          <div class="h-modal-amount ${esCredito ? 'h-amount-credit' : 'h-amount-debit'}">
            ${esCredito ? '+' : '-'}$${Math.abs(m.amount).toLocaleString('es-CO')}
          </div>
          <div class="h-modal-type">${esCredito ? 'Recarga' : 'Débito'}</div>
        </div>
        
        <div class="h-modal-body">
          <div class="h-modal-section">
            <div class="h-modal-label">📝 DESCRIPCIÓN</div>
            <div class="h-modal-value">${m.description || 'Sin descripción'}</div>
          </div>
          
          <div class="h-modal-section">
            <div class="h-modal-label">📅 FECHA Y HORA</div>
            <div class="h-modal-value">${fecha}</div>
          </div>
          
          <div class="h-modal-section">
            <div class="h-modal-label">💰 MONTO</div>
            <div class="h-modal-value h-modal-money ${esCredito ? 'h-money-credit' : 'h-money-debit'}">
              ${esCredito ? '+$' : '-$'}${Math.abs(m.amount).toLocaleString('es-CO')}
            </div>
          </div>
          
          ${m.orderData ? `
            <div class="h-modal-section">
              <div class="h-modal-label">📦 DETALLES</div>
              <div class="h-modal-details">
                ${smallLogo(m.orderData.product_name || '')}
                <div>
                  <div class="h-modal-product">${m.orderData.product_name || 'Producto'}</div>
                  <div class="h-modal-order">#${(m.orderData.id || '').substring(0, 8)}</div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <button class="h-btn-cerrar" onclick="closeModal()">✓ Cerrar</button>
        </div>
      </div>
    `);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

const HistorialCSS = `
<style>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

.h-container { max-width: 720px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; }

/* HEADER */
.h-header {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%);
  border-radius: 28px;
  padding: 36px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.4);
}
.h-header::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}
.h-header::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(16, 197, 132, 0.3) 0%, transparent 70%);
  animation: pulse 5s ease-in-out infinite reverse;
}
.h-header-content { position: relative; z-index: 1; }
.h-header-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.h-header-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 6px; }
.h-header-title { font-size: 32px; font-weight: 800; color: white; margin: 0; }
.h-header-subtitle { font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 4px; }

/* METRICS */
.h-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.h-metric {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  transition: all 0.3s;
}
.h-metric:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
.h-metric-credit { border-color: rgba(16, 185, 129, 0.2); }
.h-metric-debit { border-color: rgba(239, 68, 68, 0.2); }
.h-metric-balance { border-color: rgba(99, 102, 241, 0.2); }
.h-metric-icon { font-size: 32px; margin-bottom: 8px; }
.h-metric-value { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.h-metric-credit .h-metric-value { color: #10b981; }
.h-metric-debit .h-metric-value { color: #ef4444; }
.h-metric-balance .h-metric-value { color: #6366f1; }
.h-metric-label { font-size: 12px; color: #64748b; font-weight: 600; }

/* TABS */
.h-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.h-tab {
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255,255,255,0.9);
  border: 2px solid rgba(148,163,184,0.3);
}
.h-tab:hover { transform: translateY(-2px); }

/* CARD */
.h-card {
  background: white;
  border-radius: 18px;
  margin-bottom: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.h-card:hover { transform: translateX(4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
.h-card-credit { border-left: 4px solid #10b981; }
.h-card-debit { border-left: 4px solid #ef4444; }
.h-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.h-card-credit .h-card-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.h-card-debit .h-card-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.h-card-info { flex: 1; min-width: 0; }
.h-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-card-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #64748b; }
.h-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.h-badge-credit { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.h-badge-debit { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.h-card-amount { font-size: 18px; font-weight: 800; white-space: nowrap; }
.h-amount-credit { color: #10b981; }
.h-amount-debit { color: #ef4444; }
.h-card-action {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.3s;
}
.h-card-action:hover { background: #e2e8f0; color: #475569; }

/* EMPTY */
.h-empty { text-align: center; padding: 60px 40px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }
.h-empty-icon { font-size: 64px; margin-bottom: 16px; }
.h-empty-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.h-empty-sub { font-size: 14px; color: #64748b; }

/* MODAL */
.h-modal { background: white; border-radius: 24px; overflow: hidden; }
.h-modal-header {
  padding: 32px;
  text-align: center;
  color: white;
}
.h-modal-credit { background: linear-gradient(135deg, #10b981, #059669); }
.h-modal-debit { background: linear-gradient(135deg, #ef4444, #dc2626); }
.h-modal-icon {
  width: 64px;
  height: 64px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.h-modal-amount { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
.h-modal-type { font-size: 16px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
.h-modal-body { padding: 28px; }
.h-modal-section { margin-bottom: 20px; }
.h-modal-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.h-modal-value { font-size: 15px; color: #334155; }
.h-modal-money { font-size: 20px; font-weight: 800; }
.h-money-credit { color: #10b981; }
.h-money-debit { color: #ef4444; }
.h-modal-details { display: flex; align-items: center; gap: 14px; background: #f8fafc; border-radius: 12px; padding: 14px; }
.h-modal-product { font-size: 14px; font-weight: 700; color: #0f172a; }
.h-modal-order { font-size: 12px; color: #64748b; font-family: monospace; }
.h-btn-cerrar {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.h-btn-cerrar:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4); }

/* RESPONSIVE */
@media (max-width: 640px) {
  .h-header { padding: 24px; border-radius: 20px; }
  .h-header-title { font-size: 24px; }
  .h-metrics { grid-template-columns: 1fr; }
  .h-tabs { grid-template-columns: 1fr; }
  .h-card { flex-wrap: wrap; }
  .h-card-amount { width: 100%; text-align: right; margin-top: 8px; }
}
</style>`;

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function improvedHistoryView() {
  const movimientos = buildMovements();
  
  const totalCreditos = movimientos.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const totalDebitos = Math.abs(movimientos.filter(m => m.amount < 0).reduce((s, m) => s + m.amount, 0));
  const countCreditos = movimientos.filter(m => m.amount > 0).length;
  const countDebitos = movimientos.filter(m => m.amount < 0).length;
  
  return HistorialCSS + `
    <div class="h-container">
      
      <!-- HEADER -->
      <div class="h-header">
        <div class="h-header-content">
          <div class="h-header-top">
            <div>
              <div class="h-header-label">Historial</div>
              <h1 class="h-header-title">Movimientos</h1>
              <div class="h-header-subtitle">Tus recargas y gastos</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- METRICS -->
      <div class="h-metrics">
        <div class="h-metric h-metric-credit">
          <div class="h-metric-icon">💰</div>
          <div class="h-metric-value">$${totalCreditos.toLocaleString('es-CO')}</div>
          <div class="h-metric-label">Total Recargas (${countCreditos})</div>
        </div>
        <div class="h-metric h-metric-debit">
          <div class="h-metric-icon">🛒</div>
          <div class="h-metric-value">$${totalDebitos.toLocaleString('es-CO')}</div>
          <div class="h-metric-label">Total Gastos (${countDebitos})</div>
        </div>
        <div class="h-metric h-metric-balance">
          <div class="h-metric-icon">💎</div>
          <div class="h-metric-value">$${(state.user?.balance || 0).toLocaleString('es-CO')}</div>
          <div class="h-metric-label">Saldo Actual</div>
        </div>
      </div>
      
      <!-- TABS -->
      <div class="h-tabs">
        <button class="h-tab" data-filtro="todos" onclick="Historial.cambiarFiltro('todos')">
          📋 Todos (${movimientos.length})
        </button>
        <button class="h-tab" data-filtro="creditos" onclick="Historial.cambiarFiltro('creditos')">
          💰 Créditos (${countCreditos})
        </button>
        <button class="h-tab" data-filtro="debitos" onclick="Historial.cambiarFiltro('debitos')">
          📉 Débitos (${countDebitos})
        </button>
      </div>
      
      <!-- LISTA -->
      <div id="h-lista">${Historial.renderMovimientos()}</div>
    </div>
    <script>
      Historial.render();
    </script>
  `;
}

console.log('✅ Historial Premium v1 - Movimientos Mejorados');

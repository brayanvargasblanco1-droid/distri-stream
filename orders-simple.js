/**
 * COMPRAS PREMIUM v1 - Mis Compras Mejorado
 */

const Compras = {
  filtroActual: 'todas',
  
  filtros: ['todas', 'activas', 'vencidas'],
  
  cambiarFiltro(filtro) {
    this.filtroActual = filtro;
    this.render();
  },
  
  getOrdenes() {
    const allOrders = state.orders || [];
    
    switch(this.filtroActual) {
      case 'activas': return allOrders.filter(o => daysLeft(o.expires_at) >= 0);
      case 'vencidas': return allOrders.filter(o => daysLeft(o.expires_at) < 0);
      default: return allOrders;
    }
  },
  
  render() {
    document.querySelectorAll('.o-tab').forEach(btn => {
      if (btn.dataset.filtro === this.filtroActual) {
        btn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        btn.style.color = 'white';
        btn.style.borderColor = '#6366f1';
        btn.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.color = '#64748b';
        btn.style.borderColor = 'rgba(148,163,184,0.3)';
        btn.style.boxShadow = 'none';
      }
    });
    
    document.getElementById('o-lista').innerHTML = this.renderOrdenes();
  },
  
  renderOrdenes() {
    const ordenes = this.getOrdenes().sort((a, b) => new Date(b.created_at || b.expires_at) - new Date(a.created_at || a.expires_at));
    
    if (ordenes.length === 0) {
      return `
        <div class="o-empty">
          <div class="o-empty-icon">🛒</div>
          <div class="o-empty-title">Sin compras</div>
          <div class="o-empty-sub">Aún no has realizado ninguna compra</div>
        </div>
      `;
    }
    
    return ordenes.map((o, i) => this.renderCard(o, i)).join('');
  },
  
  renderCard(o, idx) {
    const left = daysLeft(o.expires_at);
    const isExpired = left !== null && left < 0;
    const isActive = left !== null && left >= 0;
    const daysText = left !== null ? (isExpired ? `Vencida hace ${Math.abs(left)} días` : `${left} días restantes`) : 'Sin fecha';
    
    return `
      <div class="o-card ${isExpired ? 'o-card-expired' : isActive ? 'o-card-active' : ''}" style="animation-delay: ${idx * 0.05}s">
        
        <div class="o-card-header">
          <div class="o-card-product">
            ${smallLogo(o.product_name || '')}
            <div>
              <div class="o-card-name">${o.product_name || 'Producto'}</div>
              <div class="o-card-code">#${(o.code || o.id || '0000').substring(0, 8)}</div>
            </div>
          </div>
          <div class="o-card-status ${isExpired ? 'o-status-expired' : isActive ? 'o-status-active' : 'o-status-other'}">
            ${isExpired ? '❌' : isActive ? '✓' : '📋'} ${isExpired ? 'Vencida' : isActive ? 'Activa' : o.status || 'Entregada'}
          </div>
        </div>
        
        ${left !== null ? `
          <div class="o-card-expiry ${isExpired ? 'o-expiry-expired' : 'o-expiry-active'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isExpired ? 
                '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>' :
                '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
              }
            </svg>
            <span>${daysText}</span>
          </div>
        ` : ''}
        
        <div class="o-card-footer">
          <div class="o-card-amount">$${(o.amount || o.total || 0).toLocaleString('es-CO')}</div>
          <div class="o-card-actions">
            <button class="o-btn-datos" onclick="openAccountModal('${safeOrder(o)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Ver datos
            </button>
            <button class="o-btn-report" onclick="openReport('${o.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Reportar
            </button>
          </div>
        </div>
      </div>
    `;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

const ComprasCSS = `
<style>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

.o-container { max-width: 720px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; }

/* HEADER */
.o-header {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
  border-radius: 28px;
  padding: 36px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.4);
}
.o-header::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.4) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}
.o-header::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  animation: pulse 5s ease-in-out infinite reverse;
}
.o-header-content { position: relative; z-index: 1; }
.o-header-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 6px; }
.o-header-title { font-size: 32px; font-weight: 800; color: white; margin: 0; }

/* METRICS */
.o-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.o-metric {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  transition: all 0.3s;
}
.o-metric:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
.o-metric-total { border-color: rgba(99, 102, 241, 0.2); }
.o-metric-active { border-color: rgba(16, 185, 129, 0.2); }
.o-metric-expired { border-color: rgba(239, 68, 68, 0.2); }
.o-metric-icon { font-size: 28px; margin-bottom: 8px; }
.o-metric-value { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.o-metric-total .o-metric-value { color: #6366f1; }
.o-metric-active .o-metric-value { color: #10b981; }
.o-metric-expired .o-metric-value { color: #ef4444; }
.o-metric-label { font-size: 12px; color: #64748b; font-weight: 600; }

/* TABS */
.o-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.o-tab {
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
.o-tab:hover { transform: translateY(-2px); }

/* CARD */
.o-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 14px;
  padding: 20px;
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transition: all 0.3s;
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}
.o-card:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
.o-card-active { border-left: 4px solid #10b981; }
.o-card-expired { border-left: 4px solid #ef4444; }
.o-card-other { border-left: 4px solid #6366f1; }

.o-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.o-card-product { display: flex; align-items: center; gap: 14px; }
.o-card-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.o-card-code { font-size: 12px; color: #64748b; font-family: monospace; }
.o-card-status { padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; }
.o-status-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.o-status-expired { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.o-status-other { background: rgba(99, 102, 241, 0.15); color: #6366f1; }

.o-card-expiry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 14px;
}
.o-expiry-active { background: rgba(16, 185, 129, 0.1); color: #059669; }
.o-expiry-expired { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

.o-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #f1f5f9; }
.o-card-amount { font-size: 20px; font-weight: 800; color: #0f172a; }
.o-card-actions { display: flex; gap: 10px; }

.o-btn-datos, .o-btn-report {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}
.o-btn-datos {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366f1;
}
.o-btn-datos:hover { background: #6366f1; color: white; }
.o-btn-report {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}
.o-btn-report:hover { background: #ef4444; color: white; }

/* EMPTY */
.o-empty { text-align: center; padding: 60px 40px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }
.o-empty-icon { font-size: 64px; margin-bottom: 16px; }
.o-empty-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.o-empty-sub { font-size: 14px; color: #64748b; }

/* RESPONSIVE */
@media (max-width: 640px) {
  .o-header { padding: 24px; border-radius: 20px; }
  .o-header-title { font-size: 24px; }
  .o-metrics { grid-template-columns: 1fr; }
  .o-tabs { grid-template-columns: 1fr; }
  .o-card-footer { flex-direction: column; gap: 12px; align-items: stretch; }
  .o-card-actions { justify-content: center; }
}
</style>`;

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function improvedOrdersView() {
  const allOrders = state.orders || [];
  const active = allOrders.filter(o => daysLeft(o.expires_at) >= 0);
  const expired = allOrders.filter(o => daysLeft(o.expires_at) < 0);
  
  const totalGastado = allOrders.reduce((s, o) => s + Number(o.amount || o.total || 0), 0);
  
  return ComprasCSS + `
    <div class="o-container">
      
      <!-- HEADER -->
      <div class="o-header">
        <div class="o-header-content">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
            <div>
              <div class="o-header-label">Mi Cuenta</div>
              <h1 class="o-header-title">Mis Compras</h1>
            </div>
            <button onclick="exportMyOrdersCsv()" title="Descarga todas tus compras en CSV (código, producto, cuenta, vencimiento, monto)" style="display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px solid rgba(255,255,255,.35);border-radius:12px;background:rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:800;cursor:pointer;backdrop-filter:blur(8px);transition:all .2s" onmouseover="this.style.background='rgba(255,255,255,.28)'" onmouseout="this.style.background='rgba(255,255,255,.15)'">⬇️ Exportar (CSV)</button>
          </div>
        </div>
      </div>
      
      <!-- METRICS -->
      <div class="o-metrics">
        <div class="o-metric o-metric-total">
          <div class="o-metric-icon">🛒</div>
          <div class="o-metric-value">${allOrders.length}</div>
          <div class="o-metric-label">Total Compras</div>
        </div>
        <div class="o-metric o-metric-active">
          <div class="o-metric-icon">✓</div>
          <div class="o-metric-value">${active.length}</div>
          <div class="o-metric-label">Activas</div>
        </div>
        <div class="o-metric o-metric-expired">
          <div class="o-metric-icon">❌</div>
          <div class="o-metric-value">${expired.length}</div>
          <div class="o-metric-label">Vencidas</div>
        </div>
      </div>
      
      <!-- TABS -->
      <div class="o-tabs">
        <button class="o-tab" data-filtro="todas" onclick="Compras.cambiarFiltro('todas')">
          📋 Todas (${allOrders.length})
        </button>
        <button class="o-tab" data-filtro="activas" onclick="Compras.cambiarFiltro('activas')">
          ✓ Activas (${active.length})
        </button>
        <button class="o-tab" data-filtro="vencidas" onclick="Compras.cambiarFiltro('vencidas')">
          ❌ Vencidas (${expired.length})
        </button>
      </div>
      
      <!-- LISTA -->
      <div id="o-lista">${Compras.renderOrdenes()}</div>
    </div>
    <script>
      Compras.render();
    </script>
  `;
}

// Exportar mis compras a CSV (kit mayorista: el Revendedor entrega o archiva
// sus cuentas compradas; útil también para el cliente). Solo datos propios.
function exportMyOrdersCsv(){
  const rows=(state.orders||[]);
  if(!rows.length) return toast('No tienes compras para exportar','bad');
  const csvCell=v=>{
    const s=String(v===null||v===undefined?'':v);
    return '"' + s.replace(/"/g,'""') + '"';
  };
  const header=['Código','Producto','Cuenta (datos entregados)','Vence','Estado','Monto','Fecha compra'];
  const lines=rows.map(o=>[
    o.code||o.id||'',
    o.product_name||'',
    o.delivered_data||o.credentials||'',
    o.expires_at?formatDate(o.expires_at):'',
    o.status||'Entregado',
    Number(o.amount||o.total||0),
    o.created_at?formatDate(o.created_at):''
  ].map(csvCell).join(';'));
  downloadFile('mis-compras-'+new Date().toISOString().slice(0,10)+'.csv', '\ufeff' + header.map(csvCell).join(';') + '\n' + lines.join('\n'));
  toast('✓ CSV exportado (' + rows.length + ' compras)','ok');
}

console.log('✅ Compras Premium v1 - Mis Compras Mejorado');

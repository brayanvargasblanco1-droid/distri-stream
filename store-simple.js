/**
 * TIENDA PREMIUM v1 - Productos Mejorados
 */

const Tienda = {
  filtroActual: 'disponibles',
  
  filtros: ['disponibles', 'agotados'],
  
  cambiarFiltro(filtro) {
    this.filtroActual = filtro;
    this.render();
  },
  
  render() {
    document.querySelectorAll('.t-tab').forEach(btn => {
      if (btn.dataset.filtro === this.filtroActual) {
        btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        btn.style.color = 'white';
        btn.style.borderColor = '#f59e0b';
        btn.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.color = '#64748b';
        btn.style.borderColor = 'rgba(148,163,184,0.3)';
        btn.style.boxShadow = 'none';
      }
    });
    
    document.getElementById('t-lista').innerHTML = this.renderProductos();
  },
  
  getProductos() {
    const sorted = [...state.products].sort((a,b) => 
      ((b.status==="Activo"||!b.status)?1:0)-((a.status==="Activo"||!a.status)?1:0) || 
      Number(b.stock||0)-Number(a.stock||0)
    );
    
    const disponibles = sorted.filter(p => (p.status==="Activo"||!p.status) && Number(p.stock) > 0);
    const agotados = sorted.filter(p => !((p.status==="Activo"||!p.status) && Number(p.stock) > 0));
    
    return this.filtroActual === 'disponibles' ? disponibles : agotados;
  },
  
  renderProductos() {
    const productos = this.getProductos();
    
    if (productos.length === 0) {
      return `
        <div class="t-empty">
          <div class="t-empty-icon">📦</div>
          <div class="t-empty-title">${this.filtroActual === 'disponibles' ? 'No hay productos disponibles' : 'No hay productos agotados'}</div>
          <div class="t-empty-sub">${this.filtroActual === 'disponibles' ? 'Pronto habrá más productos' : 'Todos los productos tienen stock'}</div>
        </div>
      `;
    }
    
    return `
      <div class="t-grid">
        ${productos.map(p => this.renderCard(p)).join('')}
      </div>
    `;
  },
  
  renderCard(p) {
    const disponible = (p.status==="Activo"||!p.status) && Number(p.stock) > 0;
    const precio = salePrice(p);
    const bajoStock = Number(p.stock) <= 2 && disponible;
    const stockText = disponible 
      ? (bajoStock ? `¡Solo ${p.stock}!` : `${p.stock} disponibles`)
      : 'Agotado';
    const puedeComprar = disponible && canBuyProduct(p);
    
    const logos = this.getLogo(p.name);
    
    return `
      <div class="t-card ${disponible ? 't-card-available' : 't-card-unavailable'}" style="animation-delay: ${Math.random() * 0.3}s">
        <div class="t-card-badge ${bajoStock ? 't-badge-urgent' : disponible ? 't-badge-available' : 't-badge-sold'}">
          ${bajoStock ? '🔥 ¡Últimos!' : disponible ? '✓ Disponible' : '❌ Agotado'}
        </div>
        <div class="t-card-logo">
          ${logos}
        </div>
        <div class="t-card-info">
          <div class="t-card-name">${serviceName(p.name)}</div>
          <div class="t-card-stock ${bajoStock ? 't-stock-low' : disponible ? 't-stock-ok' : 't-stock-out'}">
            ${bajoStock ? '🔥 ' : disponible ? '📦 ' : '❌ '}${stockText}
          </div>
        </div>
        <div class="t-card-price">$${precio.toLocaleString('es-CO')}</div>
        <div class="t-card-action">
          ${disponible && puedeComprar 
            ? `<button class="t-btn-buy" onclick="openBuy('${p.id}')">🛒 Comprar</button>`
            : disponible && !puedeComprar
            ? `<button class="t-btn-disabled" disabled>Límite alcanzado</button>`
            : `<button class="t-btn-disabled" disabled>Agotado</button>`
          }
        </div>
      </div>
    `;
  },
  
  getLogo(name) {
    const cls = serviceClass(name);
    const logos = {
      netflix: `<div class="t-logo t-logo-netflix"><span>N</span></div>`,
      spotify: `<div class="t-logo t-logo-spotify"><span>♫</span></div>`,
      max: `<div class="t-logo t-logo-max"><span>max</span></div>`,
      prime: `<div class="t-logo t-logo-prime"><span>PV</span></div>`,
      disney: `<div class="t-logo t-logo-disney"><span>D+</span></div>`,
      youtube: `<div class="t-logo t-logo-youtube"><span>▶</span></div>`,
      other: `<div class="t-logo t-logo-other"><span>?</span></div>`
    };
    return logos[cls] || logos.other;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

const TiendaCSS = `
<style>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.t-container { max-width: 900px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; }

/* HEADER */
.t-header {
  background: linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fbbf24 100%);
  border-radius: 28px;
  padding: 36px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.4);
}
.t-header::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}
.t-header::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
  animation: pulse 5s ease-in-out infinite reverse;
}
.t-header-content { position: relative; z-index: 1; }
.t-header-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.8); margin-bottom: 6px; }
.t-header-title { font-size: 36px; font-weight: 800; color: white; margin: 0; }
.t-header-subtitle { font-size: 16px; color: rgba(255,255,255,0.9); margin-top: 8px; }

/* METRICS */
.t-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.t-metric {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  transition: all 0.3s;
}
.t-metric:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
.t-metric-total { border-color: rgba(245, 158, 11, 0.2); }
.t-metric-available { border-color: rgba(16, 185, 129, 0.2); }
.t-metric-sold { border-color: rgba(239, 68, 68, 0.2); }
.t-metric-icon { font-size: 28px; margin-bottom: 8px; }
.t-metric-value { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
.t-metric-total .t-metric-value { color: #f59e0b; }
.t-metric-available .t-metric-value { color: #10b981; }
.t-metric-sold .t-metric-value { color: #ef4444; }
.t-metric-label { font-size: 12px; color: #64748b; font-weight: 600; }

/* TABS */
.t-tabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
.t-tab {
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
.t-tab:hover { transform: translateY(-2px); }

/* GRID */
.t-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
  gap: 20px; 
}

/* CARD */
.t-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  position: relative;
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  opacity: 1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  text-align: center;
}
.t-card:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
.t-card-available { border-color: rgba(16, 185, 129, 0.2); }
.t-card-unavailable { border-color: rgba(239, 68, 68, 0.1); opacity: 0.7; }

.t-card-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.t-badge-available { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.t-badge-urgent { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; animation: bounce 1s ease-in-out infinite; }
.t-badge-sold { background: linear-gradient(135deg, #6b7280, #4b5563); color: #fff; box-shadow: 0 2px 8px rgba(107,114,128,0.35); }

.t-card-logo { margin: 20px 0; }
.t-logo { width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
.t-logo span { color: white; font-weight: 900; font-size: 24px; }
.t-logo-netflix { background: linear-gradient(135deg, #E50914, #b20710); border-radius: 16px; }
.t-logo-netflix span { font-size: 36px; }
.t-logo-spotify { background: #1DB954; border-radius: 50%; }
.t-logo-spotify span { font-size: 32px; }
.t-logo-max { background: #000; border-radius: 10px; }
.t-logo-max span { font-size: 16px; font-family: Arial; letter-spacing: 2px; }
.t-logo-prime { background: linear-gradient(135deg, #00A8E1, #0077b6); border-radius: 10px; }
.t-logo-prime span { font-size: 14px; }
.t-logo-disney { background: linear-gradient(135deg, #0E1A40, #1a2966); border-radius: 10px; }
.t-logo-disney span { font-size: 18px; }
.t-logo-youtube { background: #FF0000; border-radius: 14px; }
.t-logo-youtube span { font-size: 28px; }
.t-logo-other { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; }

.t-card-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.t-card-stock { font-size: 13px; font-weight: 600; margin-bottom: 16px; }
.t-stock-ok { color: #10b981; }
.t-stock-low { color: #ef4444; }
.t-stock-out { color: #6b7280; }

.t-card-price { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }

.t-btn-buy {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.t-btn-buy:hover { transform: scale(1.02); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); }

.t-btn-disabled {
  width: 100%;
  padding: 14px 20px;
  background: #f1f5f9;
  border: none;
  border-radius: 14px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 700;
  cursor: not-allowed;
}

/* EMPTY */
.t-empty { text-align: center; padding: 60px 40px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }
.t-empty-icon { font-size: 64px; margin-bottom: 16px; }
.t-empty-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.t-empty-sub { font-size: 14px; color: #64748b; }

/* RESPONSIVE */
@media (max-width: 640px) {
  .t-header { padding: 24px; border-radius: 20px; }
  .t-header-title { font-size: 26px; }
  .t-metrics { grid-template-columns: 1fr; }
  .t-tabs { grid-template-columns: 1fr; }
  .t-grid { grid-template-columns: 1fr; }
}
</style>`;

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function improvedStoreView() {
  const sorted = [...state.products].sort((a,b) => 
    ((b.status==="Activo"||!b.status)?1:0)-((a.status==="Activo"||!a.status)?1:0) || 
    Number(b.stock||0)-Number(a.stock||0)
  );
  const disponibles = sorted.filter(p => (p.status==="Activo"||!p.status) && Number(p.stock) > 0);
  const agotados = sorted.filter(p => !((p.status==="Activo"||!p.status) && Number(p.stock) > 0));
  
  return TiendaCSS + `
    <div class="t-container">
      
      <!-- HEADER -->
      <div class="t-header">
        <div class="t-header-content">
          <div class="t-header-label">Catálogo</div>
          <h1 class="t-header-title">Tienda</h1>
          <div class="t-header-subtitle">Los mejores productos streaming</div>
        </div>
      </div>
      
      <!-- METRICS -->
      <div class="t-metrics">
        <div class="t-metric t-metric-total">
          <div class="t-metric-icon">📦</div>
          <div class="t-metric-value">${state.products.length}</div>
          <div class="t-metric-label">Total Productos</div>
        </div>
        <div class="t-metric t-metric-available">
          <div class="t-metric-icon">✓</div>
          <div class="t-metric-value">${disponibles.length}</div>
          <div class="t-metric-label">Disponibles</div>
        </div>
        <div class="t-metric t-metric-sold">
          <div class="t-metric-icon">❌</div>
          <div class="t-metric-value">${agotados.length}</div>
          <div class="t-metric-label">Agotados</div>
        </div>
      </div>
      
      <!-- TABS -->
      <div class="t-tabs">
        <button class="t-tab" data-filtro="disponibles" onclick="Tienda.cambiarFiltro('disponibles')" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-color:#f59e0b;box-shadow:0 8px 25px rgba(245,158,11,0.4)">
          ✓ Disponibles (${disponibles.length})
        </button>
        <button class="t-tab" data-filtro="agotados" onclick="Tienda.cambiarFiltro('agotados')" style="background:rgba(255,255,255,0.9);color:#64748b;border-color:rgba(148,163,184,0.3)">
          ❌ Agotados (${agotados.length})
        </button>
      </div>
      
      <!-- LISTA -->
      <div id="t-lista">${Tienda.renderProductos()}</div>
    </div>
    <script>
      Tienda.render();
    </script>
  `;
}

console.log('✅ Tienda Premium v1 - Productos Mejorado');

/**
 * 🎯 SOPORTE PREMIUM - OPERADORES Y REVENDEDORES
 * Distrito Streaming - Diseño premium y funcional
 */

// ═══════════════════════════════════════════════════════════════
// 📊 CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const SupportPremium = {
  // Estados con colores premium
  estados: {
    'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📋' },
    'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔍' },
    'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '⚙️' },
    'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
    'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' }
  },
  
  // Categorías con iconos
  categorias: {
    'Producto no llegó': '📦',
    'Defectuoso': '⚠️',
    'No funciona': '🚫',
    'Otro': '❓'
  },

  // Tiempo relativo
  tiempo(dateStr) {
    if (!dateStr) return '-';
    const fecha = new Date(dateStr);
    const ahora = new Date();
    const diffMins = Math.floor((ahora - fecha) / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  },

  // Obtener estado
  getEstado(status) {
    return this.estados[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '📌' };
  },

  // Obtener categoría
  getCategoria(reason) {
    if (!reason) return { icon: '📋', label: 'General' };
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('llegó') || reasonLower.includes('llegar')) return { icon: '📦', label: 'Entrega' };
    if (reasonLower.includes('defect') || reasonLower.includes('mal')) return { icon: '⚠️', label: 'Defectuoso' };
    if (reasonLower.includes('funcion') || reasonLower.includes('acceso')) return { icon: '🚫', label: 'Acceso' };
    return { icon: '📋', label: 'General' };
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎨 PANEL PREMIUM
// ═══════════════════════════════════════════════════════════════

function reportsUserSimple() {
  const todos = state.reports || [];
  const activos = todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status));
  const resueltos = todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));

  return `
    <div style="margin-bottom:16px">
      <!-- Header Premium -->
      <div style="background:linear-gradient(135deg,var(--blue),#764ba2);border-radius:16px;padding:20px;margin-bottom:16px;color:#fff;position:relative;overflow:hidden">
        <div style="position:absolute;top:-50%;right:-10%;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%"></div>
        <div style="position:absolute;bottom:-30%;left:-5%;width:150px;height:150px;background:rgba(255,255,255,0.05);border-radius:50%"></div>
        <div style="position:relative">
          <div style="font-size:12px;opacity:0.8;margin-bottom:4px">PANEL DE SOPORTE</div>
          <div style="font-size:20px;font-weight:900;margin-bottom:16px">Mis Reportes</div>
          
          <!-- Stats -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:12px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:900">${activos.length}</div>
              <div style="font-size:11px;opacity:0.8">Activos</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:12px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:900">${resueltos.length}</div>
              <div style="font-size:11px;opacity:0.8">Resueltos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Premium -->
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button onclick="soporteCambiarTab('activos')" id="tab_soporte_activos" style="flex:1;padding:12px;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,var(--blue),#0057dc);color:#fff;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px">
          🔵 Activos <span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:10px;font-size:11px">${activos.length}</span>
        </button>
        <button onclick="soporteCambiarTab('resueltos')" id="tab_soporte_resueltos" style="flex:1;padding:12px;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;background:var(--panel);color:var(--muted);border:1px solid var(--line);transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px">
          ✅ Resueltos <span style="background:var(--soft);padding:2px 8px;border-radius:10px;font-size:11px">${resueltos.length}</span>
        </button>
      </div>

      <!-- Lista Premium -->
      <div id="soporte_lista_premium">
        ${renderSoportePremium(activos)}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 📋 RENDERIZADO PREMIUM
// ═══════════════════════════════════════════════════════════════

let soporteTabActual = 'activos';

function soporteCambiarTab(tab) {
  soporteTabActual = tab;
  const todos = state.reports || [];
  const reportes = tab === 'activos' 
    ? todos.filter(r => !['Resuelto', 'Rechazado'].includes(r.status))
    : todos.filter(r => ['Resuelto', 'Rechazado'].includes(r.status));

  // Estilo tabs
  const tabActivo = document.getElementById('tab_soporte_activos');
  const tabResuelto = document.getElementById('tab_soporte_resueltos');
  
  if (tab === 'activos') {
    tabActivo.style.background = 'linear-gradient(135deg,var(--blue),#0057dc)';
    tabActivo.style.color = '#fff';
    tabResuelto.style.background = 'var(--panel)';
    tabResuelto.style.color = 'var(--muted)';
  } else {
    tabResuelto.style.background = 'linear-gradient(135deg,var(--ok),#059669)';
    tabResuelto.style.color = '#fff';
    tabActivo.style.background = 'var(--panel)';
    tabActivo.style.color = 'var(--muted)';
  }

  document.getElementById('soporte_lista_premium').innerHTML = renderSoportePremium(reportes);
}

function renderSoportePremium(reportes) {
  if (!reportes || reportes.length === 0) {
    return `
      <div style="text-align:center;padding:50px 20px;background:var(--panel);border:1px solid var(--line);border-radius:16px">
        <div style="font-size:56px;margin-bottom:16px;opacity:0.5">📭</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">Sin reportes ${soporteTabActual === 'activos' ? 'activos' : 'resueltos'}</div>
        <div style="font-size:13px;color:var(--muted)">${soporteTabActual === 'activos' ? 'Todos tus reportes aparecerán aquí' : 'Los reportes resueltos aparecerán aquí'}</div>
      </div>
    `;
  }

  return reportes.map(r => {
    const estado = SupportPremium.getEstado(r.status);
    const categoria = SupportPremium.getCategoria(r.reason);
    const esDueno = r.user_id === state.user?.id || r.client_id === state.user?.id;
    
    return `
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px;transition:all .2s;position:relative;overflow:hidden"
           onmouseover="this.style.borderColor='var(--blue)';this.style.boxShadow='0 4px 20px rgba(8,119,255,0.15)'"
           onmouseout="this.style.borderColor='var(--line)';this.style.boxShadow='none'">
        
        <!-- Indicador lateral -->
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${estado.color};border-radius:16px 0 0 16px"></div>
        
        <div style="padding-left:12px">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:14px">${categoria.icon}</span>
                <span style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">${categoria.label}</span>
              </div>
              <div style="font-size:15px;font-weight:800;color:var(--text)">${esc(r.product_name || 'Producto')}</div>
            </div>
            <span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${estado.bg};color:${estado.color}">
              ${estado.icon} ${r.status}
            </span>
          </div>
          
          <!-- Detalle del reporte -->
          <div style="background:var(--soft);border-radius:10px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">MOTIVO</div>
            <div style="font-size:13px;color:var(--text);margin-bottom:${r.description ? '10px' : '0'}">${esc(r.reason || 'Sin motivo especificado')}</div>
            ${r.description ? `
              <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;margin-top:8px">DESCRIPCIÓN</div>
              <div style="font-size:12px;color:var(--text);line-height:1.5">${esc(r.description)}</div>
            ` : ''}
          </div>
          
          <!-- Info y acciones -->
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:11px;color:var(--muted)">
              📅 ${SupportPremium.tiempo(r.created_at)}
              ${r.order_id ? ` · 📦 #${r.order_id.substring(0,8)}` : ''}
            </div>
            
            <div style="display:flex;gap:8px">
              <button onclick="verDetalleSoporte('${r.id}')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s"
                      onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(8,119,255,0.3)'"
                      onmouseout="this.style.transform='';this.style.boxShadow=''">
                👁️ Ver
              </button>
              ${(esDueno || isAdmin()) ? `
                <button onclick="confirmDeleteReport('${r.id}')" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s"
                        onmouseover="this.style.background='#ef4444';this.style.color='#fff'"
                        onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'">
                  🗑️ Eliminar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// 📋 DETALLE PREMIUM
// ═══════════════════════════════════════════════════════════════

function verDetalleSoporte(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;

  const estado = SupportPremium.getEstado(r.status);
  const categoria = SupportPremium.getCategoria(r.reason);
  const esDueno = r.user_id === state.user?.id || r.client_id === state.user?.id;

  openModal(`
    <div style="padding:0;max-height:85vh;overflow-y:auto">
      <!-- Header con gradiente -->
      <div style="background:linear-gradient(135deg,${estado.color},${estado.color}99);padding:24px;text-align:center;color:#fff;position:relative">
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"80\" cy=\"20\" r=\"30\" fill=\"rgba(255,255,255,0.1)\"/></svg>');background-size:cover"></div>
        <div style="position:relative">
          <div style="font-size:40px;margin-bottom:12px">${categoria.icon}</div>
          <div style="font-size:18px;font-weight:900;margin-bottom:4px">${esc(r.product_name || 'Producto')}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:rgba(255,255,255,0.2);border-radius:20px;font-size:12px;font-weight:700">
            ${estado.icon} ${r.status}
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div style="padding:20px">
        ${r.reason ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📋 Motivo</div>
            <div style="padding:14px;background:var(--soft);border-radius:12px;font-size:14px;line-height:1.6">${esc(r.reason)}</div>
          </div>
        ` : ''}

        ${r.description ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📝 Descripción</div>
            <div style="padding:14px;background:var(--soft);border-radius:12px;font-size:14px;line-height:1.6">${esc(r.description)}</div>
          </div>
        ` : ''}

        ${r.account_data ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">🔐 Datos de cuenta</div>
            <div style="padding:14px;background:var(--soft);border-radius:12px;font-size:13px;font-family:monospace;white-space:pre-wrap">${esc(r.account_data)}</div>
          </div>
        ` : ''}

        ${r.provider_response ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">💬 Respuesta del equipo</div>
            <div style="padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;font-size:14px;line-height:1.6">${esc(r.provider_response)}</div>
          </div>
        ` : ''}

        ${r.status === 'Rechazado' && r.rejection_reason ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--bad);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">❌ Motivo del rechazo</div>
            <div style="padding:14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;font-size:14px;line-height:1.6">${esc(r.rejection_reason)}</div>
          </div>
        ` : ''}

        <!-- Info adicional -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          <div style="padding:12px;background:var(--soft);border-radius:10px;text-align:center">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">CREADO</div>
            <div style="font-size:12px;font-weight:700">${SupportPremium.tiempo(r.created_at)}</div>
          </div>
          ${r.order_id ? `
            <div style="padding:12px;background:var(--soft);border-radius:10px;text-align:center">
              <div style="font-size:10px;color:var(--muted);margin-bottom:4px">PEDIDO</div>
              <div style="font-size:12px;font-weight:700">#${r.order_id.substring(0,8)}</div>
            </div>
          ` : '<div></div>'}
        </div>

        <!-- Botones -->
        <div style="display:flex;gap:10px">
          <button onclick="closeModal()" style="flex:1;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);font-size:14px;font-weight:700;cursor:pointer">
            Cerrar
          </button>
          ${(esDueno || isAdmin()) ? `
            <button onclick="closeModal();setTimeout(()=>confirmDeleteReport('${r.id}'),300)" style="flex:1;padding:14px;border:none;border-radius:12px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:14px;font-weight:700;cursor:pointer">
              🗑️ Eliminar
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

console.log('✅ Soporte Premium cargado');

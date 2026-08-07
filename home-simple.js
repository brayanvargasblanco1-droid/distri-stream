/**
 * INICIO PREMIUM ULTRA v1 - Diseño Espectacular
 */

const HomePremium = {
  init() {
    this.injectStyles();
  },
  
  injectStyles() {
    const css = `
    /* ═══════════════════════════════════════════════════════════════════
       INICIO PREMIUM ULTRA - ESTILOS ESPECIALES
       ═══════════════════════════════════════════════════════════════════ */
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
      50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.3); }
    }
    
    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes ripple {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: scale(4); opacity: 0; }
    }
    
    @keyframes slideInStagger {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Contenedor Principal */
    .home-premium-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 16px;
      padding-bottom: 100px;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       HEADER - SALUDO
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-header {
      position: relative;
      padding: 28px;
      margin-bottom: 20px;
      border-radius: 28px;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      overflow: hidden;
      animation: fadeInUp 0.6s ease forwards;
    }
    
    .hp-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }
    
    .hp-header::after {
      content: '';
      position: absolute;
      bottom: -80%;
      left: -20%;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
      animation: float 8s ease-in-out infinite reverse;
    }
    
    .hp-header-content {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .hp-greeting {
      color: white;
    }
    
    .hp-greeting-text {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.85;
      margin-bottom: 4px;
    }
    
    .hp-greeting-name {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .hp-wave {
      display: inline-block;
      animation: wave 1.5s ease-in-out infinite;
      transform-origin: 70% 70%;
    }
    
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      30% { transform: rotate(14deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60%, 100% { transform: rotate(0deg); }
    }
    
    .hp-date-badge {
      text-align: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 10px 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .hp-date-day {
      font-size: 24px;
      font-weight: 800;
      color: white;
      line-height: 1;
    }
    
    .hp-date-month {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       TARJETA DE SALDO
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-balance-card {
      position: relative;
      border-radius: 28px;
      padding: 32px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
      background-size: 200% 200%;
      animation: fadeInUp 0.6s ease 0.1s forwards, shimmer 4s ease infinite;
      opacity: 0;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(99, 102, 241, 0.4);
    }
    
    .hp-balance-card::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
      animation: float 5s ease-in-out infinite;
    }
    
    .hp-balance-card::after {
      content: '';
      position: absolute;
      bottom: -150px;
      left: -50px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
      animation: float 7s ease-in-out infinite reverse;
    }
    
    .hp-balance-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
    }
    
    .hp-balance-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .hp-balance-amount {
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 24px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .hp-balance-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .hp-balance-btn {
      flex: 1;
      max-width: 160px;
      padding: 14px 20px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
    }
    
    .hp-balance-btn-primary {
      background: white;
      color: #6366f1;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
    
    .hp-balance-btn-primary:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    }
    
    .hp-balance-btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .hp-balance-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-3px);
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       ESTADÍSTICAS
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .hp-stat {
      background: white;
      border-radius: 20px;
      padding: 20px 12px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideInStagger 0.5s ease forwards;
      opacity: 0;
    }
    
    .hp-stat:nth-child(1) { animation-delay: 0.2s; }
    .hp-stat:nth-child(2) { animation-delay: 0.3s; }
    .hp-stat:nth-child(3) { animation-delay: 0.4s; }
    
    .hp-stat:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.2);
    }
    
    .hp-stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 22px;
    }
    
    .hp-stat-icon-purple { background: rgba(99, 102, 241, 0.1); }
    .hp-stat-icon-green { background: rgba(16, 185, 129, 0.1); }
    .hp-stat-icon-red { background: rgba(239, 68, 68, 0.1); }
    
    .hp-stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    
    .hp-stat-value.alert {
      color: #ef4444;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .hp-stat-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       ACCIONES RÁPIDAS
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 16px;
      animation: fadeInLeft 0.5s ease 0.5s forwards;
      opacity: 0;
    }
    
    .hp-quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .hp-quick-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 8px;
      background: white;
      border-radius: 20px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: scaleIn 0.5s ease forwards;
      opacity: 0;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    
    .hp-quick-btn:nth-child(1) { animation-delay: 0.5s; }
    .hp-quick-btn:nth-child(2) { animation-delay: 0.6s; }
    .hp-quick-btn:nth-child(3) { animation-delay: 0.7s; }
    .hp-quick-btn:nth-child(4) { animation-delay: 0.8s; }
    
    .hp-quick-btn:hover {
      transform: translateY(-6px) scale(1.03);
      border-color: #6366f1;
      box-shadow: 0 15px 40px rgba(99, 102, 241, 0.2);
    }
    
    .hp-quick-btn:active {
      transform: scale(0.95);
    }
    
    .hp-quick-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: all 0.3s ease;
    }
    
    .hp-quick-btn:hover .hp-quick-icon {
      transform: scale(1.1) rotate(5deg);
    }
    
    .hp-quick-label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       LISTAS DE ITEMS
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-list-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      animation: fadeInUp 0.6s ease forwards;
      opacity: 0;
    }
    
    .hp-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .hp-list-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .hp-list-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    
    .hp-list-badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    .hp-list-badge-purple {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
    }
    
    .hp-list-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .hp-list-item:last-child {
      border-bottom: none;
    }
    
    .hp-list-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: transparent;
      transition: all 0.2s ease;
    }
    
    .hp-list-item:hover {
      background: #f8fafc;
    }
    
    .hp-list-item:hover::before {
      background: #6366f1;
    }
    
    .hp-list-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .hp-list-info {
      flex: 1;
      min-width: 0;
    }
    
    .hp-list-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .hp-list-meta {
      font-size: 12px;
      color: #64748b;
    }
    
    .hp-list-badge-inline {
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    
    .hp-list-badge-inline.ok {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }
    
    .hp-list-badge-inline.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
    
    .hp-list-badge-inline.danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       SLIDE DE BIENVENIDA
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-welcome-slide {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 20px;
      color: white;
      position: relative;
      overflow: hidden;
      animation: fadeInUp 0.6s ease 0.15s forwards;
      opacity: 0;
    }
    
    .hp-welcome-slide::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }
    
    .hp-welcome-content {
      position: relative;
      z-index: 1;
    }
    
    .hp-welcome-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 8px;
    }
    
    .hp-welcome-text {
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.5;
      margin: 0;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       EMPTY STATE
       ═══════════════════════════════════════════════════════════════════ */
    
    .hp-empty {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }
    
    .hp-empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    .hp-empty-text {
      font-size: 14px;
      font-weight: 600;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════════ */
    
    @media (max-width: 480px) {
      .hp-quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .hp-balance-amount {
        font-size: 36px;
      }
      
      .hp-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      
      .hp-stat {
        padding: 16px 8px;
      }
      
      .hp-stat-value {
        font-size: 18px;
      }
    }
    `;
    
    const style = document.createElement('style');
    style.id = 'home-premium-ultra-css';
    style.textContent = css;
    document.head.appendChild(style);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN improvedHomeView - Renderiza el Home Premium
// ═══════════════════════════════════════════════════════════════════════════════

function improvedHomeView() {
  const u = state.user || {};
  const firstName = u.name ? u.name.split(" ")[0] : "Usuario";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const day = new Date().toLocaleDateString("es-CO", { day: "2-digit" });
  const month = new Date().toLocaleDateString("es-CO", { month: "short" });

  const expiring = activeOrders().filter(o => {
    const left = daysLeft(o.expires_at);
    return left !== null && left >= -7 && left <= 14;
  }).sort((a,b) => daysLeft(a.expires_at) - daysLeft(b.expires_at));

  const recentPurchases = [...state.orders].sort((a,b) => {
    const da = a.created_at || a.expires_at || "";
    const db = b.created_at || b.expires_at || "";
    return db.localeCompare(da);
  }).slice(0, 4);

  const activeOrdersCount = activeOrders().length;
  const totalSpent = state.orders.reduce((s,o) => s + Number(o.amount || 0), 0);
  const pendingReports = (state.reports || []).filter(r => r.status === "En proceso").length;

  const getLogo = (name) => {
    const cls = serviceClass(name);
    const logos = {
      netflix: `<div style="width:44px;height:44px;background:#E50914;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff">N</div>`,
      spotify: `<div style="width:44px;height:44px;background:#1DB954;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px">♫</div>`,
      max: `<div style="width:52px;height:32px;background:#000;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">max</div>`,
      prime: `<div style="width:52px;height:34px;background:#00A8E1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">prime</div>`,
      disney: `<div style="width:44px;height:32px;background:linear-gradient(135deg,#0E1A40,#1a2966);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">D+</div>`,
      youtube: `<div style="width:44px;height:44px;background:#FF0000;border-radius:12px;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>`,
      other: `<div style="width:44px;height:44px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff">?</div>`
    };
    return logos[cls] || logos.other;
  };

  const getExpiryBadge = (left) => {
    if (left < 0) return `<span class="hp-list-badge-inline danger">Venció hace ${Math.abs(left)}d</span>`;
    if (left === 0) return `<span class="hp-list-badge-inline danger">Vence hoy</span>`;
    if (left <= 3) return `<span class="hp-list-badge-inline danger">${left}d restantes</span>`;
    if (left <= 7) return `<span class="hp-list-badge-inline warning">${left}d restantes</span>`;
    return `<span class="hp-list-badge-inline ok">${left}d restantes</span>`;
  };

  return `
    <div class="home-premium-container">
      
      <!-- HEADER SALUDO -->
      <div class="hp-header">
        <div class="hp-header-content">
          <div class="hp-greeting">
            <div class="hp-greeting-text">${greeting}</div>
            <h1 class="hp-greeting-name">
              ${firstName}
              <span class="hp-wave">👋</span>
            </h1>
          </div>
          <div class="hp-date-badge">
            <div class="hp-date-day">${day}</div>
            <div class="hp-date-month">${month}</div>
          </div>
        </div>
      </div>

      <!-- BIENVENIDA -->
      <div class="hp-welcome-slide">
        <div class="hp-welcome-content">
          <h2 class="hp-welcome-title">🎬 Bienvenido a Distrito Streaming</h2>
          <p class="hp-welcome-text">Compra, vende y gestiona tus pantallas de streaming de forma fácil y segura.</p>
        </div>
      </div>

      <!-- SALDO PRINCIPAL -->
      <div class="hp-balance-card">
        <div class="hp-balance-content">
          <div class="hp-balance-label">Saldo disponible</div>
          <div class="hp-balance-amount">${money(state.user?.balance || 0)}</div>
          <div class="hp-balance-actions">
            <button class="hp-balance-btn hp-balance-btn-primary" onclick="openTopup()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Recargar
            </button>
            <button class="hp-balance-btn hp-balance-btn-secondary" onclick="openQrCode()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              QR
            </button>
          </div>
        </div>
      </div>

      <!-- ESTADÍSTICAS -->
      <div class="hp-stats">
        <div class="hp-stat">
          <div class="hp-stat-icon hp-stat-icon-purple">📺</div>
          <div class="hp-stat-value">${activeOrdersCount}</div>
          <div class="hp-stat-label">Pantallas activas</div>
        </div>
        <div class="hp-stat">
          <div class="hp-stat-icon hp-stat-icon-green">💰</div>
          <div class="hp-stat-value">${money(totalSpent)}</div>
          <div class="hp-stat-label">Total invertido</div>
        </div>
        <div class="hp-stat">
          <div class="hp-stat-icon hp-stat-icon-red">🎫</div>
          <div class="hp-stat-value ${pendingReports > 0 ? 'alert' : ''}">${pendingReports}</div>
          <div class="hp-stat-label">Reportes abiertos</div>
        </div>
      </div>

      <!-- ACCIONES RÁPIDAS -->
      <div class="hp-section-title">⚡ Acciones rápidas</div>
      <div class="hp-quick-actions">
        <button class="hp-quick-btn" onclick="setView('store')">
          <div class="hp-quick-icon" style="background:rgba(99,102,241,0.1)">🛒</div>
          <span class="hp-quick-label">Tienda</span>
        </button>
        <button class="hp-quick-btn" onclick="setView('orders')">
          <div class="hp-quick-icon" style="background:rgba(16,185,129,0.1)">📦</div>
          <span class="hp-quick-label">Compras</span>
        </button>
        <button class="hp-quick-btn" onclick="openTopup()">
          <div class="hp-quick-icon" style="background:rgba(245,158,11,0.1)">💳</div>
          <span class="hp-quick-label">Recargar</span>
        </button>
        <button class="hp-quick-btn" onclick="setView('reports')">
          <div class="hp-quick-icon" style="background:rgba(239,68,68,0.1)">🎫</div>
          <span class="hp-quick-label">Soporte</span>
        </button>
      </div>

      ${expiring.length > 0 ? `
      <!-- CUENTAS POR VENCER -->
      <div class="hp-list-card">
        <div class="hp-list-header">
          <div class="hp-list-title">
            ⏰ Cuentas por vencer
            <span class="hp-list-badge hp-list-badge-danger">${expiring.length}</span>
          </div>
        </div>
        ${expiring.slice(0, 3).map(o => {
          const left = daysLeft(o.expires_at);
          return `
          <div class="hp-list-item" onclick="setView('orders')">
            <div class="hp-list-logo">${getLogo(o.product_name || '')}</div>
            <div class="hp-list-info">
              <div class="hp-list-name">${o.product_name || 'Producto'}</div>
              <div class="hp-list-meta">Vence: ${o.expires_at || '-'}</div>
            </div>
            ${getExpiryBadge(left)}
          </div>`;
        }).join('')}
      </div>
      ` : ''}

      ${recentPurchases.length > 0 ? `
      <!-- COMPRAS RECIENTES -->
      <div class="hp-list-card">
        <div class="hp-list-header">
          <div class="hp-list-title">
            🛍️ Compras recientes
          </div>
        </div>
        ${recentPurchases.map(o => `
          <div class="hp-list-item" onclick="setView('orders')">
            <div class="hp-list-logo">${getLogo(o.product_name || '')}</div>
            <div class="hp-list-info">
              <div class="hp-list-name">${o.product_name || 'Producto'}</div>
              <div class="hp-list-meta">${formatDate(o.created_at || o.expires_at)}</div>
            </div>
            <div style="font-weight:700;color:#0f172a">${money(o.amount || 0)}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

    </div>
  `;
}

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HomePremium.init());
} else {
  HomePremium.init();
}

console.log('✅ Inicio Premium Ultra v1 - Diseño Espectacular');

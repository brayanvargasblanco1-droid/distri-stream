/**
 * INICIO PREMIUM - Solo estilos CSS (no rompe la página)
 */

const HomePremium = {
  init() {
    this.injectStyles();
  },
  
  injectStyles() {
    const css = `
    /* ═══════════════════════════════════════════════════════════════════
       INICIO PREMIUM - ESTILOS MEJORADOS
       ═══════════════════════════════════════════════════════════════════ */
    
    @keyframes hpFadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes hpFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    
    @keyframes hpPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes hpShimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    @keyframes hpWave {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      30% { transform: rotate(14deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60%, 100% { transform: rotate(0deg); }
    }
    
    /* Contenedor Home */
    .home-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 16px;
      padding-bottom: 100px;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    
    /* Header Greeting */
    .home-greeting {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      animation: hpFadeInUp 0.5s ease forwards;
    }
    
    .home-greeting::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%);
      animation: hpFloat 6s ease-in-out infinite;
    }
    
    .greeting-text {
      position: relative;
      z-index: 1;
    }
    
    .greeting-hi {
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      display: block;
      margin-bottom: 4px;
    }
    
    .greeting-name {
      font-size: 26px;
      font-weight: 800;
      color: white;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .greeting-name .hp-wave {
      display: inline-block;
      animation: hpWave 1.5s ease-in-out infinite;
      transform-origin: 70% 70%;
      font-size: 28px;
    }
    
    .greeting-date {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 12px 18px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    
    .date-day {
      display: block;
      font-size: 28px;
      font-weight: 800;
      color: white;
      line-height: 1;
    }
    
    .date-month {
      display: block;
      font-size: 11px;
      color: rgba(255,255,255,0.8);
      text-transform: uppercase;
      font-weight: 600;
    }
    
    /* Balance Card */
    .balance-card {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
      background-size: 200% 200%;
      border-radius: 24px;
      padding: 28px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
      animation: hpFadeInUp 0.5s ease 0.1s forwards;
      opacity: 0;
    }
    
    .balance-card::before {
      content: '';
      position: absolute;
      top: -80px;
      right: -80px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
      animation: hpFloat 5s ease-in-out infinite;
    }
    
    .balance-bg {
      display: none;
    }
    
    .balance-content {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    
    .balance-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255,255,255,0.9);
      margin-bottom: 8px;
    }
    
    .balance-amount {
      font-size: 38px;
      font-weight: 800;
      color: white;
      margin-bottom: 20px;
      text-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    .balance-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .balance-btn, .balance-btn-outline {
      padding: 12px 24px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      border: none;
    }
    
    .balance-btn {
      background: white;
      color: #6366f1;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    .balance-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.25);
    }
    
    .balance-btn-outline {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 2px solid rgba(255,255,255,0.3);
    }
    
    .balance-btn-outline:hover {
      background: rgba(255,255,255,0.3);
    }
    
    /* Stats Row */
    .stats-row {
      display: flex;
      justify-content: space-around;
      background: white;
      border-radius: 20px;
      padding: 20px 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      animation: hpFadeInUp 0.5s ease 0.2s forwards;
      opacity: 0;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    
    .stat-value.stat-alert {
      color: #ef4444;
      animation: hpPulse 2s ease-in-out infinite;
    }
    
    .stat-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    
    .stat-divider {
      width: 1px;
      background: #e2e8f0;
    }
    
    /* Section Title */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: hpFadeInUp 0.5s ease 0.3s forwards;
      opacity: 0;
    }
    
    /* Quick Actions - Cards mejorados */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .quick-action-card {
      background: white;
      border-radius: 18px;
      padding: 18px 8px;
      text-align: center;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      animation: hpFadeInUp 0.5s ease forwards;
      opacity: 0;
    }
    
    .quick-action-card:nth-child(1) { animation-delay: 0.35s; }
    .quick-action-card:nth-child(2) { animation-delay: 0.4s; }
    .quick-action-card:nth-child(3) { animation-delay: 0.45s; }
    .quick-action-card:nth-child(4) { animation-delay: 0.5s; }
    
    .quick-action-card:hover {
      transform: translateY(-5px);
      border-color: #6366f1;
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.15);
    }
    
    .quick-action-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
      font-size: 22px;
    }
    
    .quick-action-label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    
    /* Expiring List */
    .expiring-list {
      margin-bottom: 20px;
    }
    
    .expiring-item {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border-left: 4px solid #6366f1;
      animation: hpFadeInUp 0.5s ease forwards;
      opacity: 0;
    }
    
    .expiring-item:hover {
      background: #f8fafc;
      transform: translateX(4px);
    }
    
    .expiring-logo {
      flex-shrink: 0;
    }
    
    .expiring-info {
      flex: 1;
      min-width: 0;
    }
    
    .expiring-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    
    .expiring-date {
      font-size: 12px;
      color: #64748b;
    }
    
    .expiring-badge {
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    
    .expiring-badge.ok { background: rgba(16,185,129,0.1); color: #059669; }
    .expiring-badge.warning { background: rgba(245,158,11,0.1); color: #d97706; }
    .expiring-badge.critical, .expiring-badge.expired { background: rgba(239,68,68,0.1); color: #dc2626; }
    
    /* Purchases List */
    .purchases-list {
      margin-bottom: 20px;
    }
    
    .purchase-item {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      animation: hpFadeInUp 0.5s ease forwards;
      opacity: 0;
    }
    
    .purchase-item:hover {
      background: #f8fafc;
      transform: translateX(4px);
    }
    
    .purchase-logo { flex-shrink: 0; }
    
    .purchase-info {
      flex: 1;
      min-width: 0;
    }
    
    .purchase-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    
    .purchase-date {
      font-size: 12px;
      color: #64748b;
    }
    
    .purchase-price {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    
    /* Carousel */
    .carousel {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      color: white;
      position: relative;
      overflow: hidden;
      animation: hpFadeInUp 0.5s ease forwards;
      opacity: 0;
    }
    
    .carousel::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
      animation: hpFloat 6s ease-in-out infinite;
    }
    
    .slide-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    
    .slide-content h3 {
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 8px;
    }
    
    .slide-content p {
      font-size: 13px;
      opacity: 0.9;
      margin: 0;
      line-height: 1.5;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .balance-amount {
        font-size: 32px;
      }
      
      .greeting-name {
        font-size: 22px;
      }
    }
    `;
    
    const style = document.createElement('style');
    style.id = 'home-premium-styles';
    style.textContent = css;
    document.head.appendChild(style);
    
    // Agregar clases a los elementos existentes después de que cargue
    setTimeout(() => this.enhanceExistingElements(), 500);
  },
  
  enhanceExistingElements() {
    // Mejorar elementos existentes con clases premium
    const greeting = document.querySelector('.home-greeting');
    if (greeting) {
      // Agregar la onda al emoji
      const emoji = greeting.querySelector('.greeting-name');
      if (emoji && emoji.textContent.includes('👋')) {
        emoji.innerHTML = emoji.innerHTML.replace('👋', '<span class="hp-wave">👋</span>');
      }
    }
    
    const quickActions = document.querySelector('[onclick*="setView(\'store\')"]')?.parentElement?.parentElement;
    if (quickActions) {
      quickActions.classList.add('quick-actions-grid');
    }
  }
};

// Inicializar cuando cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HomePremium.init());
} else {
  HomePremium.init();
}

console.log('✅ Inicio Premium v1 - Estilos mejorados');

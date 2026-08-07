/**
 * NAVEGACIÓN PREMIUM ULTRA v2 - Efectos Spectaculares
 */

const NavPremium = {
  init() {
    this.injectStyles();
    this.enhanceNav();
  },
  
  injectStyles() {
    const css = `
    /* ═══════════════════════════════════════════════════════════════════
       NAVEGACIÓN PREMIUM ULTRA - EFECTOS ESPECIALES
       ═══════════════════════════════════════════════════════════════════ */
    
    /* Efecto de carga previa */
    @keyframes navSlideUp {
      0% { opacity: 0; transform: translateY(100%) scale(0.8); }
      60% { transform: translateY(-5%) scale(1.02); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @keyframes navPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    
    @keyframes navGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3); }
      50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8), 0 0 60px rgba(99, 102, 241, 0.5); }
    }
    
    @keyframes navShimmer {
      0% { left: -100%; }
      100% { left: 200%; }
    }
    
    @keyframes badgePop {
      0% { transform: scale(0) rotate(-180deg); }
      60% { transform: scale(1.3) rotate(10deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    
    @keyframes badgeBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    
    @keyframes ripple {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: scale(4); opacity: 0; }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }
    
    @keyframes iconBounce {
      0%, 100% { transform: translateY(0) scale(1); }
      25% { transform: translateY(-3px) scale(1.1); }
      50% { transform: translateY(0) scale(1); }
      75% { transform: translateY(-1px) scale(1.05); }
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes borderRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Navegación Móvil Premium */
    .nav-premium-mobile {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 9999 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: flex-end !important;
      padding: 10px 6px !important;
      padding-bottom: max(16px, env(safe-area-inset-bottom)) !important;
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,1) 100%) !important;
      backdrop-filter: blur(25px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
      border-top: 1px solid rgba(99, 102, 241, 0.1) !important;
      animation: navSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
    }
    
    /* Barra superior decorativa */
    .nav-premium-mobile::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 60px !important;
      height: 4px !important;
      background: linear-gradient(90deg, transparent, #6366f1, #8b5cf6, #6366f1, transparent) !important;
      border-radius: 0 0 4px 4px !important;
      opacity: 0.6 !important;
    }
    
    /* Botón Individual Premium */
    .nav-premium-btn {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      padding: 10px 14px !important;
      border: none !important;
      background: transparent !important;
      border-radius: 20px !important;
      cursor: pointer !important;
      min-width: 68px !important;
      min-height: 60px !important;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
      overflow: hidden !important;
    }
    
    /* Efecto de brillo superior */
    .nav-premium-btn::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: -100% !important;
      width: 60% !important;
      height: 100% !important;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent) !important;
      transition: left 0.5s ease !important;
      pointer-events: none !important;
    }
    
    .nav-premium-btn:hover::before {
      left: 150% !important;
    }
    
    /* Efecto ripple al hacer clic */
    .nav-premium-btn::after {
      content: '' !important;
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      width: 10px !important;
      height: 10px !important;
      background: rgba(99, 102, 241, 0.3) !important;
      border-radius: 50% !important;
      transform: translate(-50%, -50%) scale(0) !important;
      pointer-events: none !important;
      transition: transform 0.6s ease-out, opacity 0.6s ease-out !important;
      opacity: 0 !important;
    }
    
    .nav-premium-btn:active::after {
      transform: translate(-50%, -50%) scale(15) !important;
      opacity: 1 !important;
      transition: transform 0s, opacity 0.4s ease-out !important;
    }
    
    /* Hover State */
    .nav-premium-btn:hover {
      background: rgba(99, 102, 241, 0.08) !important;
      transform: translateY(-4px) scale(1.05) !important;
    }
    
    /* Icono SVG */
    .nav-premium-btn svg {
      width: 26px !important;
      height: 26px !important;
      color: #9ca3af !important;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)) !important;
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* Texto */
    .nav-premium-btn span {
      font-size: 10px !important;
      font-weight: 600 !important;
      color: #9ca3af !important;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      z-index: 1 !important;
      letter-spacing: 0.3px !important;
    }
    
    /* Indicador de punto activo */
    .nav-premium-btn .nav-dot {
      position: absolute !important;
      top: 6px !important;
      right: 10px !important;
      width: 8px !important;
      height: 8px !important;
      background: #ef4444 !important;
      border-radius: 50% !important;
      border: 2px solid white !important;
      opacity: 0 !important;
      transform: scale(0) !important;
      transition: all 0.3s ease !important;
      z-index: 2 !important;
    }
    
    /* Estado ACTIVO */
    .nav-premium-btn.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%) !important;
      background-size: 200% 200% !important;
      animation: gradientShift 3s ease infinite !important;
      box-shadow: 
        0 8px 30px rgba(99, 102, 241, 0.5),
        0 0 0 2px rgba(99, 102, 241, 0.2),
        inset 0 1px 0 rgba(255,255,255,0.3) !important;
      transform: translateY(-6px) scale(1.1) !important;
      border-radius: 24px 24px 18px 18px !important;
    }
    
    /* Efecto glow para activo */
    .nav-premium-btn.active::before {
      display: none !important;
    }
    
    .nav-premium-btn.active svg {
      color: white !important;
      transform: scale(1.2) rotate(5deg) !important;
      filter: drop-shadow(0 0 8px rgba(255,255,255,0.5)) !important;
      animation: iconBounce 0.6s ease-out !important;
    }
    
    .nav-premium-btn.active span {
      color: white !important;
      font-weight: 700 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
      transform: scale(1.1) !important;
    }
    
    /* Efecto de resplandor exterior para activo */
    .nav-premium-btn.active::after {
      display: none !important;
    }
    
    /* Borde brillante para activo */
    .nav-premium-btn.active::before {
      display: none !important;
    }
    
    /* Badge de notificación */
    .nav-badge-ultra {
      position: absolute !important;
      top: 2px !important;
      right: 6px !important;
      min-width: 18px !important;
      height: 18px !important;
      padding: 0 5px !important;
      background: linear-gradient(135deg, #ef4444, #dc2626) !important;
      color: white !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      border-radius: 9px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 2px solid white !important;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4) !important;
      animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, badgeBounce 2s ease-in-out 0.4s infinite !important;
      z-index: 3 !important;
    }
    
    /* Indicador inferior para activo */
    .nav-indicator {
      position: absolute !important;
      bottom: 2px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 6px !important;
      height: 6px !important;
      background: white !important;
      border-radius: 50% !important;
      box-shadow: 0 0 8px rgba(255,255,255,0.8) !important;
      opacity: 0 !important;
      transition: all 0.3s ease !important;
    }
    
    .nav-premium-btn.active .nav-indicator {
      opacity: 1 !important;
      animation: float 2s ease-in-out infinite !important;
    }
    
    /* Tooltip */
    .nav-tooltip {
      position: absolute !important;
      bottom: 100% !important;
      left: 50% !important;
      transform: translateX(-50%) translateY(-10px) scale(0.8) !important;
      background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
      color: white !important;
      padding: 8px 14px !important;
      border-radius: 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
      z-index: 100 !important;
    }
    
    .nav-tooltip::after {
      content: '' !important;
      position: absolute !important;
      bottom: -6px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      border: 6px solid transparent !important;
      border-top-color: #312e81 !important;
    }
    
    .nav-premium-btn:hover .nav-tooltip {
      opacity: 1 !important;
      transform: translateX(-50%) translateY(-12px) scale(1) !important;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       SIDEBAR PREMIUM (ESCRITORIO)
       ═══════════════════════════════════════════════════════════════════ */
    
    .nav-premium-sidebar {
      background: linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    /* Partículas decorativas */
    .nav-premium-sidebar::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: 
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%) !important;
      pointer-events: none !important;
    }
    
    .nav-premium-sidebar .side-brand {
      background: rgba(255,255,255,0.08) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 20px !important;
      padding: 20px !important;
      margin: 16px !important;
      position: relative !important;
      overflow: hidden !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
    }
    
    .nav-premium-sidebar .side-brand::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: -100% !important;
      width: 100% !important;
      height: 100% !important;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent) !important;
      animation: navShimmer 4s ease-in-out infinite !important;
    }
    
    .nav-premium-sidebar .nav button {
      margin: 4px 12px !important;
      padding: 14px 18px !important;
      border-radius: 16px !important;
      background: transparent !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      width: calc(100% - 24px) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    .nav-premium-sidebar .nav button::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 4px !important;
      height: 100% !important;
      background: linear-gradient(180deg, #6366f1, #8b5cf6) !important;
      border-radius: 0 4px 4px 0 !important;
      opacity: 0 !important;
      transform: scaleY(0) !important;
      transition: all 0.3s ease !important;
    }
    
    .nav-premium-sidebar .nav button:hover {
      background: rgba(255,255,255,0.08) !important;
      transform: translateX(6px) scale(1.02) !important;
    }
    
    .nav-premium-sidebar .nav button:hover::before {
      opacity: 0.5 !important;
      transform: scaleY(1) !important;
    }
    
    .nav-premium-sidebar .nav button.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3)) !important;
      border: 1px solid rgba(99, 102, 241, 0.4) !important;
    }
    
    .nav-premium-sidebar .nav button.active::before {
      opacity: 1 !important;
      transform: scaleY(1) !important;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5) !important;
    }
    
    .nav-premium-sidebar .nav button svg {
      color: rgba(255,255,255,0.7) !important;
      transition: all 0.3s ease !important;
      width: 24px !important;
      height: 24px !important;
    }
    
    .nav-premium-sidebar .nav button:hover svg,
    .nav-premium-sidebar .nav button.active svg {
      color: white !important;
      transform: scale(1.15) !important;
      filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)) !important;
    }
    
    .nav-premium-sidebar .nav button span {
      color: rgba(255,255,255,0.7) !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
    }
    
    .nav-premium-sidebar .nav button:hover span,
    .nav-premium-sidebar .nav button.active span {
      color: white !important;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════════ */
    
    @media (min-width: 1024px) {
      .nav-premium-mobile { display: none !important; }
      .mobile-nav { display: none !important; }
    }
    
    @media (max-width: 1023px) {
      .nav-premium-sidebar { display: none !important; }
      .side { display: none !important; }
    }
    
    /* Main content padding for nav */
    .main-content {
      padding-bottom: 95px !important;
    }
    
    @media (min-width: 1024px) {
      .main-content {
        padding-bottom: 0 !important;
      }
    }
    `;
    
    const style = document.createElement('style');
    style.id = 'nav-premium-ultra-css';
    style.textContent = css;
    document.head.appendChild(style);
  },
  
  enhanceNav() {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
      this.enhanceMobileNav();
      this.enhanceSidebarNav();
    }, 100);
  },
  
  enhanceMobileNav() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (!mobileNav) return;
    
    // Agregar clase premium
    mobileNav.classList.add('nav-premium-mobile');
    
    // Procesar cada botón
    const buttons = mobileNav.querySelectorAll('button');
    buttons.forEach((btn, index) => {
      btn.classList.add('nav-premium-btn');
      
      // Agregar delay de animación
      btn.style.animationDelay = `${index * 0.08}s`;
      
      // Agregar indicador
      if (!btn.querySelector('.nav-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        btn.appendChild(indicator);
      }
      
      // Agregar tooltip con el texto
      const text = btn.querySelector('span');
      if (text && !btn.querySelector('.nav-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.className = 'nav-tooltip';
        tooltip.textContent = text.textContent;
        btn.appendChild(tooltip);
      }
    });
  },
  
  enhanceSidebarNav() {
    const sidebar = document.querySelector('.side');
    if (!sidebar) return;
    
    sidebar.classList.add('nav-premium-sidebar');
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NavPremium.init());
} else {
  // Si ya está listo, esperar un poco para que todo cargue
  setTimeout(() => NavPremium.init(), 50);
}

// También ejecutar después de cada render
const originalRenderApp = window.renderApp;
if (originalRenderApp) {
  window.renderApp = function() {
    originalRenderApp.apply(this, arguments);
    setTimeout(() => NavPremium.enhanceNav(), 100);
  };
}

console.log('✅ Navegación Premium Ultra v2 - Efectos Spectaculares');

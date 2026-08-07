/**
 * NAVEGACIÓN PREMIUM - Solo estilos CSS (no rompe la página)
 */

const NavPremium = {
  init() {
    this.injectStyles();
    this.enhanceNav();
  },
  
  injectStyles() {
    const css = `
    /* ═══════════════════════════════════════════════════════════════════
       NAVEGACIÓN PREMIUM - ESTILOS MEJORADOS
       ═══════════════════════════════════════════════════════════════════ */
    
    @keyframes navSlideUp {
      0% { opacity: 0; transform: translateY(100%); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes navFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-2px); }
    }
    
    /* Navegación Móvil */
    .mobile-nav {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 9999 !important;
      display: flex !important;
      justify-content: space-around !important;
      padding: 8px 4px !important;
      padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border-top: 1px solid rgba(99, 102, 241, 0.1) !important;
      box-shadow: 0 -4px 20px rgba(99, 102, 241, 0.1) !important;
      animation: navSlideUp 0.5s ease forwards !important;
    }
    
    /* Barra decorativa superior */
    .mobile-nav::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 50px !important;
      height: 3px !important;
      background: linear-gradient(90deg, #6366f1, #8b5cf6) !important;
      border-radius: 0 0 3px 3px !important;
      opacity: 0.7 !important;
    }
    
    /* Botón */
    .mobile-nav button {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      padding: 8px 4px !important;
      border: none !important;
      background: transparent !important;
      border-radius: 14px !important;
      cursor: pointer !important;
      min-height: 52px !important;
      transition: all 0.3s ease !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    .mobile-nav button:active {
      transform: scale(0.95) !important;
    }
    
    .mobile-nav button:hover {
      background: rgba(99, 102, 241, 0.06) !important;
    }
    
    .mobile-nav button svg {
      width: 24px !important;
      height: 24px !important;
      transition: all 0.3s ease !important;
    }
    
    .mobile-nav button span {
      font-size: 10px !important;
      font-weight: 600 !important;
      color: #9ca3af !important;
      transition: all 0.3s ease !important;
    }
    
    /* Estado activo */
    .mobile-nav button.active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4) !important;
      transform: translateY(-2px) !important;
      border-radius: 16px 16px 12px 12px !important;
    }
    
    .mobile-nav button.active svg {
      color: white !important;
      transform: scale(1.1) !important;
    }
    
    .mobile-nav button.active span {
      color: white !important;
      font-weight: 700 !important;
    }
    
    /* Sidebar */
    .side {
      background: linear-gradient(180deg, #1e1b4b, #312e81) !important;
    }
    
    .side .nav button:hover {
      background: rgba(255,255,255,0.08) !important;
    }
    
    .side .nav button.active {
      background: rgba(99, 102, 241, 0.3) !important;
    }
    
    /* Responsive */
    @media (min-width: 1024px) {
      .mobile-nav { display: none !important; }
    }
    
    @media (max-width: 1023px) {
      .side { display: none !important; }
    }
    
    /* Padding para nav móvil */
    .main-content {
      padding-bottom: 90px !important;
    }
    `;
    
    const style = document.createElement('style');
    style.id = 'nav-premium-css';
    style.textContent = css;
    document.head.appendChild(style);
  },
  
  enhanceNav() {
    // Solo añadir clases sin modificar renderApp
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NavPremium.init());
} else {
  NavPremium.init();
}

console.log('✅ Navegación Premium - Estilos mejorados');

/**
 * NAVEGACIÓN PREMIUM v1 - Barra inferior mejorada
 */

const NavCSS = `
<style>
/* ═══════════════════════════════════════════════════════════════════
   NAVEGACIÓN PREMIUM - MÓVIL
   ═══════════════════════════════════════════════════════════════════ */

/* Contenedor principal de la navegación móvil */
.mobile-nav {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
  padding: 8px 4px !important;
  padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1) !important;
  border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* Botón de navegación individual */
.mobile-nav button {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  padding: 8px 12px !important;
  border: none !important;
  background: transparent !important;
  border-radius: 16px !important;
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  min-width: 60px !important;
  position: relative !important;
}

/* Icono SVG */
.mobile-nav button svg {
  width: 24px !important;
  height: 24px !important;
  transition: all 0.3s ease !important;
}

/* Texto debajo del icono */
.mobile-nav button span {
  font-size: 10px !important;
  font-weight: 600 !important;
  color: #9ca3af !important;
  transition: all 0.3s ease !important;
  white-space: nowrap !important;
}

/* Estado HOVER */
.mobile-nav button:hover {
  background: rgba(99, 102, 241, 0.08) !important;
  transform: translateY(-2px) !important;
}

/* Estado ACTIVO */
.mobile-nav button.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4) !important;
}

.mobile-nav button.active svg {
  color: white !important;
  transform: scale(1.1) !important;
}

.mobile-nav button.active span {
  color: white !important;
  font-weight: 700 !important;
}

/* Indicador de notificación (punto rojo) */
.mobile-nav .nav-badge {
  position: absolute !important;
  top: 4px !important;
  right: 8px !important;
  width: 8px !important;
  height: 8px !important;
  background: #ef4444 !important;
  border-radius: 50% !important;
  border: 2px solid white !important;
  animation: pulse-badge 2s ease-in-out infinite !important;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* ═══════════════════════════════════════════════════════════════════
   NAVEGACIÓN PREMIUM - ESCRITORIO (SIDEBAR)
   ═══════════════════════════════════════════════════════════════════ */

.side {
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%) !important;
  padding: 24px 16px !important;
  border-radius: 0 !important;
}

.side .side-brand {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 16px !important;
  margin-bottom: 24px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
}

.side .side-brand img {
  width: 40px !important;
  height: 40px !important;
  border-radius: 10px !important;
}

.side .side-brand div b {
  display: block !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  color: white !important;
}

.side .side-brand div em {
  font-size: 12px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  font-style: normal !important;
}

.side .nav-title {
  font-size: 10px !important;
  font-weight: 800 !important;
  color: rgba(255, 255, 255, 0.5) !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  padding: 0 16px !important;
  margin-bottom: 12px !important;
}

/* Navegación lateral */
.side .nav {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.side .nav button {
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
  padding: 14px 16px !important;
  border: none !important;
  background: transparent !important;
  border-radius: 14px !important;
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  text-align: left !important;
  width: 100% !important;
}

.side .nav button svg {
  width: 22px !important;
  height: 22px !important;
  color: rgba(255, 255, 255, 0.6) !important;
  flex-shrink: 0 !important;
  transition: all 0.3s ease !important;
}

.side .nav button span {
  font-size: 14px !important;
  font-weight: 600 !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
}

/* Hover en sidebar */
.side .nav button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.side .nav button:hover svg {
  color: white !important;
  transform: scale(1.1) !important;
}

.side .nav button:hover span {
  color: white !important;
}

/* Activo en sidebar */
.side .nav button.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4) !important;
}

.side .nav button.active svg {
  color: white !important;
  transform: scale(1.15) !important;
}

.side .nav button.active span {
  color: white !important;
  font-weight: 700 !important;
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMACIONES DE ENTRADA
   ═══════════════════════════════════════════════════════════════════ */

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-nav button {
  animation: slideUp 0.4s ease forwards !important;
}

.mobile-nav button:nth-child(1) { animation-delay: 0.05s; }
.mobile-nav button:nth-child(2) { animation-delay: 0.1s; }
.mobile-nav button:nth-child(3) { animation-delay: 0.15s; }
.mobile-nav button:nth-child(4) { animation-delay: 0.2s; }
.mobile-nav button:nth-child(5) { animation-delay: 0.25s; }
.mobile-nav button:nth-child(6) { animation-delay: 0.3s; }

/* ═══════════════════════════════════════════════════════════════════
   AJUSTES RESPONSIVE
   ═══════════════════════════════════════════════════════════════════ */

/* Agregar padding-bottom al main para que no quede oculto */
.main-content {
  padding-bottom: 90px !important;
}

/* Pantallas grandes: desktop */
@media (min-width: 1024px) {
  .mobile-nav {
    display: none !important;
  }
  
  .main-content {
    padding-bottom: 0 !important;
  }
}

/* Pantallas pequeñas: móvil */
@media (max-width: 768px) {
  .side {
    display: none !important;
  }
  
  .mobile-nav {
    display: flex !important;
  }
}
</style>`;

// Función para aplicar los estilos de navegación premium
function applyNavPremium() {
  // Insertar estilos CSS
  if (!document.getElementById('nav-premium-css')) {
    const style = document.createElement('style');
    style.id = 'nav-premium-css';
    style.textContent = NavCSS;
    document.head.appendChild(style);
  }
  
  // Agregar padding al contenido principal
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.paddingBottom = '90px';
  }
}

// Aplicar cuando se carga la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyNavPremium);
} else {
  applyNavPremium();
}

console.log('✅ Navegación Premium v1 - Barra inferior mejorada');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DISTRITO STREAMING - APLICACIÓN PRINCIPAL MODULAR
 * Arquitectura: Modular, escalable y mantenible
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const App = {
  // Estado global de la aplicación
  state: {
    initialized: false,
    currentUser: null,
    theme: 'light',
    notifications: []
  },

  // Inicialización
  async init() {
    console.log('🚀 Distrito Streaming - Inicializando...');
    
    // Cargar módulos
    this.loadModules();
    
    // Inicializar tema
    this.initTheme();
    
    // Configurar eventos globales
    this.setupGlobalEvents();
    
    this.state.initialized = true;
    console.log('✅ Distrito Streaming - Inicializado');
  },

  // Cargar módulos externos
  loadModules() {
    const modules = [
      'reports-functions.js',
      'reports-security.js',
      'reports-optimizations.js',
      'reports-monkey-patch.js',
      'support-operators-simple.js'
    ];

    modules.forEach(mod => {
      if (!document.querySelector(`script[src="${mod}"]`)) {
        console.warn(`⚠️ Módulo ${mod} no cargado`);
      }
    });
  },

  // Tema claro/oscuro
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  },

  setTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Actualizar botón si existe
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  // Eventos globales
  setupGlobalEvents() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K = Buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      
      // Escape = Cerrar modal
      if (e.key === 'Escape') {
        closeModal?.();
      }
    });

    // Online/Offline
    window.addEventListener('online', () => {
      this.showNotification('Conexión restaurada', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('Sin conexión', 'warning');
    });
  },

  // Notificaciones toast
  showNotification(message, type = 'info') {
    if (typeof toast === 'function') {
      toast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  },

  // Utilidades
  formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  },

  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Exportar para uso global
window.App = App;

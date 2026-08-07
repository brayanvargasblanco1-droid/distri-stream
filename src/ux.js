/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UX IMPROVEMENTS - MEJORAS DE EXPERIENCIA DE USUARIO
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const UX = {
  // ══════════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════════════════════════════════════════
  
  shortcuts: {
    'ctrl+k': () => document.getElementById('searchInput')?.focus(),
    'ctrl+n': () => window.location.href = window.location.pathname + '?new=1',
    'escape': () => closeModal?.(),
    '?': () => UX.showShortcuts()
  },

  initShortcuts() {
    document.addEventListener('keydown', (e) => {
      const key = [
        e.ctrlKey || e.metaKey ? 'ctrl' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      const handler = this.shortcuts[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  },

  showShortcuts() {
    const shortcutsList = Object.entries(this.shortcuts)
      .map(([key, fn]) => `<li><kbd>${key}</kbd> → acción</li>`)
      .join('');

    openModal?.(`
      <div style="padding:24px">
        <h2 style="margin:0 0 16px">⌨️ Atajos de teclado</h2>
        <ul style="list-style:none;padding:0;margin:0">
          ${shortcutsList}
        </ul>
      </div>
    `);
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  toasts: [],

  showToast(message, type = 'info', duration = 4000) {
    const id = Date.now();
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.id = `toast-${id}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 14px 20px;
      background: var(--panel, #fff);
      border: 1px solid ${colors[type]};
      border-left: 4px solid ${colors[type]};
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text, #333);
      animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;

    document.body.appendChild(toast);
    this.toasts.push(id);

    // Auto-remove
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => {
        toast.remove();
        this.toasts = this.toasts.filter(t => t !== id);
      }, 300);
    }, duration);
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // LOADING STATES
  // ══════════════════════════════════════════════════════════════════════════════

  loading: {
    show(element) {
      if (!element) return;
      element.dataset.originalContent = element.innerHTML;
      element.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px">
          <div style="width:20px;height:20px;border:2px solid var(--line,#ddd);border-top-color:var(--blue,#0877ff);border-radius:50%;animation:spin 1s linear infinite"></div>
          <span>Cargando...</span>
        </div>
      `;
      element.disabled = true;
    },

    hide(element) {
      if (!element || !element.dataset.originalContent) return;
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
      element.disabled = false;
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // SKELETON LOADERS
  // ══════════════════════════════════════════════════════════════════════════════

  skeleton: {
    card() {
      return `
        <div style="background:var(--panel,#fff);border:1px solid var(--line,#ddd);border-radius:12px;padding:16px">
          <div style="height:20px;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px;margin-bottom:12px"></div>
          <div style="height:14px;width:60%;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px"></div>
        </div>
      `;
    },

    list(count = 3) {
      return Array(count).fill(this.card()).join('');
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // FILTER PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════════════

  filters: {
    save(key, value) {
      try {
        localStorage.setItem(`filter_${key}`, JSON.stringify(value));
      } catch (e) {
        console.warn('No se pudo guardar filtro');
      }
    },

    load(key) {
      try {
        const saved = localStorage.getItem(`filter_${key}`);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    },

    clear(key) {
      localStorage.removeItem(`filter_${key}`);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // BACK TO TOP
  // ══════════════════════════════════════════════════════════════════════════════

  initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.innerHTML = '↑';
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: var(--blue, #0877ff);
      color: white;
      font-size: 20px;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);

    window.addEventListener('scroll', Utils.throttle(() => {
      btn.style.opacity = window.scrollY > 300 ? '1' : '0';
      btn.style.visibility = window.scrollY > 300 ? 'visible' : 'hidden';
    }, 100));
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // INYECTAR ESTILOS
  // ══════════════════════════════════════════════════════════════════════════════

  injectStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      kbd {
        background: var(--soft, #f0f0f0);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
      }
    `;
    document.head.appendChild(styles);
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // INICIALIZAR
  // ══════════════════════════════════════════════════════════════════════════════

  init() {
    this.injectStyles();
    this.initShortcuts();
    this.initBackToTop();
    console.log('✅ UX Improvements inicializado');
  }
};

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UX.init());
} else {
  UX.init();
}

// Exportar
window.UX = UX;

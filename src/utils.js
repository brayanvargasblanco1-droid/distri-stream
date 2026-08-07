/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UTILIDADES GLOBALES
 * Funciones helper reutilizables
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Utils = {
  // Escape HTML para prevenir XSS
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Generar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Copiar al portapapeles
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  // Tiempo relativo
  timeAgo(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: 'año', seconds: 31536000 },
      { label: 'mes', seconds: 2592000 },
      { label: 'día', seconds: 86400 },
      { label: 'hora', seconds: 3600 },
      { label: 'minuto', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `Hace ${count} ${interval.label}${count > 1 ? 's' : ''}`;
      }
    }

    return 'Hace un momento';
  },

  // Formatear dinero COP
  formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  },

  // Formatear fecha
  formatDate(dateStr, options = {}) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: options.short ? 'short' : 'long',
      year: 'numeric',
      ...options
    });
  },

  // Debounce
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Throttle
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Validar email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Validar teléfono
  isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone?.replace(/\D/g, ''));
  },

  // Obtener parámetros de URL
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  // Lazy load imágenes
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
  },

  // Storage con expiry
  storage: {
    set(key, value, expiryMinutes = 60) {
      const item = {
        value,
        expiry: Date.now() + (expiryMinutes * 60 * 1000)
      };
      localStorage.setItem(key, JSON.stringify(item));
    },

    get(key) {
      const item = localStorage.getItem(key);
      if (!item) return null;

      try {
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.value;
      } catch {
        return null;
      }
    },

    remove(key) {
      localStorage.removeItem(key);
    }
  }
};

// Exportar
window.Utils = Utils;

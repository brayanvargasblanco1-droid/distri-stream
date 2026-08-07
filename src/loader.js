/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LAZY LOADER - CARGA DINÁMICA DE MÓDULOS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const LazyLoader = {
  // Módulos cargados
  loaded: new Set(),
  
  // Cola de módulos pendientes
  queue: [],

  // Cargar script dinámicamente
  async loadScript(src) {
    if (this.loaded.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        this.loaded.add(src);
        console.log(`✅ Módulo cargado: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`❌ Error cargando: ${src}`);
        reject(new Error(`No se pudo cargar ${src}`));
      };

      document.body.appendChild(script);
    });
  },

  // Cargar múltiples scripts
  async loadAll(scripts) {
    const results = await Promise.allSettled(
      scripts.map(src => this.loadScript(src))
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} módulos no se cargaron`);
    }
    
    return results;
  },

  // Lazy load: cargar solo cuando se necesita
  lazyLoad(moduleName) {
    const modules = {
      'reports': ['reports-functions.js', 'reports-security.js'],
      'support': ['support-operators-simple.js'],
      'admin': ['reports-monkey-patch.js']
    };

    const toLoad = modules[moduleName] || [];
    return this.loadAll(toLoad);
  },

  // Precargar módulos críticos
  preloadCritical() {
    // Módulos que se cargan al inicio
    const critical = [
      'reports-functions.js',
      'reports-security.js'
    ];

    // Usar requestIdleCallback para no bloquear
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadAll(critical));
    } else {
      setTimeout(() => this.loadAll(critical), 1);
    }
  }
};

// Auto-precargar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LazyLoader.preloadCritical());
} else {
  LazyLoader.preloadCritical();
}

// Exportar
window.LazyLoader = LazyLoader;

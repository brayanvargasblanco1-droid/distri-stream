/* ══════════════════════════════════════════════════════════════════════════════
   OPTIMIZACIONES DE RENDIMIENTO PARA REPORTES v2.0
   ✓ Cacheo de estadísticas
   ✓ Memoización de funciones
   ✓ Debounce optimizado
   ✓ Índices de búsqueda
   ══════════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════════
  //  CACHE DE ESTADÍSTICAS
  // ══════════════════════════════════════════════════════════════════════════════
  const ReportStatsCache = {
    _cache: new Map(),
    _lastUpdate: 0,
    _cacheDuration: 5000, // 5 segundos
    
    getKey(reports) {
      if (!reports) return 'empty';
      return reports.map(r => r.id + r.status + (r.updated_at || '')).join('|');
    },
    
    get(reports) {
      const key = this.getKey(reports);
      const now = Date.now();
      
      if (this._cache.has(key) && (now - this._lastUpdate) < this._cacheDuration) {
        return this._cache.get(key);
      }
      
      const stats = this.calculateStats(reports);
      this._cache.set(key, stats);
      this._lastUpdate = now;
      return stats;
    },
    
    calculateStats(reports) {
      const my = reports || [];
      return {
        total: my.length,
        active: my.filter(r => r.status !== "Resuelto" && r.status !== "Rechazado").length,
        resolved: my.filter(r => r.status === "Resuelto").length,
        rejected: my.filter(r => r.status === "Rechazado").length,
        byStatus: {
          'Abierto': my.filter(r => r.status === 'Abierto').length,
          'En revisión': my.filter(r => r.status === 'En revisión').length,
          'En proceso': my.filter(r => r.status === 'En proceso').length,
          'Resuelto': my.filter(r => r.status === 'Resuelto').length,
          'Rechazado': my.filter(r => r.status === 'Rechazado').length
        },
        byCategory: this.groupByCategory(my),
        avgResponseTime: this.calculateAvgResponseTime(my)
      };
    },
    
    groupByCategory(reports) {
      const groups = {};
      reports.forEach(r => {
        const cat = r.category || 'otro';
        groups[cat] = (groups[cat] || 0) + 1;
      });
      return groups;
    },
    
    calculateAvgResponseTime(reports) {
      const resolved = reports.filter(r => r.resolved_at && r.created_at);
      if (resolved.length === 0) return null;
      
      let totalMs = 0;
      resolved.forEach(r => {
        totalMs += new Date(r.resolved_at) - new Date(r.created_at);
      });
      
      const avgHours = Math.round(totalMs / resolved.length / (1000 * 60 * 60));
      return avgHours;
    },
    
    invalidate() {
      this._cache.clear();
      this._lastUpdate = 0;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  ÍNDICE DE BÚSQUEDA OPTIMIZADO
  // ══════════════════════════════════════════════════════════════════════════════
  const ReportSearchIndex = {
    _index: new Map(),
    _lastUpdate: 0,
    _cacheDuration: 3000, // 3 segundos
    
    buildIndex(reports) {
      const now = Date.now();
      if ((now - this._lastUpdate) < this._cacheDuration && this._index.size > 0) {
        return this._index;
      }
      
      this._index.clear();
      (reports || []).forEach(report => {
        const searchText = [
          report.id || '',
          report.code || '',
          report.reason || '',
          report.description || '',
          report.product_name || '',
          report.client_name || ''
        ].join(' ').toLowerCase();
        
        this._index.set(report.id, searchText);
      });
      
      this._lastUpdate = now;
      return this._index;
    },
    
    search(reports, query) {
      if (!query || query.trim() === '') {
        return reports || [];
      }
      
      this.buildIndex(reports);
      const q = query.toLowerCase().trim();
      
      return (reports || []).filter(report => {
        const indexText = this._index.get(report.id) || '';
        
        // Búsqueda exacta primero
        if (indexText.includes(q)) return true;
        
        // Búsqueda por palabras clave
        const queryWords = q.split(/\s+/);
        return queryWords.some(word => indexText.includes(word));
      });
    },
    
    invalidate() {
      this._index.clear();
      this._lastUpdate = 0;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  DEBOUNCE MEJORADO CON CANCELACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
  function createDebouncer(fn, wait = 300) {
    let timeoutId = null;
    let lastArgs = null;
    let lastCallTime = null;
    
    const debounced = function(...args) {
      lastArgs = args;
      lastCallTime = Date.now();
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastArgs && lastCallTime === Date.now() - wait) {
          fn.apply(this, lastArgs);
        }
        timeoutId = null;
        lastArgs = null;
      }, wait);
      
      return debounced;
    };
    
    debounced.cancel = function() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        lastArgs = null;
      }
    };
    
    debounced.flush = function() {
      if (timeoutId && lastArgs) {
        clearTimeout(timeoutId);
        fn.apply(this, lastArgs);
        timeoutId = null;
        lastArgs = null;
      }
    };
    
    return debounced;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  BÚSQUEDA OPTIMIZADA
  // ══════════════════════════════════════════════════════════════════════════════
  function searchReportsOptimized(reports, query, filters = {}) {
    let results = reports || [];
    
    // 1. Aplicar filtros de estado
    if (filters.status && filters.status !== 'Todos') {
      results = results.filter(r => r.status === filters.status);
    }
    
    // 2. Aplicar filtros de categoría
    if (filters.category && filters.category !== 'Todos') {
      results = results.filter(r => r.category === filters.category);
    }
    
    // 3. Aplicar búsqueda por texto usando índice
    if (query && query.trim()) {
      results = ReportSearchIndex.search(results, query);
    }
    
    // 4. Ordenar por fecha (más recientes primero)
    results.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
    
    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  PAGINACIÓN OPTIMIZADA
  // ══════════════════════════════════════════════════════════════════════════════
  function paginateOptimized(items, page = 1, pageSize = 20) {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      items: items.slice(start, end),
      pagination: {
        currentPage: safePage,
        totalPages: totalPages,
        pageSize: pageSize,
        total: total,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  EXPORTACIÓN OPTIMIZADA
  // ══════════════════════════════════════════════════════════════════════════════
  function exportReportsOptimized(reports, options = {}) {
    const {
      includeAttachments = false,
      includeMessages = false,
      format = 'csv'
    } = options;
    
    const headers = ['Código', 'Fecha', 'Producto', 'Categoría', 'Motivo', 'Estado'];
    if (includeAttachments) headers.push('Adjuntos');
    if (includeMessages) headers.push('Mensajes');
    headers.push('Tiempo Respuesta');
    
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const escaped = String(str).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
        ? `"${escaped}"` 
        : escaped;
    };
    
    const rows = reports.map(r => {
      const row = [
        escapeCsv(r.code || r.id),
        escapeCsv(r.created_at ? new Date(r.created_at).toLocaleString() : ''),
        escapeCsv(r.product_name),
        escapeCsv(r.category),
        escapeCsv(r.reason),
        escapeCsv(r.status)
      ];
      
      if (includeAttachments) {
        row.push(escapeCsv(r.attachments?.length || 0));
      }
      if (includeMessages) {
        row.push(escapeCsv(r.messages?.length || 0));
      }
      
      const responseTime = r.resolved_at && r.created_at
        ? Math.round((new Date(r.resolved_at) - new Date(r.created_at)) / (1000 * 60 * 60)) + 'h'
        : 'N/A';
      row.push(escapeCsv(responseTime));
      
      return row.join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  DETECCIÓN DE DUPLICADOS
  // ══════════════════════════════════════════════════════════════════════════════
  function checkDuplicateReport(reports, orderId, reason, timeWindowHours = 24) {
    if (!reports || !orderId) return null;
    
    const now = Date.now();
    const windowMs = timeWindowHours * 60 * 60 * 1000;
    
    return reports.find(r => {
      if (r.order_id !== orderId) return false;
      if (r.status === 'Resuelto' || r.status === 'Rechazado') return false;
      
      const createdAt = new Date(r.created_at).getTime();
      return (now - createdAt) < windowMs;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
  function initReportOptimizations() {
    // Invalidar caches cuando cambian los reportes
    const originalBoot = window.boot;
    if (typeof originalBoot === 'function') {
      window.boot = async function(...args) {
        const result = originalBoot.apply(this, args);
        ReportStatsCache.invalidate();
        ReportSearchIndex.invalidate();
        return result;
      };
    }
    
    // Invalidar caches cuando cambian reportes en state
    Object.defineProperty(window, 'state', {
      set: function(value) {
        this._state = value;
        ReportStatsCache.invalidate();
        ReportSearchIndex.invalidate();
      },
      get: function() {
        return this._state;
      }
    });
    
    console.log('✅ Optimizaciones de reportes inicializadas');
    console.log('✅ Cache de estadísticas activo');
    console.log('✅ Índice de búsqueda activo');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  EXPORTAR FUNCIONES AL CONTEXTO GLOBAL
  // ══════════════════════════════════════════════════════════════════════════════
  window.ReportStatsCache = ReportStatsCache;
  window.ReportSearchIndex = ReportSearchIndex;
  window.createDebouncer = createDebouncer;
  window.searchReportsOptimized = searchReportsOptimized;
  window.paginateOptimized = paginateOptimized;
  window.exportReportsOptimized = exportReportsOptimized;
  window.checkDuplicateReport = checkDuplicateReport;
  window.initReportOptimizations = initReportOptimizations;

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportOptimizations);
  } else {
    initReportOptimizations();
  }

})();

/* ══════════════════════════════════════════════════════════════════════════════
   BOOTSTRAP DE ESTILOS Y FUNCIONES MEJORADAS PARA REPORTES
   Este script se auto-ejecuta para inyectar estilos CSS y funciones
   ══════════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Inyectar CSS automáticamente si no existe
  function injectReportsStyles() {
    // Verificar si ya está cargado
    if (document.querySelector('link[href="reports-styles.css"]')) {
      return;
    }

    // Crear el link del CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'reports-styles.css';
    document.head.appendChild(link);
    
    console.log('✅ Estilos de reportes inyectados');
  }

  // Función para cargar scripts adicionales
  function injectReportsFunctions() {
    if (window.getReportCategory) {
      return; // Ya está cargado
    }

    // Crear el script
    const script = document.createElement('script');
    script.src = 'reports-functions.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = function() {
      console.log('✅ Funciones de reportes inyectadas');
    };
  }

  // Ejecutar al cargar el documento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectReportsStyles();
      injectReportsFunctions();
    });
  } else {
    // Ya cargado
    injectReportsStyles();
    injectReportsFunctions();
  }

  // Exponer funciones globales para compatibilidad
  window.reportsFunctionsReady = true;
})();

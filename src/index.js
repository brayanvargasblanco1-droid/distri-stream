/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SRC MODULES INDEX
 * Punto de entrada para módulos JavaScript
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Cargar módulos en orden
const modules = [
  'src/utils.js',
  'src/app.js',
  'src/components.js',
  'src/loader.js',
  'src/ux.js'
];

// Cargar dinámicamente
async function loadModules() {
  console.log('📦 Cargando módulos...');
  
  for (const src of modules) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          console.warn(`⚠️ No se pudo cargar ${src}`);
          resolve(); // No fallar por un módulo opcional
        };
        document.body.appendChild(script);
      });
    } catch (e) {
      console.warn(`⚠️ Error cargando ${src}:`, e);
    }
  }

  console.log('✅ Módulos cargados');
  console.log('   - Utils:', typeof Utils !== 'undefined' ? '✅' : '❌');
  console.log('   - App:', typeof App !== 'undefined' ? '✅' : '❌');
  console.log('   - Components:', typeof Components !== 'undefined' ? '✅' : '❌');
  console.log('   - UX:', typeof UX !== 'undefined' ? '✅' : '❌');
}

// Exportar para uso manual
window.loadModules = loadModules;

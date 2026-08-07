/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESTS - UTILIDADES
 * Pruebas unitarias para Utils
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Test suite para Utils
const UtilsTests = {
  name: 'Utils',
  
  tests: [
    {
      name: 'escapeHTML - debe escapar HTML peligroso',
      run: () => {
        const input = '<script>alert("xss")</script>';
        const result = Utils.escapeHTML(input);
        return !result.includes('<script>') && result.includes('&lt;script&gt;');
      }
    },
    {
      name: 'escapeHTML - debe manejar null/undefined',
      run: () => {
        return Utils.escapeHTML(null) === '' && Utils.escapeHTML(undefined) === '';
      }
    },
    {
      name: 'generateId - debe generar IDs únicos',
      run: () => {
        const id1 = Utils.generateId();
        const id2 = Utils.generateId();
        return id1 !== id2 && id1.length > 10;
      }
    },
    {
      name: 'isValidEmail - debe validar emails correctos',
      run: () => {
        return Utils.isValidEmail('test@example.com') === true;
      }
    },
    {
      name: 'isValidEmail - debe rechazar emails incorrectos',
      run: () => {
        return Utils.isValidEmail('not-an-email') === false;
      }
    },
    {
      name: 'isValidPhone - debe validar números de 10 dígitos',
      run: () => {
        return Utils.isValidPhone('3101234567') === true;
      }
    },
    {
      name: 'timeAgo - debe mostrar "Hace un momento" para fechas recientes',
      run: () => {
        const now = new Date();
        const result = Utils.timeAgo(now.toISOString());
        return result.includes('momento');
      }
    },
    {
      name: 'formatMoney - debe formatear en COP',
      run: () => {
        const result = Utils.formatMoney(100000);
        return result.includes('100') && result.includes('COP');
      }
    },
    {
      name: 'debounce - debe retrasar la ejecución',
      run: () => {
        let count = 0;
        const fn = Utils.debounce(() => count++, 100);
        fn();
        fn();
        fn();
        const result = count === 0;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(result && count === 1);
          }, 150);
        });
      }
    }
  ],

  async runAll() {
    console.log('🧪 Ejecutando tests de Utils...');
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        const result = await test.run();
        if (result) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}`);
          failed++;
        }
      } catch (e) {
        console.log(`  ❌ ${test.name}: ${e.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Resultados: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }
};

// Ejecutar tests
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Solo ejecutar si hay parámetro ?test en URL
    if (new URLSearchParams(window.location.search).get('test') !== null) {
      UtilsTests.runAll();
    }
  });
}

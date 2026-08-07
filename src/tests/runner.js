/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEST RUNNER
 * Ejecutor de tests para desarrollo
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const TestRunner = {
  results: [],

  async run(testName, testFn) {
    const start = performance.now();
    try {
      const result = await testFn();
      const duration = (performance.now() - start).toFixed(2);
      this.results.push({
        name: testName,
        passed: result === true,
        duration,
        error: null
      });
      return result;
    } catch (e) {
      const duration = (performance.now() - start).toFixed(2);
      this.results.push({
        name: testName,
        passed: false,
        duration,
        error: e.message
      });
      return false;
    }
  },

  async runAll(testSuites) {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║           DISTRITO STREAMING - TEST SUITE          ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    this.results = [];
    const startTotal = performance.now();

    for (const suite of testSuites) {
      console.log(`\n📁 ${suite.name}`);
      console.log('─'.repeat(50));
      
      for (const test of suite.tests) {
        const result = await this.run(test.name, test.run);
        const icon = result ? '✅' : '❌';
        const status = result ? 'PASS' : 'FAIL';
        console.log(`  ${icon} [${status}] ${test.name}`);
      }
    }

    const totalDuration = (performance.now() - startTotal).toFixed(2);
    this.printSummary(totalDuration);
  },

  printSummary(totalDuration) {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN                         ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Pasados: ${passed}/${total}                                    ║`);
    console.log(`║  ❌ Fallidos: ${failed}/${total}                                    ║`);
    console.log(`║  ⏱️  Tiempo: ${totalDuration}ms                                 ║`);
    console.log('╚══════════════════════════════════════════════════════╝');

    if (failed > 0) {
      console.log('\n❌ Tests fallidos:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error || 'Error desconocido'}`);
      });
    }

    return { passed, failed, total };
  }
};

// Test rápido inline
async function runQuickTest() {
  if (typeof Utils === 'undefined') {
    console.error('❌ Utils no está definido');
    return;
  }

  const suite = {
    name: 'Utils (Quick)',
    tests: [
      { name: 'escapeHTML básico', run: () => Utils.escapeHTML('<b>test</b>') !== '<b>test</b>' },
      { name: 'generateId único', run: () => Utils.generateId() !== Utils.generateId() },
      { name: 'isValidEmail correcto', run: () => Utils.isValidEmail('test@test.com') === true },
      { name: 'isValidEmail incorrecto', run: () => Utils.isValidEmail('not-email') === false },
      { name: 'formatMoney', run: () => Utils.formatMoney(50000).includes('50') },
      { name: 'timeAgo', run: () => Utils.timeAgo(new Date().toISOString()).includes('momento') }
    ]
  };

  await TestRunner.runAll([suite]);
}

// Exportar
window.TestRunner = TestRunner;
window.runQuickTest = runQuickTest;

/**
 * TEST - CONSISTENCIA DE CONSTANTES DE ESTADO
 * Garantiza que no vuelvan a aparecer definiciones divergentes de los estados
 * de reportes. Ejecutar: node src/tests/status-consistency.test.js
 *
 * Jerarquía esperada:
 *   ReportsService.STATUS            (reports-service.js)  ← FUENTE CANÓNICA
 *   ReportValidator.STATES           (reports-security.js)  = alias (misma referencia)
 *   ReportStates                     (reports-functions.js) = alias (misma referencia)
 *
 * Los tres archivos se cargan como scripts clásicos secuenciales en UN mismo
 * contexto vm — simulación fiel de cómo los carga index.html en el navegador
 * (los const top-level de scripts clásicos comparten el scope léxico global).
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..', '..');

// ── Sandbox con shims mínimos de browser ──
const sandbox = {};
sandbox.window = sandbox;          // los módulos se cuelgan de window
sandbox.self = sandbox;
sandbox.console = console;
sandbox.document = {
  createElement: () => ({
    set innerHTML(_v) {}, get innerHTML() { return ''; },
    appendChild() {}, style: {}, content: { appendChild() {} },
    querySelector() { return null; }
  }),
  addEventListener() {}, querySelector() { return null; },
  body: { appendChild() {} }
};
sandbox.localStorage = {
  _s: {}, getItem(k) { return this._s[k] ?? null; },
  setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; }
};
sandbox.fetch = () => Promise.reject(new Error('fetch bloqueado en test'));
sandbox.setTimeout, sandbox.clearTimeout; // vm context ya provee timers vía base objects? no: asignar
sandbox.setTimeout = setTimeout;
sandbox.clearTimeout = clearTimeout;
sandbox.setInterval = setInterval;
sandbox.clearInterval = clearInterval;
vm.createContext(sandbox);

// Cargar en el MISMO orden que index.html
for (const f of ['reports-service.js', 'reports-security.js', 'reports-functions.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
}

// Sonda: leer los bindings léxicos globales del contexto (como otro <script>)
const probe = vm.runInContext(`({
  canon: typeof ReportsService !== 'undefined' ? ReportsService.STATUS : null,
  validatorStates: typeof ReportValidator !== 'undefined' ? ReportValidator.STATES : null,
  reportStates: typeof ReportStates !== 'undefined' ? ReportStates : null,
  resolvedStates: typeof RESOLVED_STATES !== 'undefined' ? RESOLVED_STATES : null,
  activeStates: typeof ACTIVE_STATES !== 'undefined' ? ACTIVE_STATES : null,
  isTerminal: typeof ReportValidator !== 'undefined' ? ReportValidator.isTerminal : null,
  // Llamadas como MÉTODO (this === ReportValidator), como en el navegador
  isTerminalResolved: typeof ReportValidator !== 'undefined' ? ReportValidator.isTerminal('Resuelto') : null,
  isTerminalOpen: typeof ReportValidator !== 'undefined' ? ReportValidator.isTerminal('Abierto') : null,
  isResolvedCall: (typeof ReportValidator !== 'undefined' && typeof ReportValidator.isResolved === 'function') ? ReportValidator.isResolved('Resuelto') : null
})`, sandbox);

let passed = 0, failed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log('  PASS ' + msg); }
  else { failed++; console.log('  FAIL ' + msg); }
};

const EXPECTED = {
  OPEN: 'Abierto',
  REVIEWING: 'En revisión',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado'
};

console.log('\n== Fuente canónica (ReportsService.STATUS) ==');
assert(!!probe.canon, 'ReportsService.STATUS existe tras cargar los 3 scripts');
assert(JSON.stringify(probe.canon) === JSON.stringify(EXPECTED),
  'valores canónicos exactos (acento en "revisión"/"proceso" incluidos)');

console.log('\n== Alias: misma referencia, no copias ==');
assert(!!probe.validatorStates, 'ReportValidator.STATES existe');
assert(probe.validatorStates === probe.canon,
  'ReportValidator.STATES ES la misma referencia que ReportsService.STATUS');
assert(!!probe.reportStates, 'ReportStates existe');
assert(probe.reportStates === probe.canon,
  'ReportStates ES la misma referencia que ReportsService.STATUS');

console.log('\n== Derivados coherentes ==');
assert(Array.isArray(probe.resolvedStates) && probe.resolvedStates.length === 2 &&
  probe.resolvedStates.includes('Resuelto') && probe.resolvedStates.includes('Rechazado'),
  'RESOLVED_STATES = [Resuelto, Rechazado] derivado del canónico');
assert(Array.isArray(probe.activeStates) && probe.activeStates.length === 3,
  'ACTIVE_STATES tiene 3 estados activos derivados del canónico');
assert(typeof probe.isTerminal === 'function' &&
  probe.isTerminalResolved === true && probe.isTerminalOpen === false,
  'ReportValidator.isTerminal funciona contra el alias (llamado como método)');
assert(probe.isResolvedCall === true,
  'ReportValidator.isResolved (extensión de reports-functions) funciona');

console.log('\n=============================================');
console.log('RESULTADO: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
console.log('TODO OK');

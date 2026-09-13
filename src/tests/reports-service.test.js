/**
 * TESTS - REPORTS SERVICE (capa sin DOM)
 * Ejecutar: node src/tests/reports-service.test.js
 *
 * Verifica la logica extraida de index.html: validacion de payloads, regla de
 * negocio (1 reporte activo por orden), mutaciones via api() inyectada y
 * actualizacion optimista del array de reportes.
 */

// El modulo es un IIFE que se cuelga de globalThis (browser: window).
require('../../reports-service.js');
const { create } = globalThis.ReportsService;

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, name) {
  if (cond) { passed++; console.log('  PASS ' + name); }
  else { failed++; failures.push(name); console.log('  FAIL ' + name); }
}

function section(name) { console.log('\n== ' + name + ' =='); }

/** Servicio con mocks frescos: api graba llamadas, reports es getter, boot cuenta refrescos */
function makeService(opts = {}) {
  const calls = [];
  const reports = opts.reports || [];
  const api = async function (path, apiOpts) {
    calls.push({ path: path, method: apiOpts.method, body: JSON.parse(apiOpts.body) });
    if (apiOpts.method === 'POST') {
      return Object.assign({ id: 'r-new-' + calls.length, status: 'Abierto' }, JSON.parse(apiOpts.body));
    }
    if (apiOpts.method === 'PATCH') {
      return Object.assign({ id: JSON.parse(apiOpts.body).id }, JSON.parse(apiOpts.body));
    }
    return { id: 'r-x' };
  };
  let bootCalls = 0;
  const errors = [];
  const successes = [];
  const svc = create({
    api: api,
    reports: function () { return reports; },
    boot: async function () { bootCalls++; },
    onError: function (m) { errors.push(m); },
    onSuccess: function (m) { successes.push(m); }
  });
  return { svc: svc, calls: calls, reports: reports, errors: errors, successes: successes, bootCount: function () { return bootCalls; } };
}

// ── STATUS / isTerminalStatus ────────────────────────────────────────────────
section('STATUS / isTerminalStatus');
{
  const s = makeService();
  assert(s.svc.STATUS.RESOLVED === 'Resuelto' && s.svc.STATUS.REJECTED === 'Rechazado', 'constantes STATUS correctas');
  assert(s.svc.isTerminalStatus('Resuelto') === true, 'Resuelto es terminal');
  assert(s.svc.isTerminalStatus('Rechazado') === true, 'Rechazado es terminal');
  assert(s.svc.isTerminalStatus('Abierto') === false, 'Abierto no es terminal');
}

// ── getActiveReportForOrder (regla 1 reporte activo por orden) ───────────────
section('getActiveReportForOrder');
{
  const reports = [
    { id: 'r1', order_id: 'o1', status: 'Abierto', code: '#RP-0001' },
    { id: 'r2', order_id: 'o2', status: 'Resuelto' },
    { id: 'r3', order_id: 'o3', status: 'Rechazado' }
  ];
  const s = makeService({ reports: reports });
  assert(s.svc.getActiveReportForOrder('o1') === reports[0], 'encuentra el reporte activo');
  assert(s.svc.getActiveReportForOrder('o2') === null, 'Resuelto no cuenta como activo');
  assert(s.svc.getActiveReportForOrder('o3') === null, 'Rechazado no cuenta como activo');
  assert(s.svc.getActiveReportForOrder('zzz') === null, 'orden sin reporte devuelve null');
  assert(s.svc.getActiveReportForOrder('') === null, 'orderId vacio devuelve null');
}

// ── validateNewReport ────────────────────────────────────────────────────────
section('validateNewReport');
{
  const s = makeService();
  const ok = s.svc.validateNewReport({ order_id: 'o1', reason: 'Caida total', description: 'La cuenta no carga desde ayer' });
  assert(ok.ok === true && ok.errors.length === 0, 'payload valido pasa');

  const shortReason = s.svc.validateNewReport({ order_id: 'o1', reason: 'Ca', description: 'La cuenta no carga desde ayer' });
  assert(shortReason.ok === false && shortReason.errors[0].indexOf('Motivo') !== -1, 'motivo <3 chars rechazado');

  const noOrder = s.svc.validateNewReport({ order_id: '', reason: 'Caida total', description: 'La cuenta no carga desde ayer' });
  assert(noOrder.ok === false, 'sin order_id rechazado');

  const shortDesc = s.svc.validateNewReport({ order_id: 'o1', reason: 'Caida total', description: 'corta' });
  assert(shortDesc.ok === false && shortDesc.errors[0].indexOf('Descripción') !== -1, 'descripcion <10 chars rechazada');
}

{
  // Regla de negocio: reporte activo existente bloquea
  const reports = [{ id: 'r1', order_id: 'o1', status: 'Abierto', code: '#RP-0007' }];
  const s = makeService({ reports: reports });
  const res = s.svc.validateNewReport({ order_id: 'o1', reason: 'Caida total', description: 'La cuenta no carga desde ayer' });
  assert(res.ok === false && res.errors[0].indexOf('#RP-0007') !== -1, 'reporte activo en la orden bloquea e incluye el codigo');
  const otherOrder = s.svc.validateNewReport({ order_id: 'o2', reason: 'Caida total', description: 'La cuenta no carga desde ayer' });
  assert(otherOrder.ok === true, 'otra orden sin reporte activo pasa');
}

// ── validateStatusUpdate ─────────────────────────────────────────────────────
section('validateStatusUpdate');
{
  const s = makeService();
  assert(s.svc.validateStatusUpdate({ id: 'r1', status: 'Resuelto', provider_response: 'Listo' }).ok === true, 'update valido pasa');
  assert(s.svc.validateStatusUpdate({ id: 'r1', status: 'Abierto' }).ok === true, 'reabrir es valido');
  assert(s.svc.validateStatusUpdate({ status: 'Resuelto' }).ok === false, 'sin id rechaza');
  assert(s.svc.validateStatusUpdate({ id: 'r1', status: 'Cerrado' }).ok === false, 'estado inventado rechaza');
  assert(s.svc.validateStatusUpdate({ id: 'r1', status: '' }).ok === false, 'estado vacio rechaza');
  assert(s.svc.validateStatusUpdate({ id: 'r1', status: 'Resuelto', provider_response: 'x'.repeat(2001) }).ok === false, 'respuesta >2000 rechaza');
}

// ── createReport ─────────────────────────────────────────────────────────────
section('createReport');
{
  const s = makeService();
  let threw = null;
  (async function () {
    try {
      await s.svc.createReport({ order_id: 'o1', reason: 'Ca', description: 'La cuenta no carga desde ayer' });
      threw = false;
    } catch (e) {
      threw = (e.name === 'ValidationError');
    }
    assert(threw === true, 'payload invalido lanza ValidationError');
    assert(s.calls.length === 0, 'no llama a la API si la validacion falla');

    const row = await s.svc.createReport({ order_id: 'o1', reason: '  Caida total  ', description: '  La cuenta no carga desde ayer  ', product_name: 'Netflix Premium', account_data: 'mail@mail.com' });
    assert(!!row && row.id === 'r-new-1', 'devuelve la fila creada');
    assert(s.calls.length === 1 && s.calls[0].method === 'POST' && s.calls[0].path === 'reports', 'POST a reports');
    assert(s.calls[0].body.reason === 'Caida total' && s.calls[0].body.description === 'La cuenta no carga desde ayer', 'campos trim()eados en el body');
    assert(s.reports.some(function (r) { return r.id === 'r-new-1'; }), 'actualizacion optimista: fila agregada al array');
    assert(s.bootCount() === 1, 'refresca via boot()');
  })();
}

// ── updateReportStatus ───────────────────────────────────────────────────────
section('updateReportStatus');
{
  const reports = [{ id: 'r1', order_id: 'o1', status: 'Abierto' }];
  const s = makeService({ reports: reports });
  (async function () {
    const row = await s.svc.updateReportStatus({ id: 'r1', status: 'Resuelto', provider_response: '  Cuenta reemplazada  ' });
    assert(row.status === 'Resuelto' && row.provider_response === 'Cuenta reemplazada', 'PATCH con respuesta trim()eada');
    assert(s.calls[0].method === 'PATCH' && s.calls[0].body.id === 'r1', 'PATCH a reports con id');
    assert(s.reports[0].status === 'Resuelto', 'actualizacion optimista: fila reemplazada en el array');
    assert(s.bootCount() === 1, 'refresca via boot()');

    const row2 = await s.svc.updateReportStatus({ id: 'r1', status: 'Abierto', provider_response: '   ' });
    assert(!('provider_response' in s.calls[1].body), 'respuesta en blanco NO se envia');
    assert(row2.status === 'Abierto', 'reabrir funciona');

    let threw = null;
    try { await s.svc.updateReportStatus({ id: 'r1', status: 'Pendiente' }); } catch (e) { threw = (e.name === 'ValidationError'); }
    assert(threw === true, 'estado invalido lanza ValidationError');
  })();
}

// ── submitNewReport / submitStatusUpdate (flujos con handlers) ───────────────
section('submitNewReport / submitStatusUpdate');
{
  const s = makeService();
  (async function () {
    const bad = await s.svc.submitNewReport({ order_id: 'o1', reason: 'Ca', description: 'La cuenta no carga desde ayer' });
    assert(bad === null && s.errors.length === 1 && s.errors[0].indexOf('Motivo') !== -1, 'submitNewReport devuelve null y notifica error');

    const good = await s.svc.submitNewReport({ order_id: 'o1', reason: 'Caida total', description: 'La cuenta no carga desde ayer' });
    assert(!!good && s.successes.length === 1, 'submitNewReport exitoso notifica exito');

    const upd = await s.svc.submitStatusUpdate({ id: 'r9', status: 'Rechazado', provider_response: 'No procede' });
    assert(!!upd && upd.status === 'Rechazado' && s.successes.length === 2, 'submitStatusUpdate exitoso');

    const badUpd = await s.svc.submitStatusUpdate({ id: 'r9', status: 'NoExiste' });
    assert(badUpd === null && s.errors.length === 2, 'submitStatusUpdate invalido devuelve null y notifica');
  })();
}

// ── Resumen ──────────────────────────────────────────────────────────────────
setTimeout(function () {
  console.log('\n=============================================');
  console.log('RESULTADO: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(function (f) { console.log('  - ' + f); });
    process.exit(1);
  }
  console.log('TODO OK');
}, 400);

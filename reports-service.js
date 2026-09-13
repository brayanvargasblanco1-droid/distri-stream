/* ══════════════════════════════════════════════════════════════════════════════
   REPORTS SERVICE v1 — Capa de servicio sin DOM para reportes
   ══════════════════════════════════════════════════════════════════════════════
   Extrae la lógica de negocio de sendReport/resolveReport fuera de index.html:

     • Validación de payloads (nuevo reporte / cambio de estado)
     • Regla de negocio: 1 reporte activo por orden
     • Mutaciones vía API (POST/PATCH /reports)
     • Actualización optimista del array de reportes + refresh vía boot()

   Sin referencias al DOM. Las dependencias se INYECTAN (api, getter de
   reportes, boot), por lo que es testeable en Node con mocks.

   Nota: `state` en index.html se REASIGNA en cada boot()
   (`state={...emptyState(),...res}`), por eso el array de reportes se inyecta
   como GETTER y se resuelve en cada llamada — nunca queda obsoleto.

   Nota histórica: los scripts externos cargan DESPUÉS del <script> inline de
   index.html y pisan los globales del mismo nombre (bug documentado en
   FEEDBACK_FUNCIONES.md). Por eso este módulo se expone como NAMESPACE
   (window.ReportsService.*) y NUNCA redefine sendReport/resolveReport.
   ══════════════════════════════════════════════════════════════════════════════ */

(function (global) {
  'use strict';

  // Estados válidos — espejo de ReportValidator.STATES (reports-security.js)
  // y de los flujos reales de index.html (Resolver/Rechazar).
  var STATUS = {
    OPEN: 'Abierto',
    REVIEWING: 'En revisión',
    IN_PROGRESS: 'En proceso',
    RESOLVED: 'Resuelto',
    REJECTED: 'Rechazado'
  };
  var VALID_STATUSES = Object.keys(STATUS).map(function (k) { return STATUS[k]; });

  /**
   * Fábrica del servicio. Dependencias inyectables:
   *   api       {Function}        api(path, opts) del backend (index.html)
   *   reports   {Array|Function}  array de reportes O getter () => state.reports
   *   boot      {Function}        refresco global tras mutar (opcional en tests)
   *   onError   {Function}        handler de errores (default: toast "bad")
   *   onSuccess {Function}        handler de éxito  (default: toast "ok")
   */
  function ReportsServiceFactory(deps) {
    deps = deps || {};

    var apiFn = typeof deps.api === 'function' ? deps.api : null;
    var reportsSrc = deps.reports;
    var bootFn = typeof deps.boot === 'function' ? deps.boot : null;
    var onError = typeof deps.onError === 'function' ? deps.onError : function (msg) {
      if (typeof toast === 'function') toast(msg, 'bad');
    };
    var onSuccess = typeof deps.onSuccess === 'function' ? deps.onSuccess : function (msg) {
      if (typeof toast === 'function') toast(msg, 'ok');
    };

    // Resuelve el array de reportes en CADA llamada (soporta getter, porque
    // state se reasigna en cada boot() de index.html).
    function reportsArr() {
      if (typeof reportsSrc === 'function') {
        var arr = reportsSrc();
        return Array.isArray(arr) ? arr : null;
      }
      return Array.isArray(reportsSrc) ? reportsSrc : null;
    }

    // ── Consultas (solo lectura, cero efectos) ──────────────────────────

    /**
     * Devuelve el reporte activo (no Resuelto/Rechazado) de una orden, o null.
     * Implementa la regla de negocio "1 reporte activo por orden".
     */
    function getActiveReportForOrder(orderId) {
      var arr = reportsArr();
      if (!orderId || !arr) return null;
      return arr.find(function (r) {
        return r && r.order_id === orderId &&
          r.status !== STATUS.RESOLVED &&
          r.status !== STATUS.REJECTED;
      }) || null;
    }

    /** ¿Es un estado terminal (cierra el reporte)? */
    function isTerminalStatus(status) {
      return status === STATUS.RESOLVED || status === STATUS.REJECTED;
    }

    // ── Validación (pura: devuelve {ok, errors[]}, no lanza) ────────────

    /**
     * Valida el payload de un nuevo reporte.
     * Nota: motivo y descripción ≥10 chars replican el comportamiento previo
     * (la UI no recolecta "category", así que no se exige aquí).
     */
    function validateNewReport(input) {
      var errors = [];
      input = input || {};
      var reason = input.reason;
      var description = input.description;

      if (!input.order_id) errors.push('Debe seleccionar una compra/orden');
      if (!reason || !String(reason).trim() || String(reason).trim().length < 3) {
        errors.push('Motivo debe tener al menos 3 caracteres');
      }
      if (reason && String(reason).length > 100) errors.push('Motivo no puede exceder 100 caracteres');
      if (!description || !String(description).trim() || String(description).trim().length < 10) {
        errors.push('Descripción debe tener al menos 10 caracteres');
      }
      if (description && String(description).length > 2000) errors.push('Descripción no puede exceder 2000 caracteres');
      if (input.account_data && String(input.account_data).length > 300) {
        errors.push('Datos de cuenta no pueden exceder 300 caracteres');
      }
      // Regla de negocio: solo un reporte activo por orden
      if (input.order_id) {
        var active = getActiveReportForOrder(input.order_id);
        if (active) {
          errors.push('🚫 Límite alcanzado: Ya tienes un reporte activo (' + (active.code || '#RP-0000') + ') para esta cuenta. Debes esperar a que sea solucionado por el soporte antes de enviar otro.');
        }
      }
      return { ok: errors.length === 0, errors: errors };
    }

    /**
     * Valida un cambio de estado (admin). El backend (PATCH /reports) hace
     * cumplir los permisos; aquí solo se valida la forma del payload.
     */
    function validateStatusUpdate(update) {
      var errors = [];
      update = update || {};

      if (!update.id) errors.push('Falta el id del reporte');
      if (!update.status) {
        errors.push('Estado requerido');
      } else if (VALID_STATUSES.indexOf(update.status) === -1) {
        errors.push('Estado inválido: ' + update.status);
      }
      if (update.provider_response && String(update.provider_response).length > 2000) {
        errors.push('Respuesta no puede exceder 2000 caracteres');
      }
      return { ok: errors.length === 0, errors: errors };
    }

    // ── Comandos (mutaciones vía API + actualización optimista) ─────────

    function validationError(errors) {
      var err = new Error(errors.join('\n'));
      err.name = 'ValidationError';
      return err;
    }

    /**
     * Crear un reporte. Devuelve la fila creada.
     * Lanza Error (name: 'ValidationError') si la validación falla.
     */
    async function createReport(input) {
      input = input || {};
      var check = validateNewReport(input);
      if (!check.ok) throw validationError(check.errors);
      if (!apiFn) throw new Error('ReportsService: dependencia api() no disponible');

      var row = await apiFn('reports', {
        method: 'POST',
        body: JSON.stringify({
          order_id: input.order_id,
          product_name: input.product_name || 'Producto sin nombre',
          account_data: input.account_data || '',
          reason: String(input.reason).trim(),
          description: String(input.description).trim()
        })
      });

      // Actualización optimista del array actual (getter → siempre vivo)
      var arr = reportsArr();
      if (arr && row) arr.push(row);
      if (bootFn) { try { await bootFn(); } catch (_) { /* refresh best-effort */ } }
      return row;
    }

    /**
     * Actualizar estado y/o respuesta de un reporte (flujo admin, extraído de
     * resolveReport). Devuelve la fila actualizada.
     * Lanza Error (name: 'ValidationError') si la validación falla.
     */
    async function updateReportStatus(input) {
      input = input || {};
      var check = validateStatusUpdate(input);
      if (!check.ok) throw validationError(check.errors);
      if (!apiFn) throw new Error('ReportsService: dependencia api() no disponible');

      var payload = { id: input.id, status: input.status };
      var resp = input.provider_response;
      if (resp && String(resp).trim()) payload.provider_response = String(resp).trim();

      var row = await apiFn('reports', { method: 'PATCH', body: JSON.stringify(payload) });

      var arr = reportsArr();
      if (arr && row) {
        var idx = arr.findIndex(function (r) { return r && r.id === input.id; });
        if (idx >= 0) arr[idx] = row;
      }
      if (bootFn) { try { await bootFn(); } catch (_) { /* refresh best-effort */ } }
      return row;
    }

    // ── Flujos de UI listos para usar (sin DOM: validan, ejecutan y       ─
    //    notifican vía handlers inyectados; devuelven null si fallaron)   ─

    /** Flujo "enviar reporte". Devuelve la fila creada o null si falló. */
    async function submitNewReport(input) {
      try {
        var row = await createReport(input);
        onSuccess('Reporte enviado correctamente');
        return row;
      } catch (e) {
        onError(e.message || 'No se pudo enviar el reporte');
        return null;
      }
    }

    /** Flujo "actualizar estado". Devuelve la fila actualizada o null. */
    async function submitStatusUpdate(input) {
      try {
        var row = await updateReportStatus(input);
        onSuccess('Reporte actualizado');
        return row;
      } catch (e) {
        onError(e.message || 'No se pudo actualizar el reporte');
        return null;
      }
    }

    return {
      STATUS: STATUS,
      VALID_STATUSES: VALID_STATUSES,
      getActiveReportForOrder: getActiveReportForOrder,
      isTerminalStatus: isTerminalStatus,
      validateNewReport: validateNewReport,
      validateStatusUpdate: validateStatusUpdate,
      createReport: createReport,
      updateReportStatus: updateReportStatus,
      submitNewReport: submitNewReport,
      submitStatusUpdate: submitStatusUpdate
    };
  }

  // Singleton del navegador: se cablea una vez con las dependencias reales.
  // `reports` se pasa como getter porque state se reasigna en cada boot().
  var singleton = null;
  function autobind() {
    if (singleton) return singleton;
    singleton = ReportsServiceFactory({
      api: (typeof api === 'function') ? api : null,
      reports: function () {
        try { return (typeof state !== 'undefined' && state) ? state.reports : null; }
        catch (_) { return null; }
      },
      boot: (typeof boot === 'function') ? boot : null
    });
    return singleton;
  }

  // Export namespaced — jamás redefine sendReport/resolveReport (evita el
  // bug histórico de scripts externos pisando los globales inline).
  global.ReportsService = {
    create: ReportsServiceFactory,
    autobind: autobind,
    STATUS: STATUS
  };
})(typeof window !== 'undefined' ? window : globalThis);

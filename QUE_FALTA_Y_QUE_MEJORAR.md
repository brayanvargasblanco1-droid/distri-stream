# 🎯 QUÉ FALTA Y QUÉ MEJORAR — Backlog actualizado

> **Última actualización: 2026-09-12** — Reemplaza la versión anterior (analítica de ~51h sobre el
> módulo de reportes pre-refactor). Lo que ya está hecho quedó demostrado en el código; este doc
> lista solo lo pendiente, verificado contra el código real.

---

## ✅ YA RESUELTO (para no volver a planificarlo)

Todo el plan TIER 1/TIER 2 original está **implementado y en producción**:

- ✅ **Separación Activos / Resueltos** — tabs con contadores, constantes `ACTIVE_STATES` / `RESOLVED_STATES`
- ✅ **Validación de datos** — `ReportValidator` centralizado (`reports-security.js` + extensión en `reports-functions.js`)
- ✅ **Confirmaciones en acciones destructivas** — resolver/rechazar exigen confirmación + motivo obligatorio
- ✅ **Permisos y seguridad** — `ReportPermissions` (canView/canModify/canDelete/canExport), RLS endurecida por rol en todas las tablas (`20260905000000_harden_rls.sql`), tope de cuentas activas y rate-limit de `/buy` del lado del servidor
- ✅ **Escapar HTML dinámico** — `esc()` / `ReportValidator.escapeHtml` en renders de reportes, tienda, publicidad
- ✅ **Timeline dinámico de reportes** — basado en datos reales (no hardcodeado), con panel rojo de rechazo y cuenta afectada
- ✅ **Búsqueda con debounce** (300ms) y filtros por estado en reportes
- ✅ **Persistencia real vía API** — reportes, topups, perfil y avatar persisten en Supabase (POST/PATCH/DELETE); eliminado el fallback silencioso a localStorage
- ✅ **Cliente puede responder reportes abiertos** y cambiar su propia contraseña (`20260906000000_client_reply_reports.sql`)
- ✅ **Auditoría automática** (register, user_create/delete, report_update, topup_update) en tabla `audit_log`
- ✅ **Reset de contraseña** (forgot/reset-password via `supabase.auth`)
- ✅ **Sincronización stock ↔ inventario** (`20260907000000_sync_stock_with_inventory.sql`)
- ✅ **Roles completo**: red de referidos de revendedor, kit mayorista, exportar compras a CSV, tienda con buscador/filtros/cantidad

---

## 🚨 PENDIENTE — Prioridad Alta

### 1. ✅ Notificaciones en tiempo real — HECHO 2026-09-12
**Implementado:** Supabase Realtime (postgres_changes sobre `reports`) con RLS por dueño/admin
(migración `20260912000000_reports_realtime.sql`), módulo `reports-realtime.js` con reconexión y
fallback a polling, toasts en la app + notificación del sistema si el permiso push ya estaba concedido.
El flujo push Web (VAPID, backend → dispositivos) sigue disponible como complemento.

### 2. ✅ Desacoplar `sendReport()` / `updateReportResponse()` del DOM — HECHO 2026-09-12
**Implementado:** nueva capa de servicio **`reports-service.js`** sin DOM: fábrica
`ReportsService.create({api, reports, boot, onError, onSuccess})` con `reports` inyectado como
**getter** (state se reasigna en cada boot), validaciones puras (`validateNewReport`,
`validateStatusUpdate`), regla de negocio 1-activo-por-orden (`getActiveReportForOrder`), mutaciones
vía API con actualización optimista (`createReport`, `updateReportStatus`) y flujos listos
(`submitNewReport`, `submitStatusUpdate`). `sendReport()`/`resolveReport()` en index.html ahora solo
leen el form y delegan; `updateReportResponse()` resultó ser **código muerto** (sus inputs
#rpSelect/#rpResponse/#rpStatus no existen) y fue eliminada. Namespace `ReportsService.*` para no
pisar globales inline (bug histórico de scripts externos).
**Tests:** `node src/tests/reports-service.test.js` → **39 tests** cubriendo validación, regla de
negocio y mutaciones con api mockeada. Primera suite unitaria real del proyecto.

### 3. ⛔ Refactorizar `index.html` (640KB → 9.959 líneas)
**Estado:** Sigue monolítico. `sendReport`, `resolveReport`, `deleteReport`, `exportReportsCsv`, `ads()`, etc. viven dentro del HTML (la lógica de negocio de reportes ya vive en `reports-service.js`).
**Impacto:** ALTO — cada cambio toca un archivo enorme; riesgo de merge conflicts.

```
ESTRATEGIA SUGERIDA (incremental, sin big-bang):
├─ Fase 1: mover reportes (sendReport, updateReportResponse, openReport, openReportDetail) a reports-*.js
├─ Fase 2: mover publicidad (ads, adCard, createAd...) a un ads.js
├─ Fase 3: mover tienda/órdenes restantes a los *-simple.js existentes
└─ Regla: cada extracción va con su PR propio a main
```

---

## 🟡 PENDIENTE — Prioridad Media

### 4. 🟡 Exportación a PDF
**Estado:** Solo CSV básico (`exportReportsCsv()`). Sin PDF, sin logo, sin filtros aplicados.
**Complejidad:** Baja-Media · **Nota:** requeriría añadir una librería (jsPDF ~350KB o generar PDF server-side en la edge function para no inflar el frontend).

### 5. 🟡 Chat interno sobre reportes
**Estado:** Existe hilo de respuestas (cliente ↔ admin) pero no chat en tiempo real.
**Depende de:** item 1 (Realtime) — sería el mismo canal.

### 6. 🟡 Adjuntos / evidencia en reportes
**Estado:** No existe. El modal de reporte no acepta archivos.
**Nota:** Supabase Storage ya disponible en el proyecto (`supabase/config.toml` tiene sección `[storage]`); falta bucket + política RLS de storage + UI de subida (patrón similar al dropzone de publicidad).

### 7. 🟡 Indicadores de SLA
**Estado:** No existe. Se promete "30 min - 24 horas" en la UI pero nada mide si se cumple.
**Complejidad:** Baja — calcular `updated_at - created_at` por reporte y agregar al panel admin (tiempo medio de resolución, % dentro de SLA, alertas de vencidos).

### 8. 🟡 Búsqueda avanzada en reportes
**Estado:** Búsqueda con debounce y filtro por estado ✔; faltan rango de fechas, categoría y fuzzy.
**Complejidad:** Media.

---

## 🟢 PENDIENTE — Prioridad Baja

### 9. 🟢 Exportación avanzada
Exportar solo lo filtrado, elegir campos, fecha de generación. El CSV actual exporta siempre todo `state.reports`.

### 10. 🟢 Cacheo de estadísticas con memoization
`reportsAdmin()`/`reportsUser()` recalculan contadores en cada render. Bajo impacto hoy; relevante con miles de reportes.

### 11. 🟢 Limpiar docs históricos
23 `.md` en la raíz, muchos de una sola vez (`SUMMARY.md`, `FINAL_SUMMARY.md`, `COMPLETADO.md`, etc.). Mover a `docs/historico/`.

---

## 📋 ORDEN SUGERIDO

| # | Tarea | Por qué primero |
|---|-------|-----------------|
| 1 | ~~Desacoplar sendReport/updateReportResponse del DOM~~ ✅ | Hecho 2026-09-12 (reports-service.js + 39 tests) |
| 2 | Refactor fase 1 (UI de reportes fuera de index.html) | El servicio ya está fuera; falta la UI |
| 3 | ~~Notificaciones realtime (Supabase Realtime)~~ ✅ | Hecho 2026-09-12 |
| 4 | SLA en panel admin | Barato y visible para admins |
| 5 | Adjuntos vía Supabase Storage | Depende de UX de reportes ya estable |
| 6 | PDF + exportación avanzada | Cuando haya demanda real |
| 7 | Chat interno | Extensión natural del 3 |

---

## 📊 RESUMEN

| Categoría | Estado |
|-----------|--------|
| Seguridad TIER 1 (HTML, permisos, confirmaciones, validación, RLS) | ✅ **HECHO** |
| Reportes: separación, timeline, respuestas de cliente | ✅ **HECHO** |
| Persistencia API real (reportes, topups, perfil) | ✅ **HECHO** |
| Notificaciones realtime | ✅ **HECHO** (2026-09-12) |
| Desacoplar DOM + refactor index.html | ❌ Pendiente (Alta) |
| PDF / exportación avanzada | ❌ Pendiente (Media/Baja) |
| Chat interno | ❌ Pendiente (Media) |
| Adjuntos / evidencia | ❌ Pendiente (Media) |
| SLA | ❌ Pendiente (Media) |
| Búsqueda avanzada | ❌ Pendiente (Media) |

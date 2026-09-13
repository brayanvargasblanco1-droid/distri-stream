# Distrito Streaming - Memoria del Proyecto

## Descripción
Plataforma de gestión empresarial para distribuidores de servicios de streaming
(Netflix, Spotify, Disney+, etc.). Sistema de gestión de usuarios, operadores y
administradores para la venta y administración de cuentas de streaming.

## Stack
- **Frontend:** SPA vanilla JS + CSS embebido (index.html ~640KB)
- **Backend:** Supabase (API REST)
- **Deploy:** Vercel (auto-deploy desde GitHub main → producción)
- **Producción:** https://distrito-streaming-vercel-ashen.vercel.app/
- **Repo:** https://github.com/vargasblancobrayan-cyber/distri-stream

## Arquitectura de archivos
- `index.html` — Aplicación principal (640KB)
- `src/app.js` — Inicialización y estado global
- `src/utils.js` — Helpers (escapeHTML, formatMoney, etc.)
- `src/components.js` — Componentes UI reutilizables
- `reports-functions.js` (49KB) — Lógica de reportes
- `reports-security.js` (18KB) — Validaciones y seguridad
- `reports-optimizations.js` (15KB) — Cache y optimizaciones
- `reports-monkey-patch.js` (8KB) — Parches de seguridad
- `support-operators-simple.js` (32KB) — Panel de soporte premium
- `*-simple.js` (history, nav, orders, store) — Módulos funcionales
- `premium-styles.css` / `reports-styles.css` — Estilos

## Roles
- **Usuario:** comprar cuentas, ver pedidos, crear reportes
- **Operador:** gestiona pedidos, actualiza estados, responde reportes
- **Admin:** control total, gestión de usuarios, configuraciones

## Flujo de trabajo (PRs)
- Rama de trabajo recurrente: `mejora-rendimiento-reportes`
- PRs se mergean a `main` (base branch)
- Vercel despliega automáticamente (main → Production, features → Preview)
- No hay GitHub Actions workflows (deploy es por Vercel)

## Estado del trabajo (agosto 2026)
### Completado
- Sistema de reportes con progress bar visual (4 etapas)
- Contadores Activos vs Resueltos
- Separación Activos/Resueltos con tabs
- Timeline dinámico de eventos
- Seguridad TIER 1 (escapar HTML, permisos, confirmaciones, validación)
- Estados como constantes (ReportStates, ReportCategories, ReportPriority)
- ReportValidator y ReportPermissions centralizados
- Búsqueda con debounce 300ms
- Navegación premium, dark mode, skeleton loaders, empty states
- Premium design system, navegación con iconos

## Notificaciones realtime (2026-09-12)
- **Migración `20260912000000_reports_realtime.sql`**: política RLS `reports_select_own_or_admin`
  (dueño o admin) — necesaria porque tras harden_rls la tabla tenía CERO políticas SELECT y Realtime
  respeta RLS —, helper `is_admin()`, publicación `supabase_realtime` de reports y `replica identity full`.
- **Edge function**: `/bootstrap` devuelve `realtime: {url, anonKey, table}` (SUPABASE_URL +
  SUPABASE_ANON_KEY auto-inyectadas) y `sessionToken` (JWT de la request, solo en memoria).
- **`reports-realtime.js`**: suscripción `postgres_changes` con anon key + `setAuth(jwt)`; toasts de
  eventos (nuevo reporte, respuesta, resuelto/rechazado, reply de cliente), dedup/throttle 1.5s,
  reconexión con backoff (3s→60s), re-check en `visibilitychange`, fallback polling (60s sin realtime,
  120s como red de seguridad con realtime OK). API: `startReportsRealtime()` / `stopReportsRealtime()`.
- **index.html**: handler `window.onRealtimeReport(row, eventType)` fusiona la fila en `state.reports`
  y refresca la vista solo si `state.view==="reports"` y no hay modal abierto; boot inicia realtime,
  logout lo detiene. `sw.js` v13; `APP_VERSION = 2026.09.12-window-state-fix`.
- **⚠️ `state` debe ser `var`, NUNCA `let`** (fix 2026-09-12): los módulos externos leen
  `window.state` (reports-realtime.js, reports-security.js, reports-monkey-patch.js,
  reports-functions.js) y un `let` top-level no crea propiedad en `window` → con `let` el realtime
  nunca arrancaba y los permisos/validaciones de esos módulos eran inertes. Un `var` top-level de
  script clásico SÍ crea `window.state` y queda sincronizado al reasignar en boot()/logout().
- **Despliegue**: aplicar la migración (`supabase db push`) ANTES de desplegar frontend/edge; sin ella
  el módulo cae a polling automáticamente (no rompe nada).

## Constantes de estado de reportes — UNA sola fuente (2026-09-12)
- **Fuente canónica: `ReportsService.STATUS`** (reports-service.js, el primero en cargar).
- `ReportValidator.STATES` (reports-security.js) y `ReportStates` (reports-functions.js) son
  **ALIAS por referencia** del canónico, con fallback inline por si el orden de carga cambia.
- NO duplicar la lista de estados en otros archivos. Los mapas de emoji/color (index.html,
  reports-monkey-patch.js, STATUS_META en reports-functions.js) son presentación, no identidad.
- Guardián: `node src/tests/status-consistency.test.js` (10 tests — falla si los alias dejan de
  ser la misma referencia o los valores divergen).

## Módulo "Reports Service" (desacople del DOM) — 2026-09-12
- **`reports-service.js` (nuevo)**: capa de servicio sin DOM. Fábrica `ReportsService.create({api,
  reports, boot, onError, onSuccess})` — `reports` se inyecta como **getter** porque `state` se
  reasigna en cada boot(). Expone: `validateNewReport`, `validateStatusUpdate`,
  `getActiveReportForOrder` (regla 1 activo por orden), `isTerminalStatus`, `createReport`,
  `updateReportStatus` y los flujos `submitNewReport`/`submitStatusUpdate` (validan, mutan vía API,
  actualización optimista del array y refresh vía boot()).
- **Namespace, no globales sueltos**: jamás redefine sendReport/resolveReport (evita el bug
  histórico de scripts externos pisando los globales inline — FEEDBACK_FUNCIONES.md).
- **index.html**: `sendReport()` y `resolveReport()` ahora delegan en el servicio (solo leen el
  form y pintan UI). `updateReportResponse()` era CÓDIGO MUERTO (#rpSelect/#rpResponse/#rpStatus no
  existen en ninguna parte) → eliminado. `APP_VERSION = 2026.09.12-reports-service`.
- **Tests reales en Node**: `node src/tests/reports-service.test.js` → 39 tests (validación, regla
  de negocio, mutaciones con api mockeada, optimistic update). Primera cobertura sin navegador.
- Cuidado al editar: el servicio no conoce el DOM; los handlers de UI son los únicos que tocan
  inputs (`#rpOrder/#rpReason/#rpDesc`) y modales.

### Pendiente (según QUE_FALTA_Y_QUE_MEJORAR.md — actualizado 2026-09-12)
- ~~Notificaciones en tiempo real (Supabase Realtime sobre reports)~~ ✅ 2026-09-12
- ~~Desacoplar sendReport/updateReportResponse del DOM~~ ✅ 2026-09-12 (reports-service.js)
- Refactorizar index.html (640KB, ~9.974 líneas: reportes → reports-*.js, ads → ads.js)
- Exportación a PDF (hoy solo CSV básico)
- Chat interno sobre reportes
- Adjuntos/evidencia en reportes (Supabase Storage ya disponible en config)
- Indicadores de SLA (promesa "30 min - 24h" sin medición)
- Búsqueda avanzada (rango de fechas, categoría, fuzzy)

### Cuentas / servicios
- GitHub: brayanvargasblanco1-droid/distri-stream (commits firmados como vargasblancobrayan-cyber)
- Supabase: proyecto qbdhcnhplamatydsqkae (edge function: distrito-api)
- Vercel: distrito-streaming-vercel-ashen (deploy automático desde main)

## Comandos útiles
```bash
# Servir localmente
npx serve .

# Ejecutar tests (consola del navegador)
runQuickTest();
# o añadir ?test a la URL
```

## Notas
- El usuario trabaja en español
- Rama de trabajo por defecto para mejoras: `mejora-rendimiento-reportes`
- Los PRs se crean contra `main` salvo indicación contraria

## Módulo "Material de Venta" (ads) — refactorizado 2026-08-08
- Había 3 generaciones de código duplicadas (ads gen1 con tabs viejos, gen2 muerta
  con IDs inexistentes, gen3 con adCard + createAd leyendo #adTitle que no existía).
- Se unificó en una sola `ads()` que usa `adCard()` para cliente/revendedor (copiar
  texto + WhatsApp share) y un form admin completo (#adTitle/#adCopy/#adPrice/
  #adCategory/#adExpiry/#adStatus + live preview #adLivePreview + dropzone).
- Eliminado código muerto: -424 líneas. Funciones ahora únicas: ads, adCard,
  createAd, deleteAd, editAd, saveAdEdit, showAdTab, handleAdDrop,
  handleAdFileSelect, showAdFilePreview, clearAdFile, updateAdPreview,
  compressAndConvertToBase64, openCopyModal, confirmCopy, confirmDeleteAd,
  shareAdWhatsApp, moveAd, previewEditAdImage, renderAdsGrid.
- CSS `.ad-tab` agregado al bloque ADS SECTION IMPROVEMENTS (~línea 1382).
- No tocar sin leer el flujo: renderView() despacha a ads() (línea ~2826),
  navItems() muestra "Publicidad" para admin / "Material" para cliente.

## Transformación visual premium — 2026-08-08
- **Problema P0 resuelto**: el `<style>` inline (líneas 24-40) pisaba las variables de premium-styles.css porque carga DESPUÉS del `<link>`. El dark mode usaba `#071526` (azul legacy) en vez del neutro premium `#0a0f1a`.
- Unificación: las variables `:root` y `body.dark` del inline ahora usan los mismos valores premium que premium-styles.css. Mapeo de colores legacy→premium aplicado globalmente (~140 reemplazos): rgba(13,29,49→17,24,39), rgba(18,37,59→31,41,55), #0d1d31→#111827, #1e3652→#2d3a4f, #eef6ff→#f3f4f6, #8da0b8→#9ca3af.
- Gradientes azules intencionales (balance-card, hours-slide) preservados.
- Glass premium aplicado a: `.side` (backdrop blur+saturate), `.top` header (sticky glass translúcido), `.stats-row` (glass + hover glow).
- Dark mode mobile-nav arreglado (antes blanco brillante en dark → ahora rgba(17,24,39,.95)).
- toggleDark ya usa #0a0f1a en su overlay → sin flash de color inconsistente.
- Validado: JS sintaxis OK, build OK, mock removido, 0 placeholders sin restaurar. Login, dashboard, inventario, publicidad funcionan en light+dark.

## Material de Venta (cliente/revendedor) — mejora UX premium 2026-08-08
- Antes: cliente/revendedor solo veian un `<h1>` plano + grid de cards basicas (clase `.product` generica de la tienda) con botones Copiar/Enviar.
- Ahora: **hero premium** (gradiente azul→purpura, icono, glow radial, stats de anuncios disponibles) + **filtro por categoria** (chips: Todos/Promo/Urgente/Info/Aviso) + **cards premium**.
- `adCard(a,idx)` redisenada: poster con gradiente segun categoria (azul/verde/naranja/rojo) + shine animado, badge de categoria con icono, precio destacado, texto con line-clamp, botones con jerarquia (Copiar primario lleno, WhatsApp cuadrado verde, Editar/Eliminar iconos para admin), animacion de entrada escalonada (stagger via animation-delay).
- `setAdFilter(cat)` guarda en `window._adFilterCat` y re-renderiza. Solo se muestran chips si hay >1 categoria.
- Empty state premium (icono SVG en circulo gradiente + titulo + texto).
- Responsive: grid 2 columnas en mobile, media height ajustada.
- Dark mode: hero/filtros/cards/empty con overrides coherentes.
- Sin romper admin: `ads()` admin sigue con tabs Subir/Ver; adCard preserva order-buttons, stats de copias/descargas, editar/eliminar.
- Funciones intactas: openCopyModal, confirmCopy, shareAdWhatsApp, moveAd, editAd, deleteAd.
## Alineación esquema ↔ app real — 2026-09-03
- **Migración `20260903000000_align_schema_with_app.sql`**: añade las columnas que el backend/frontend usan y que no existían:
  - `profiles`: avatar_emojia, avatar_color_index
  - `products`: provider_price, base_price, share_type
  - `inventory`: email, password, profile, pin, expiry_date, status, delivery_date, assigned_user_id
  - `orders`: amount, code, provider_price, delivered_data, credentials, expires_at; `order_code` ya no es NOT NULL (el backend inserta `code`)
  - `reports`: user_id, order_id, product_name, client_name, account_data, reason, status (Abierto/En revision/Resuelto/Rechazado); `report_type` y `title` ya no son NOT NULL
  - `ads`: copies
  - `topups`: notes
  - **Nueva tabla** `audit_log` (user_id,d action,d table_name,d record_id,d details,d created_at).
- **RLS endurecida**: cada tabla tiene políticas por rol (perfil propio,d ordenes/reports/topups propios,d admin ve todo via service_role; audit_log inaccesible al publico). El edge function usa service_role (salta RLS), así que el frontend sigue funcionando igual.



## Endpoints nuevos(backends)
- `POST forgot-password` `{email}` → `supabase.auth.resetPasswordForEmail` (enlace → `/?reset=1#access_token=...&type=recovery`).
- `POST reset-password` `{token,d password}` → `supabase.auth.updateUser`.
- Auditoría automática en: register,d user_create,d user_delete,d report_update,d topup_update.



## Frontend (persistencia real)
- `saveProfile()` y `saveAvatarChoice()` ahora hacen PATCH a `/users` (persisten en DB); el localStorage es solo espejo después de confirmar).
.
- Aprobación/rechazo de recargas ahora dependen 100% de la API (si la API falla,d se muestra error; se eliminó el fallback silencioso a localStorage `dsTopups`).
- Modal "Olvidaste tu contraseña?" (`forgotPassword()`) + manejo de `?reset=1#access_token=...&type=recovery` (`handlePasswordReset()` → `sendResetPassword()`).

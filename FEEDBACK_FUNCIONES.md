# 📋 FEEDBACK DE FUNCIONES — DISTRITO STREAMING

> Generado tras la sesión de mejoras de seguridad y robustez (commit `b5128ac`).
> Estado: los arreglos están **desplegados en producción** y verificados con pruebas
> reales sobre la API (registro, login+cookie, bootstrap, buy, concurrencia).
>
> **Ronda 2 (auditoría de "qué no funciona")**: commit `b5128ac+` corrigió la
> regresión de reportes y los botones rotos del panel admin (ver sección 🔧 RONDA 2).

---

## ✅ RESUMEN EJECUTIVO

Se corrigieron **12 problemas** de seguridad/robustez y se probaron E2E:

| # | Mejora | Verificado |
|---|--------|-----------|
| 1 | `/register` siempre crea rol `Cliente` (fin de la escalación a admin) | ✅ probado con `role=Administrador` → creó Cliente |
| 2 | `/bootstrap` filtra pedidos/reportes/recargas por `user_id` (fin de la fuga de credenciales) | ✅ |
| 3 | Rate limiting en `/login` y `/register` | ✅ (además en forgot-password y check-user-status) |
| 4 | Sesión en **cookie httpOnly** `ds_token` + endpoint `/logout` | ✅ login fija `Set-Cookie`, bootstrap funciona solo con cookie |
| 5 | CORS con credenciales restringido a orígenes conocidos + **chequeo CSRF** por `Origin` | ✅ |
| 6 | `/buy` **atómico**: claim por cuenta con CAS; dos compras simultáneas no entregan la misma cuenta | ✅ prueba de concurrencia (3 cuentas, 2 compras de 2 → solo 1 ganó, sin duplicados) |
| 7 | Saldo y stock con **guardas optimistas** + rollback automático si falla | ✅ prueba de rollback (claim parcial liberado) |
| 8 | **Anti-enumeración**: `/login` con mensaje genérico; `check-user-status` ya no revela si el correo existe | ✅ |
| 9 | Errores de DB **genéricos** al cliente (detalle solo en logs) | ✅ |
| 10 | Contraseñas mínimas de **8 caracteres** (backend + frontend) | ✅ |
| 11 | El JWT ya **no se guarda en localStorage** (solo flag no sensible `dsAuthed`) | ✅ |
| 12 | `sw.js` network-first para JS/CSS/HTML (no más bundles viejos en caché) | ✅ |
| 13 | Tabla `audit_log` creada en la DB (la auditoría ya registra) | ✅ |

Hallazgo adicional: solo existe **1 cuenta Administrador** (`admin@distrito.com`) — no hay
admins fantasma creados por el exploit de `?ref=admin_`.

---

## ⚙️ BACKEND — Edge Function `distrito-api` (feedback por endpoint)

| Endpoint | Método | Feedback |
|----------|--------|----------|
| `health` | GET | ✅ Correcto y útil para monitoreo. |
| `register` | POST | ✅ **Arreglado**: fuerza `Cliente`, ignora `role` del body, rate limit 5/15min, contraseña ≥8, errores genéricos. Nota: con `admin.createUser` no llega email de confirmación (el usuario queda activo al instante) — comportamiento ya esperado por el frontend. |
| `check-user-status` | POST | 🟡 No lo usa el frontend. Ahora no revela existencia (solo `blocked`). Rate limit 30/15min. Considerar eliminarlo cuando no haya consumidores. |
| `forgot-password` | POST | ✅ No revela si el correo existe; rate limit 5/15min. |
| `reset-password` | POST | ✅ Contraseña ≥8. Nota: acepta el token en el body (flujo `?reset=1#access_token`) — correcto. |
| `logout` | POST | 🆕 **Nuevo**: limpia la cookie httpOnly. |
| `login` | POST | ✅ **Arreglado**: mensaje genérico (no enumera), rate limit 15/5min, fija cookie httpOnly `ds_token` (SameSite=None + Secure), respeta bloqueos. Mantiene el token en la respuesta para compatibilidad. |
| `bootstrap` | GET/POST | ✅ **Arreglado**: no-admins ven solo sus datos; admins ven todo. Devuelve todo en 1 request (fácil para el SPA) — pendiente paginar cuando crezca. |
| `audit-log` | GET | ✅ Solo admin; la tabla ya existe en la DB. |
| `buy` | POST | ✅ **Arreglado y atómico** (ver detalle abajo). |
| CRUD `users` | GET/POST/PATCH/DELETE | ✅ Roles: solo admin; no te puedes cambiar rol/estado ni borrarte; contraseña ≥8 vía `admin.updateUserById`; audita todo. GET de admin limita 1000 filas. |
| CRUD `inventory` | GET/POST/PATCH/DELETE | ✅ Solo admin. La validación de duplicados/formato se hace en frontend — falta en backend (un admin con curl puede meter filas vacías). |
| CRUD `products` | GET/POST/PATCH/DELETE | ✅ Solo admin. Igual nota que inventory. |
| CRUD `reports` | GET/POST/PATCH/DELETE | ✅ Los no-admins solo ven los propios (GET), solo admin modifica. |
| CRUD `topups` | GET/POST/PATCH/DELETE | ✅ Aprobación acredita saldo atómicamente con guarda; audita. |
| CRUD `ads` | GET/POST/PATCH/DELETE | ✅ `increment_copies` permitido a cualquier autenticado (cuenta copias) — intencional. |
| CRUD `settings` | GET/PUT/PATCH | ✅ Solo admin. |
| **General** | — | ✅ CSRF por `Origin`, CORS por origen permitido, errores genéricos, rate limiting por IP en todos los endpoints públicos, auditoría con fallo silencioso. |

### Detalle de `/buy` (antes tenía 2 bugs serios)

**Antes:** 1) seleccionaba cuentas y luego las marcaba → 2 compras simultáneas entregaban la misma cuenta; 2) el saldo se descontaba sin verificar.

**Ahora:**
1. *Claim por cuenta (CAS)*: selecciona 1 `Disponible` y la actualiza solo si sigue `Disponible` (`UPDATE … WHERE id=? AND status='Disponible'`). Si dos compradores eligen la misma, uno gana y el otro reintenta con la siguiente. Nunca se entrega dos veces la misma cuenta.
2. *Stock*: se relee y se descuenta con guarda (`WHERE stock=valor_leido`); si cambió entre la lectura y la escritura → rollback y error controlado.
3. *Saldo*: descuento con guarda (`WHERE balance=valor_leido`); si falla → se liberan las cuentas tomadas y se responde "Tu saldo cambió. Intenta de nuevo."
4. Cualquier error posterior al claim libera el inventario tomado (rollback).

**Probado en producción:** compra de 2 → 2 órdenes, cobro exacto; compra con stock insuficiente → error sin dejar claims; carrera de 2 compras simultáneas sobre 3 cuentas → una ganó 2, la otra falló limpio, 0 credenciales duplicadas.

---

## 🖥️ FRONTEND — `index.html` (feedback por área)

### Autenticación y sesión
| Función | Feedback |
|---------|----------|
| `login()` | ✅ Ahora usa cookie httpOnly (`credentials:include`), guarda solo `dsAuthed`, maneja bloqueo y errores por campo. |
| `logout()` | ✅ Llama a `/logout` (limpia cookie), luego estado local. |
| `register()` | ✅ Valida ≥8 caracteres; envía `referrer_id`. Nota: el `role` que calcula del `?ref=` ya no tiene efecto (el backend siempre crea Cliente) — el código aún lo envía; conviene simplificarlo. |
| `forgotPassword()` / `sendForgotPassword()` | ✅ No revela si el correo existe (mensaje genérico). |
| `handlePasswordReset()` / `sendResetPassword()` | ✅ Flujo de recuperación con token de la URL; ≥8 caracteres. |
| `boot()` | ✅ Carga todo el estado con 1 request; si la sesión expira redirige a login (se limpió `dsAuthed`). |

### Tienda / compra
| Función | Feedback |
|---------|----------|
| `finishBuy()` y flujo de compra | ✅ Trabaja con la respuesta nueva de `/buy`. |
| `canBuyProduct()` | ✅ Chequea stock/saldo antes de permitir. |
| `store()` / catálogo | ✅ Limpio; separado en `store-simple.js`. |
| `checkBalanceAlerts()` | ✅ Avisa saldo bajo. |

### Reportes (módulos `reports-*`)
| Función | Feedback |
|---------|----------|
| `generateReportCard()` / `generateReportCardSafe()` | ✅ Escapan HTML (`ReportValidator.escapeHtml`) — bien. |
| `submitReportWithValidation()` + `validateReportFormData()` + `showFormErrors()` | ✅ Validación centralizada con feedback visual. |
| `resolveReport()` / `deleteReport()` / `updateReportResponse()` / `exportReportsCsv()` | ✅ **Ronda 2**: se eliminaron los stubs de `reports-functions.js` que pisaban a las versiones reales de `index.html` (la carga del script externo las anulaba: solo mostraban toast y **no guardaban nada**). Ahora Resolver/Rechazar hacen PATCH real y `resolveReport(id,status,respuesta)` **persiste el mensaje de solución** como `provider_response`. |
| `searchReports()` / `initReportSearch()` / `onReportSearchInput()` | ✅ Búsqueda con debounce (300 ms). |
| `generateReportTimeline()` / `generateProgressSteps()` | ✅ Timeline por estado (mejorable: dinámico desde eventos reales). |
| `exportReportsCsv()` / `downloadReportPDF()` | ✅ Solo admin; CSV funcional; PDF es generación local simple. |
| `switchReportTab()` / `updateReportTabBadges()` | ✅ Tabs Activos/Resueltos con contadores. |
| `getReportStats()` / `renderReportStats()` | ✅ Estadísticas recalculadas por render (ok a esta escala). |
| `reports-monkey-patch.js` (3 parches) | 🟡 **Pendiente**: parchear en runtime es frágil — conviene fusionarlo en `reports-functions.js` (riesgo: se rompe si cambia el orden de carga de scripts). |
| `ReportValidator` / `ReportStates` / `ReportCategories` / `ReportPriority` | ✅ Constantes centralizadas — bien. |
| `checkOrderReport()` | ✅ Evita reportes duplicados por orden. |

### Soporte (`support-operators-simple.js`)
| Función | Feedback |
|---------|----------|
| Panel de soporte con chat por reporte | ✅ Integrado con la API real. Nota: el widget flotante está oculto por CSS (`display:none !important`) — decidir si se muestra o se elimina el código muerto. |

### Utilidades (`src/utils.js` / `src/app.js` / `src/components.js` / `src/ux.js`)
| Función | Feedback |
|---------|----------|
| `Utils.escapeHTML()` | ✅ Úsalo en TODA interpolación de datos de usuario (la mayoría ya lo hace). |
| `Utils.debounce` / `throttle` / `timeAgo` / `formatMoney` | ✅ Correctas y reutilizadas. |
| `App.init()` | 🟡 **Ojo**: solo verifica que los scripts existan (warn) — no carga nada. Hay DOS sistemas de carga de módulos (`src/index.js` carga dinámicamente pero `index.html` no lo usa). Consolidar. |
| `Utils.storage` | ✅ Con expiración — buena práctica. |
| `UX.toast` / modales / skeletons | ✅ Sistema visual consistente. |

### Exportaciones y utilidades de negocio
| Función | Feedback |
|---------|----------|
| `exportOrdersCsv` / `exportTopupsCsv` / `exportMovementsCsv` / `exportHistoryCsv` / `exportReportsCsv` | ✅ CSV funcionales con `csvCell` (escapa comas/comillas). Verificar que respeten permisos por rol (algunas se construyen sin volver a consultar el backend — confían en `state` ya filtrado por `/bootstrap`, ok). |
| `copyText` / `copyQRImage` / `downloadQRImage` / `downloadFile` | ✅ |
| `genPass()` | ✅ Generador de contraseñas. |

---

## 🔧 RONDA 2 — “Qué no estaba funcionando” (corregido)

Auditoría posterior a las mejoras de seguridad. Se encontraron y corrigieron:

| # | Problema encontrado | Corrección | Verificación |
|---|--------------------|------------|--------------|
| 1 | **Regresión de reportes**: `reports-functions.js` (v2 a medio terminar) declaraba stubs de `resolveReport`, `deleteReport`, `updateReportResponse` y `exportReportsCsv` que **pisaban** las versiones reales de `index.html` (el script externo carga después y gana). Resultado: Resolver/Rechazar solo mostraban un toast y **no guardaban nada en la DB**; el CSV no descargaba. | Eliminados los stubs (y las acciones falsas `rejectReport`) de `reports-functions.js`. Las versiones reales vuelven a ser las activas. | Orden de carga simulado + boot real en Chrome: `resolveReport`/`deleteReport`/`exportReportsCsv`/`updateReportResponse` quedan definidas por las versiones con API real; cero errores de consola. |
| 2 | **Botón “Resolver” perdía la solución escrita**: el modal admin “Dar solución” pasaba el texto como 3er argumento pero `resolveReport(id,status)` lo ignoraba. | `resolveReport(id,status,response)` ahora envía `provider_response` cuando hay texto. | Revisado el PATCH `/reports` del backend (acepta `provider_response`, solo admin) — listo. |
| 3 | **Botones rotos del panel admin** (existían en producción, sin función definida → `ReferenceError` al hacer clic): `generateUserQR` (QR en tarjetas de usuario), `showAddAccountModal` y `showImportSection` (vista Inventario). | `generateUserQR` → ahora llama a `openQrCode(uid)` (modal QR de identificación + referido, que ya existía para el usuario propio pero no aceptaba otro `id`). Se crearon `showAddAccountModal()` (modal de alta de cuenta que usa `addInventory()`, que estaba huérfana) y `showImportSection()` (modal de importación STGLIAK que reutiliza `importFromSTGLIAK()`/`previewImport()`). | Boot real en Chrome (server local + API real): las 3 funciones quedan definidas; sin errores. |

## 🔧 MÓDULOS SEPARADOS

| Módulo | Feedback |
|--------|----------|
| `nav-simple.js` | ✅ Navegación premium con permisos por rol (`navItems()`). |
| `history-simple.js` | ✅ Historial de pedidos/consumos. |
| `orders-simple.js` | ✅ Órdenes con estados y detalle. |
| `store-simple.js` | ✅ Tienda con catálogo y compra. |
| `src/components.js` | ✅ Componentes UI reutilizables (card, button, modal…). |
| `src/loader.js` | ✅ Carga diferida de módulos. |
| `src/index.js` | 🟡 Cargador dinámico que **nadie ejecuta** (index.html no lo referencia). Eliminar o integrar. |
| `reports-security.js` | ✅ Validaciones/permisos; lee roles de `localStorage` (`userRole`/`isAdmin`) — esos flags son *hints* de UI, la autoridad real es el backend. |
| `reports-optimizations.js` | ✅ Cache/memoización ligera + búsqueda. |

---

## 📌 PENDIENTE RECOMENDADO (próximas iteraciones)

1. **Refactorizar `index.html` (656 KB / ~8.9k líneas)** — partir CSS/JS en módulos con build. Es el cambio de mayor impacto a medio plazo. Riesgo alto si se hace de golpe; hacerlo por vistas.
2. **Consolidar el sistema de módulos**: hay `src/*.js` y `*-simple.js` con dos filosofías; eliminar `src/index.js` (no se usa) y `reports-monkey-patch.js` (fusionar).
3. **Notificaciones en tiempo real** con Supabase Realtime (órdenes entregadas, reportes respondidos, recargas aprobadas).
4. **Automatizar recargas con Wompi** (webhook de pago → acredita saldo) en vez de aprobación manual del operador.
5. **Paginación en `/bootstrap` y CRUD** cuando las tablas superen ~1.000 filas.
6. **Validación backend por tabla** (duplicados, formatos) además de la del frontend.
7. **Tests automatizados** (los actuales son `?test` en el navegador, sin CI). Un `npm test` con las funciones puras (validación, cálculo de precios, CSV) + GitHub Actions.
8. **Limpiar código muerto** detectado: widget de soporte oculto por CSS, `check-user-status` sin uso, `src/index.js`, tercera generación de código de ads (ya parcialmente limpia).

---

## 🏁 VEREDICTO

El backend quedó **sólido**: los vectores críticos (escalación de rol, fuga de datos,
doble entrega en compras, enumeración) están cerrados, verificados con pruebas reales
y desplegados. El frontend es **funcional y visualmente muy cuidado**, pero arrastra
deuda de arquitectura (monolito + módulos duplicados) que conviene pagar antes de
seguir agregando features.

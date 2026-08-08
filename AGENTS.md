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

### Pendiente (según QUE_FALTA_Y_QUE_MEJORAR.md)
- Integrar con API real para persistencia (reportes)
- Almacenamiento local (localStorage)
- Notificaciones en tiempo real
- Exportación a PDF
- Sistema de chat interno
- Soporte para archivos adjuntos / evidencia
- Indicadores de SLA
- Refactorizar index.html (muy grande, 640KB)
- Desacoplar sendReport/updateReportResponse del DOM

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

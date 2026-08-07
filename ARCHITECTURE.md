# 🏗️ Arquitectura - Distrito Streaming

## Visión General

Distrito Streaming es una aplicación web SPA (Single Page Application) construida con vanilla JavaScript, CSS y HTML. No utiliza frameworks modernos para mantener simplicidad y rendimiento.

## Estructura de Archivos

```
distri-stream/
├── index.html              # Archivo principal (~8755 líneas)
│   ├── CSS inline          # Estilos globales
│   ├── JavaScript inline  # Lógica principal
│   └── Templates HTML      # Componentes dinámicos
│
├── src/                    # Módulos JavaScript (nuevo)
│   ├── app.js             # Core de aplicación
│   ├── utils.js           # Utilidades reutilizables
│   ├── components.js      # Componentes UI
│   └── tests/             # Tests unitarios
│
├── reports-*.js           # Módulos de reportes
├── support-*.js          # Módulo de soporte
├── *.css                  # Hojas de estilos
└── sw.js                  # Service Worker (PWA)
```

## Capas de la Aplicación

### 1. Presentación (HTML/CSS)
- Templates inline en JavaScript
- Estilos con variables CSS (custom properties)
- Diseño responsive con media queries

### 2. Lógica de Negocio (JavaScript)
- Estado global (`state` object)
- Funciones de rendering
- Gestión de eventos
- Validaciones

### 3. Datos (Supabase)
- Backend como servicio (BaaS)
- API REST via Supabase
- Autenticación
- Base de datos PostgreSQL

## Modelo de Datos

### Usuarios
```javascript
{
  id: string,
  name: string,
  email: string,
  role: 'user' | 'operator' | 'admin',
  phone: string,
  balance: number,
  created_at: timestamp
}
```

### Cuentas
```javascript
{
  id: string,
  user_id: string,
  product_name: string,
  credentials: string,
  status: 'active' | 'expired' | 'suspended',
  expires_at: timestamp,
  created_at: timestamp
}
```

### Reportes
```javascript
{
  id: string,
  user_id: string,
  order_id: string,
  reason: string,
  description: string,
  status: 'Abierto' | 'En revisión' | 'En proceso' | 'Resuelto' | 'Rechazado',
  created_at: timestamp,
  updated_at: timestamp
}
```

## Flujo de Datos

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│          index.html (SPA)           │
│  ┌───────────────────────────────┐  │
│  │      Estado Global (state)    │  │
│  │  - user, orders, reports     │  │
│  │  - currentView, filters      │  │
│  └───────────────────────────────┘  │
│                 │                    │
│                 ▼                    │
│  ┌───────────────────────────────┐  │
│  │     Funciones de Render       │  │
│  │  - renderNav(), renderHome()  │  │
│  │  - renderReports(), etc.      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Supabase API  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         └─────────────────┘
```

## Sistema de Vistas

La aplicación usa un sistema de navegación simple basado en funciones:

```javascript
// Navegación
function setView(view) {
  state.currentView = view;
  render();
}

// Vistas disponibles
const views = {
  home: renderHome,
  orders: renderOrders,
  reports: renderReports,
  admin: renderAdmin
};
```

## Módulos Externos

### reports-functions.js
- `getReportCategory()` - Obtiene categoría del reporte
- `getReportPriority()` - Calcula prioridad
- `renderTableTracker()` - Renderiza tracker de tabla

### reports-security.js
- `escapeHTML()` - Previene XSS
- `sanitizeHTML()` - Sanitiza HTML
- `isReportOwner()` - Verifica propiedad

### reports-optimizations.js
- `ReportStatsCache` - Cache de estadísticas
- Memoización de funciones frecuentes

### support-operators-simple.js
- Panel de soporte premium
- `reportsUserSimple()` - Render principal
- `verDetalleSoporte()` - Modal de detalle

## PWA (Progressive Web App)

```javascript
// Service Worker (sw.js)
- Cache de assets estáticos
- Offline fallback
- Notificaciones push (futuro)
```

## Seguridad

### XSS Prevention
```javascript
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Permisos por Rol
```javascript
function canAccess(user, resource) {
  const permissions = {
    admin: ['*'],
    operator: ['orders', 'reports'],
    user: ['own_orders', 'own_reports']
  };
  return permissions[user.role].includes(resource);
}
```

## Rendimiento

### Optimizaciones Implementadas
1. **Cache de estadísticas** - 5 segundos
2. **Debounce en búsqueda** - 300ms
3. **Lazy loading de imágenes** - IntersectionObserver
4. **Componentes mínimos** - Solo lo necesario

### Métricas Target
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

## Deployment

### Vercel (Producción)
```
vercel.json → Configura output directory
GitHub → Auto-deploy on push
```

### Flujo CI/CD
```
Push → GitHub → Vercel → Deploy Preview → Merge → Deploy Production
```

## Futuras Mejoras

1. **TypeScript** - Tipado estático
2. **Bundler** - Webpack o Vite
3. **Testing** - Jest + Playwright
4. **State Management** - Jotai o Zustand
5. **Componentes** - Web Components

## Glosario

| Término | Descripción |
|---------|-------------|
| SPA | Single Page Application |
| BaaS | Backend as a Service |
| PWA | Progressive Web App |
| XSS | Cross-Site Scripting |
| CSP | Content Security Policy |

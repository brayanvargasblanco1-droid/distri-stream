# 🚀 Distrito Streaming

Plataforma de gestión empresarial para distribuidores de servicios de streaming.

## 📋 Descripción

Sistema de gestión de usuarios, operadores y administradores para la venta y administración de cuentas de streaming (Netflix, Spotify, Disney+, etc.).

## 🏗️ Arquitectura

```
distri-stream/
├── index.html              # Aplicación principal (638KB)
├── src/
│   ├── app.js             # Aplicación core
│   ├── utils.js           # Utilidades
│   ├── components.js      # Componentes UI
│   └── tests/             # Tests
├── reports-*.js           # Módulos de reportes
├── support-*.js           # Módulo de soporte
├── *.css                  # Estilos
└── vercel.json            # Configuración Vercel
```

## 🎯 Roles

| Rol | Descripción |
|-----|-------------|
| **Usuario** | Puede comprar cuentas, ver sus pedidos, crear reportes |
| **Operador** | Gestiona pedidos, actualiza estados, responde reportes |
| **Admin** | Control total, gestión de usuarios, configuraciones |

## 📦 Módulos

### Core
- `src/app.js` - Inicialización y estado global
- `src/utils.js` - Funciones helper (escapeHTML, formatMoney, etc.)
- `src/components.js` - UI components reutilizables

### Reportes
- `reports-functions.js` (49KB) - Lógica de reportes
- `reports-security.js` (18KB) - Validaciones y seguridad
- `reports-optimizations.js` (15KB) - Cache y optimizaciones
- `reports-monkey-patch.js` (8KB) - Parches de seguridad

### Soporte
- `support-operators-simple.js` (18KB) - Panel de soporte premium
- `support-operators.css` (8KB) - Estilos de soporte

## 🚀 Deployment

El proyecto se despliega automáticamente desde GitHub a Vercel.

```bash
# Push a main para producción
git push origin main

# Push a rama feature para preview
git push origin feature-nueva-funcion
```

## 🔧 Desarrollo Local

```bash
# Clonar
git clone https://github.com/vargasblancobrayan-cyber/distri-stream.git
cd distri-stream

# Abrir en navegador
open index.html
```

## 🧪 Testing

Ejecuta los tests desde la consola del navegador:

```javascript
// Ejecutar tests rápidos
runQuickTest();

// Ver resultados
TestRunner.results
```

O añade `?test` a la URL.

## 🔐 Seguridad

- ✅ Escape de HTML en todas partes
- ✅ Validación de permisos por rol
- ✅ Control de acceso a recursos
- ✅ Tokens de sesión seguros

## 📱 Responsive

- ✅ Mobile (< 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (> 1024px)

## 🌐 URLs

- **Producción:** https://distrito-streaming-vercel-ashen.vercel.app/
- **Repositorio:** https://github.com/vargasblancobrayan-cyber/distri-stream

## 📄 Licencia

Privado - Todos los derechos reservados

---

**Versión:** 2.0
**Última actualización:** 2026

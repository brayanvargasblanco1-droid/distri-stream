# Guía de Integración - Mejoras de Reportes y Soporte

## 📋 Archivos Creados

1. **reports-styles.css** - Estilos mejorados y responsivos
2. **reports-functions.js** - Funciones JavaScript nuevas y mejoradas
3. **IMPROVEMENTS.md** - Documentación de mejoras

## 🚀 Pasos de Integración

### Paso 1: Incluir los archivos CSS y JS

En el `<head>` del index.html, DESPUÉS de los estilos existentes, añade:

```html
<!-- Estilos mejorados para reportes -->
<link rel="stylesheet" href="reports-styles.css">
```

Al final del `<body>`, ANTES del cierre, añade:

```html
<!-- Funciones mejoradas para reportes -->
<script src="reports-functions.js"></script>
```

### Paso 2: Usar las nuevas funciones en reportsUser()

REEMPLAZA la función `reportsUser()` existente con esta versión mejorada:

```javascript
function reportsUser(){
  const my = state.reports || [];
  
  // Ordenar reportes: sin resolver primero
  my.sort((a, b) => {
    const aResolved = a.status === "Resuelto" || a.status === "Rechazado";
    const bResolved = b.status === "Resuelto" || b.status === "Rechazado";
    if (aResolved === bResolved) return new Date(b.created_at) - new Date(a.created_at);
    return aResolved ? 1 : -1;
  });
  
  return `
    <div class="page-container">
      <div class="premium-label">Mis Reportes y Soporte</div>
      <div class="card">
        <h2>Seguimiento de Reportes</h2>
        <p class="muted">Visualiza el estado de tus reportes y recibe actualizaciones en tiempo real</p>
        
        ${my.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:12px">📋</div>
            <p style="font-size:14px;font-weight:700;margin-bottom:6px">No tienes reportes aún</p>
            <p class="muted">Si experimentas problemas con una compra, puedes crear un reporte aquí</p>
            <button class="primary" onclick="setView('orders')" style="margin-top:14px">
              Ir a mis compras
            </button>
          </div>
        ` : `
          <div id="reportsList" style="margin-top:16px">
            ${my.map(r => generateReportCard(r)).join('')}
          </div>
        `}
      </div>

      <!-- SECCIÓN DE CREAR REPORTE -->
      <div class="card" style="margin-top:20px">
        <h2>Crear Nuevo Reporte</h2>
        <p class="muted">¿Tienes un problema con una compra? Cuéntanos aquí</p>
        <div id="newReportContainer"></div>
      </div>
    </div>
  `;
}
```

### Paso 3: Actualizar función boot() para cargar reports-functions.js

Asegúrate que en la función `boot()` después de cargar datos se llame a renderReports():

```javascript
// En la función boot(), después de obtener datos:
await api("reports").then(r => { state.reports = r; });
```

### Paso 4: Reemplazar `reportRowsUser()` con versión mejorada

```javascript
function reportRowsUser(rows){
  if(!rows || rows.length === 0) {
    return `<p class="muted">Sin reportes enviados.</p>`;
  }
  
  return rows.map(r => generateReportCard(r)).join('');
}
```

### Paso 5: Mejorar modal de crear reporte

Cuando se clickea "Reportar" en una compra, usa la nueva función:

```javascript
// Buscar donde se abre el modal de reporte
// Y reemplazar el contenido con:

const html = generateReportForm(selectedOrder);
openModal(`<div class="dialog-head">
  <div><small class="muted">CREAR REPORTE</small><h2>Reportar Problema</h2></div>
  <button class="close" onclick="closeModal()">&times;</button>
</div>${html}`);
```

### Paso 6: Optimizaciones en admin view

Para la vista de admin (`reportsAdmin()`), utiliza:

```javascript
function reportTableRows(rows){
  if(!rows || !rows.length) return `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
    <div style="font-size:14px;font-weight:600;margin-bottom:4px">Sin reportes</div>
    <div style="font-size:12px">Los reportes aparecerán aquí</div>
  </td></tr>`;
  
  return rows.map(r => generateReportTableRowImproved(r)).join('');
}
```

## 🎨 Cambios en Estilos CSS Incluidos

- ✅ Badges de categoría con colores
- ✅ Badges de prioridad con animaciones
- ✅ Progress bar visual del estado
- ✅ Timeline de eventos
- ✅ Tarjetas mejoradas con hover effects
- ✅ Formulario profesional con validación visual
- ✅ Selector de categoría grid
- ✅ Soporte para adjuntos
- ✅ Responsive en mobile

## 📱 Características Nuevas

### Para Usuarios
- ✅ Ver categoría del reporte
- ✅ Ver prioridad (Normal/Urgente/Crítico)
- ✅ Timeline visual del progreso
- ✅ Contador de mensajes y adjuntos
- ✅ Formulario mejorado con categorías
- ✅ Contador de caracteres
- ✅ Adjuntar evidencia
- ✅ Descargar reporte en PDF

### Para Admin
- ✅ Tabla mejorada con badges de prioridad
- ✅ Indicador visual de urgencia
- ✅ Categorización clara
- ✅ Datos más legibles
- ✅ Acciones rápidas

## 🔗 Variables de Datos Esperadas

Asegúrate que cada reporte tiene estos campos:

```javascript
{
  id: "string",
  code: "string", // Ej: "RP-001"
  product_name: "string",
  category: "producto_no_llego|defectuoso|cuenta_no_funciona|acceso_denegado|otro",
  reason: "string",
  description: "string",
  status: "Abierto|En revisión|En proceso|Resuelto|Rechazado",
  created_at: "ISO datetime",
  updated_at: "ISO datetime",
  messages: [{ sender, text, timestamp }],
  attachments: [{ url, name }],
  timeline: [{ event, timestamp, actor }]
}
```

## ✅ Checklist de Integración

- [ ] Copiar `reports-styles.css` y `reports-functions.js` al directorio raíz
- [ ] Incluir el link a CSS en `<head>`
- [ ] Incluir el script en `<body>`
- [ ] Actualizar función `reportsUser()`
- [ ] Actualizar función `reportRowsUser()`
- [ ] Actualizar función `reportTableRows()` (admin)
- [ ] Probar en navegador
- [ ] Verificar responsive en móvil
- [ ] Ajustar colores si es necesario
- [ ] Hacer commit a git

## 🎯 Próximas Mejoras (Fase 2)

1. Sistema de chat en tiempo real
2. Upload de archivos mejorado
3. Generación de PDF con detalles
4. Notificaciones push
5. Historial completo de eventos
6. Asignación de reportes a admin
7. Respuestas predefinidas
8. Analytics y métricas

## 📞 Soporte

Si tienes dudas sobre la integración, revisa los archivos de ejemplo o contacta al equipo de desarrollo.

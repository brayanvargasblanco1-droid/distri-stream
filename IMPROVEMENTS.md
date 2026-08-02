# Mejoras para Sección de Reportes y Soporte - Distrito Streaming

## 1. NUEVAS FUNCIONALIDADES

### A. Categorías de Reportes
- Producto no llegó
- Producto defectuoso/No funciona
- Cuenta no funciona
- Acceso denegado
- Otro

### B. Pipeline Visual de Estado
Estados con progreso visual:
1. Abierto (Nuevo)
2. En revisión (Admin revisando)
3. En proceso (Resolviendo)
4. Resuelto (Completado)
5. Rechazado (No válido)

### C. Timeline de Eventos
- Creación del reporte
- Cambios de estado
- Comentarios/Respuestas del admin
- Fechas y horas exactas

### D. Soporte para Archivos Adjuntos
- Upload de imágenes/evidencia
- Galería de archivos
- Descarga de respuestas

### E. Sistema de Chat/Mensajes
- Comunicación directa en reporte
- Notificaciones en tiempo real
- Historial completo

### F. Indicadores de SLA
- Tiempo de respuesta promedio
- Urgencia del reporte
- Tiempo transcurrido
- Etiqueta "Urgente" si > 24 horas

### G. Mejoras de Diseño
- Tarjetas con mejor espaciado
- Colores según estado
- Iconos descriptivos
- Responsive mejorado
- Animaciones suaves

### H. Exportación Mejorada
- PDF con logo y detalles
- Excel con información completa
- Filtros avanzados

## 2. ESTRUCTURA DE DATOS MEJORADA

```javascript
Report = {
  id: String,
  code: String,
  user_id: String,
  order_id: String,
  product_name: String,
  category: "producto_no_llego" | "defectuoso" | "cuenta_no_funciona" | "acceso_denegado" | "otro",
  reason: String,
  description: String,
  account_data: String,
  status: "Abierto" | "En revisión" | "En proceso" | "Resuelto" | "Rechazado",
  priority: "Normal" | "Urgente" | "Crítico",
  created_at: DateTime,
  updated_at: DateTime,
  resolved_at: DateTime,
  provider_response: String,
  attachments: Array<{url, name, type, uploaded_at}>,
  messages: Array<{sender, text, timestamp, attachments}>,
  timeline: Array<{event, status, timestamp, actor}>,
  response_time_hours: Number,
  severity: Number (1-5)
}
```

## 3. CAMBIOS EN EL CÓDIGO

### Nuevos campos en HTML
- Indicador de urgencia
- Botones de acción mejorados
- Componentes de timeline
- Selector de categoría
- Área de chat/mensajes
- Selector de archivos

### Nuevas funciones JavaScript
```
- getCategoryLabel(category)
- getStatusColor(status)
- getStatusIcon(status)
- calculateResponseTime(created_at, updated_at)
- formatTimeline(events)
- uploadReportAttachment(reportId, file)
- sendReportMessage(reportId, message)
- markReportAsUrgent(reportId)
- generateReportPDF(reportId)
```

### Estilos CSS nuevos
```
- .report-status-badge
- .report-priority-badge
- .report-timeline
- .report-message
- .report-attachment-card
- .status-progress-bar
- .urgency-indicator
```

## 4. MEJORAS VISUALES

### Para Usuario Final
- Timeline visual del proceso
- Estimado de tiempo de respuesta
- Indicador de urgencia
- Histórico de mensajes
- Evidencia adjunta
- Estado en tiempo real

### Para Admin
- Dashboard con métricas
- Alertas de reportes urgentes
- Filtrado avanzado
- Asignación de reportes
- Respuestas rápidas predeterminadas
- Exportación de datos

## 5. NEXT STEPS
1. Implementar estructura de datos mejorada en backend
2. Actualizar funciones JavaScript
3. Mejorar CSS y diseño
4. Agregar validaciones
5. Implementar sistema de archivos
6. Agregar chat en tiempo real
7. Testing y optimización
8. Deployment

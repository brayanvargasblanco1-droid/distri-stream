# 🔒 IMPLEMENTACIÓN DE SEGURIDAD - TIER 1

## ✅ Estado Actual

Se ha creado un **archivo de seguridad completo** (`reports-security.js`) con:

1. ✅ **Escapado de HTML** - Previene XSS
2. ✅ **Validación de permisos** - Controla acceso
3. ✅ **Confirmaciones de acciones** - Previene accidentes
4. ✅ **Validación de datos** - Previene datos inválidos

---

## 📁 Archivos Creados/Modificados

### Nuevo: `reports-security.js` (17.2 KB)
- **escapeHTML()** - Escapa caracteres peligrosos
- **sanitizeHTML()** - Sanitiza HTML permitiendo solo etiquetas seguras
- **isCurrentUserAdmin()** - Verifica si es admin
- **checkReportPermission()** - Valida permisos por acción
- **ReportValidator** - Objeto centralizado de validaciones
- **confirmAction()** - Pide confirmación de acciones destructivas
- **sendReportSecure()** - Envía reporte con validaciones
- **updateReportSecure()** - Actualiza reporte seguramente
- **deleteReportSecure()** - Elimina reporte con confirmación
- **exportReportsSecure()** - Exporta reportes validando permisos
- **Funciones Safe** - Generan HTML escapado

### Actualizado: `index.html`
- Se cargó `reports-security.js` ANTES que otros scripts
- Orden correcto: seguridad → funciones → monkey-patch → bootstrap

---

## 🔐 GUÍA DE IMPLEMENTACIÓN

### PASO 1: Reemplazar función `sendReport()`

**ANTES (Inseguro):**
```javascript
function sendReport(orderId) {
  const reason = document.getElementById('rpSubject')?.value;
  const description = document.getElementById('rpDesc')?.value;
  
  if (!reason || !description) {
    toast('Por favor completa todos los campos', 'bad');
    return;
  }
  
  // Enviar directamente sin validación
  api('reports', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      reason: reason,
      description: description
    })
  });
}
```

**DESPUÉS (Seguro):**
```javascript
async function sendReport(orderId) {
  try {
    // 1. Obtener datos del formulario
    const formData = {
      reason: document.getElementById('rpSubject')?.value,
      description: document.getElementById('rpDesc')?.value,
      category: document.querySelector('input[name="category"]:checked')?.value,
      accountData: document.getElementById('rpAccountData')?.value
    };
    
    // 2. Usar la función segura con validaciones
    await sendReportSecure(orderId, formData);
    
    // 3. Si llegó aquí, enviar a la API
    const response = await api('reports', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        reason: escapeHTML(formData.reason),  // ← ESCAPAR
        description: escapeHTML(formData.description),
        category: formData.category,
        account_data: formData.accountData
      })
    });
    
    toast('Reporte enviado correctamente', 'ok');
    
  } catch (error) {
    toast(error.message, 'bad');
  }
}
```

### PASO 2: Reemplazar función `deleteReport()`

**ANTES (Inseguro):**
```javascript
function deleteReport(reportId) {
  // Sin verificar permisos ni pedir confirmación
  api(`reports/${reportId}`, { method: 'DELETE' });
  toast('Reporte eliminado', 'ok');
}
```

**DESPUÉS (Seguro):**
```javascript
async function deleteReport(reportId) {
  try {
    // 1. Verificar permisos
    if (!checkReportPermission('delete', reportId)) {
      throw new Error('No tienes permisos para eliminar reportes');
    }
    
    // 2. Obtener info del reporte para mostrar en confirmación
    const report = (window.globalReports || []).find(r => r.id === reportId);
    
    // 3. Pedir confirmación
    const confirmed = await confirmAction('delete', report);
    if (!confirmed) {
      toast('Acción cancelada', 'ok');
      return;
    }
    
    // 4. Eliminar
    await api(`reports/${reportId}`, { method: 'DELETE' });
    toast('Reporte eliminado correctamente', 'ok');
    
  } catch (error) {
    toast(error.message, 'bad');
  }
}
```

### PASO 3: Reemplazar función `resolveReport()`

**ANTES (Inseguro):**
```javascript
function resolveReport(reportId) {
  // Sin validar datos ni pedir confirmación
  const response = document.getElementById('adminResponse').value;
  api(`reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Resuelto', response })
  });
}
```

**DESPUÉS (Seguro):**
```javascript
async function resolveReport(reportId) {
  try {
    // 1. Verificar permisos (solo admin)
    if (!checkReportPermission('update', reportId)) {
      throw new Error('Solo administradores pueden resolver reportes');
    }
    
    // 2. Obtener respuesta del formulario
    const response = document.getElementById('adminResponse')?.value;
    
    // 3. Validar datos
    ReportValidator.validateUpdate({
      status: 'Resuelto',
      response: response
    });
    
    // 4. Pedir confirmación
    const report = (window.globalReports || []).find(r => r.id === reportId);
    const confirmed = await confirmAction('resolve', report);
    if (!confirmed) {
      throw new Error('Acción cancelada');
    }
    
    // 5. Enviar actualización
    await api(`reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Resuelto',
        response: escapeHTML(response)  // ← ESCAPAR
      })
    });
    
    toast('Reporte resuelto correctamente', 'ok');
    
  } catch (error) {
    toast(error.message, 'bad');
  }
}
```

### PASO 4: Reemplazar función `exportReportsCsv()`

**ANTES (Insecuro):**
```javascript
function exportReportsCsv() {
  // Sin verificar si es admin
  const reports = window.reports || [];
  let csv = 'ID,Código,Cliente,Estado\n';
  
  reports.forEach(r => {
    csv += `"${r.id}","${r.code}","${r.client_name}","${r.status}"\n`;
  });
  
  // Descargar sin auditoría
  downloadCSV(csv, 'reportes.csv');
}
```

**DESPUÉS (Seguro):**
```javascript
async function exportReportsCsv() {
  try {
    // 1. Verificar permisos
    if (!checkReportPermission('export')) {
      throw new Error('Solo administradores pueden exportar reportes');
    }
    
    // 2. Obtener reportes
    const reports = window.globalReports || [];
    
    // 3. Pedir confirmación
    const confirmed = await confirmAction('export', { 
      count: reports.length 
    });
    if (!confirmed) {
      throw new Error('Exportación cancelada');
    }
    
    // 4. Generar CSV escapando datos
    let csv = 'ID,Código,Cliente,Razón,Estado,Fecha\n';
    reports.forEach(r => {
      csv += `"${escapeHTML(r.id)}",`;
      csv += `"${escapeHTML(r.code)}",`;
      csv += `"${escapeHTML(r.client_name)}",`;
      csv += `"${escapeHTML(r.reason)}",`;
      csv += `"${escapeHTML(r.status)}",`;
      csv += `"${escapeHTML(r.created_at)}"\n`;
    });
    
    // 5. Descargar
    downloadCSV(csv, 'reportes.csv');
    
    console.log(`✅ ${reports.length} reportes exportados por ${getCurrentUserId()}`);
    
  } catch (error) {
    toast(error.message, 'bad');
  }
}
```

### PASO 5: Reemplazar función `openReportDetail()`

**ANTES (Inseguro - Inyección XSS):**
```javascript
function openReportDetail(reportId) {
  const report = window.reports.find(r => r.id === reportId);
  
  openModal(`
    <h3>${report.reason}</h3>  <!-- ⚠️ Sin escapar -->
    <p>${report.description}</p>  <!-- ⚠️ Sin escapar -->
    <div>${report.response}</div>  <!-- ⚠️ Sin escapar -->
  `);
}
```

**DESPUÉS (Seguro):**
```javascript
function openReportDetail(reportId) {
  // 1. Verificar permisos
  if (!checkReportPermission('read', reportId)) {
    toast('No tienes permisos para ver este reporte', 'bad');
    return;
  }
  
  // 2. Obtener reporte
  const report = (window.globalReports || []).find(r => r.id === reportId);
  
  if (!report) {
    toast('Reporte no encontrado', 'bad');
    return;
  }
  
  // 3. Generar HTML seguro
  const html = generateReportDetailSafe(report);
  
  // 4. Mostrar
  openModal(html);
}
```

---

## ✨ FUNCIONES DISPONIBLES

### Para Validar Datos

```javascript
// Validar nuevo reporte
try {
  ReportValidator.validateNew({
    reason: "Producto no llegó",
    description: "Compré el 30/7 y no ha llegado",
    category: "producto_no_llego",
    order_id: "ORD-123"
  });
  console.log("✅ Datos válidos");
} catch (error) {
  console.error("❌ Error:", error.message);
}

// Validar actualización
try {
  ReportValidator.validateUpdate({
    status: "Resuelto",
    response: "Tu reporte fue resuelto exitosamente"
  });
} catch (error) {
  console.error("❌ Error:", error.message);
}
```

### Para Escapar Datos

```javascript
// Escapar un texto que entra del usuario
const userInput = '<img src=x onerror=alert("XSS")>';
const safe = escapeHTML(userInput);
console.log(safe); // &lt;img src=x onerror=alert("XSS")&gt;

// Generar HTML seguro
const safeCard = generateReportCardSafe(report);
```

### Para Verificar Permisos

```javascript
// Verificar si el usuario es admin
if (isCurrentUserAdmin()) {
  console.log("Eres administrador");
}

// Verificar permisos específicos
if (checkReportPermission('delete', reportId)) {
  console.log("Puedes eliminar este reporte");
}

// Obtener ID del usuario
const userId = getCurrentUserId();
console.log("Tu ID es:", userId);

// Verificar si eres propietario
if (isReportOwner(reportId, userId)) {
  console.log("Este es tu reporte");
}
```

### Para Mostrar Confirmaciones

```javascript
// Mostrar confirmación personalizada
const confirmed = await confirmAction('delete', {
  code: 'RP-4766'
});

if (confirmed) {
  console.log("Usuario confirmó");
} else {
  console.log("Usuario canceló");
}
```

---

## 🔍 CHECKLIST DE IMPLEMENTACIÓN

Reemplaza estas funciones en el archivo que las tenga (probablemente en los scripts inline del HTML):

- [ ] **sendReport()** → Usar `sendReportSecure()`
- [ ] **deleteReport()** → Verificar permisos + pedir confirmación
- [ ] **resolveReport()** → Verificar permisos + pedir confirmación + validar datos
- [ ] **exportReportsCsv()** → Verificar permisos + pedir confirmación
- [ ] **openReportDetail()** → Verificar permisos + escapar HTML
- [ ] **reportTableRows()** → Usar `generateReportTableRowSafe()`
- [ ] **reportRowsUser()** → Usar `generateReportCardSafe()`
- [ ] **openReportChat()** → Verificar permisos

---

## 🚀 PRÓXIMA FASE

Después de implementar estas funciones TIER 1, sigue con:

**TIER 2: Separar Activos/Resueltos** (8 horas)
- Crear dos secciones separadas
- Mostrar detalles de resolución
- Agregar fechas exactas

**Archivos necesarios:**
- `reports-functions.js` - Ya tiene la lógica, solo usar las funciones Safe
- Actualizar HTML que renderiza reportes

---

## 📞 SOPORTE

Si necesitas ayuda:

1. **¿Cómo escapa HTML?** → Ver función `escapeHTML()`
2. **¿Cómo verifico permisos?** → Usar `checkReportPermission()`
3. **¿Cómo pido confirmación?** → Usar `await confirmAction()`
4. **¿Cómo valido datos?** → Usar `ReportValidator.validateNew()`

---

## ✅ STATUS

| Tarea | Status | Archivo |
|-------|--------|---------|
| Escapar HTML | ✅ | reports-security.js |
| Validar permisos | ✅ | reports-security.js |
| Confirmaciones | ✅ | reports-security.js |
| Validar datos | ✅ | reports-security.js |
| Cargar en HTML | ✅ | index.html |

---

**Commit:** Pendiente (después de implementar PASO 1-5)  
**Tiempo estimado:** 2-3 horas si hay API backend lista  
**Prioridad:** 🔴 CRÍTICA - Seguridad

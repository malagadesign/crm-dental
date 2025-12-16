# Archivos Temporales y de Debug - Lista para Eliminar

## ⚠️ IMPORTANTE

Estos archivos fueron creados para debugging y solución de problemas. **DEBEN ELIMINARSE del servidor** después de usarlos por razones de seguridad. Cualquiera puede acceder a estos archivos y obtener información sensible del sistema.

---

## 📋 Lista de Archivos a Eliminar

### 1. `clear-cache.php`
**Ubicación:** `/crm/clear-cache.php` (raíz del proyecto)

**Propósito:** Script para limpiar el cache de Laravel sin acceso SSH.

**Cuándo eliminar:** Después de ejecutarlo una vez y verificar que el cache se limpió correctamente.

**Cómo eliminar:**
- Vía FTP: Eliminar el archivo desde el servidor
- Vía Git: `git rm clear-cache.php && git commit -m "Remove temporary cache script" && git push`

---

### 2. `view-logs.php`
**Ubicación:** `/crm/view-logs.php` (raíz del proyecto)

**Propósito:** Script para ver los logs de Laravel desde el navegador.

**Cuándo eliminar:** Después de revisar los logs y diagnosticar el problema.

**Cómo eliminar:**
- Vía FTP: Eliminar el archivo desde el servidor
- Vía Git: `git rm view-logs.php && git commit -m "Remove temporary log viewer" && git push`

---

### 3. `check-routes.php`
**Ubicación:** `/crm/check-routes.php` (raíz del proyecto)

**Propósito:** Script para verificar qué rutas están registradas en Laravel.

**Cuándo eliminar:** Después de verificar que las rutas se registran correctamente.

**Cómo eliminar:**
- Vía FTP: Eliminar el archivo desde el servidor
- Vía Git: `git rm check-routes.php && git commit -m "Remove temporary routes checker" && git push`

---

### 4. `debug-request.php`
**Ubicación:** `/crm/debug-request.php` (raíz del proyecto)

**Propósito:** Script de debug avanzado para diagnosticar problemas de routing y requests.

**Cuándo eliminar:** Después de diagnosticar y solucionar el problema de rutas POST.

**Cómo eliminar:**
- Vía FTP: Eliminar el archivo desde el servidor
- Vía Git: `git rm debug-request.php && git commit -m "Remove temporary debug script" && git push`

---

### 5. `debug-error.php`
**Ubicación:** `/crm/debug-error.php` (raíz del proyecto)

**Propósito:** Script de debugging para capturar errores de la aplicación.

**Cuándo eliminar:** Después de solucionar todos los problemas y verificar que la aplicación funciona correctamente.

**Cómo eliminar:**
- Vía FTP: Eliminar el archivo desde el servidor
- Vía Git: `git rm debug-error.php && git commit -m "Remove temporary error debug script" && git push`

---

## 🗑️ Eliminar Todos los Archivos de Una Vez

Si querés eliminar todos los archivos temporales de una vez:

### Opción 1: Vía Git (Recomendado)
```bash
git rm clear-cache.php view-logs.php check-routes.php debug-request.php debug-error.php
git commit -m "Remove all temporary debug scripts"
git push
```

### Opción 2: Vía FTP
1. Conectate al servidor vía FTP
2. Navegá a `/public_html/crm/` (o donde esté el proyecto)
3. Eliminá los siguientes archivos:
   - `clear-cache.php`
   - `view-logs.php`
   - `check-routes.php`
   - `debug-request.php`
   - `debug-error.php`

---

## ✅ Verificación

Después de eliminar los archivos, verificá que no estén accesibles:

1. Intentá acceder a cada URL:
   - `https://agoradental.com.ar/crm/clear-cache.php` → Debe dar 404
   - `https://agoradental.com.ar/crm/view-logs.php` → Debe dar 404
   - `https://agoradental.com.ar/crm/check-routes.php` → Debe dar 404
   - `https://agoradental.com.ar/crm/debug-request.php` → Debe dar 404
   - `https://agoradental.com.ar/crm/debug-error.php` → Debe dar 404

2. Si alguno todavía es accesible, verificá que lo hayas eliminado correctamente del servidor.

---

## 📝 Notas de Seguridad

- **NUNCA** dejés estos archivos en producción
- Estos archivos pueden exponer información sensible:
  - Logs del sistema
  - Configuración de rutas
  - Información del servidor
  - Stack traces con rutas de archivos

- Si necesitás estos scripts en el futuro, podés recrearlos desde el repositorio Git, pero **siempre eliminálos después de usarlos**.

---

## 🔄 Si Necesitás Usarlos Nuevamente

Si en el futuro necesitás alguno de estos scripts:

1. Podés recrearlos desde Git (si están en el repositorio)
2. O pedirle al desarrollador que los recree
3. **Recordá eliminarlos nuevamente después de usarlos**

---

## 📅 Checklist de Eliminación

Usá este checklist para asegurarte de eliminar todos los archivos:

- [ ] `clear-cache.php` eliminado
- [ ] `view-logs.php` eliminado
- [ ] `check-routes.php` eliminado
- [ ] `debug-request.php` eliminado
- [ ] `debug-error.php` eliminado
- [ ] Verificación de 404 en todas las URLs
- [ ] Commit realizado (si usaste Git)

---

**Última actualización:** 2025-12-15


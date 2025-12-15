# 📥 Instrucciones para Importar Turnos desde Excel

## Paso 1: Generar el archivo JSON desde Excel

### Opción A: Usar Python (Recomendado)

1. **Instala las dependencias de Python:**
   ```bash
   pip3 install pandas openpyxl
   ```

2. **Ejecuta el script:**
   ```bash
   python3 import_turnos.py
   ```

3. **Se generará el archivo:** `turnos_2025_import.json`

### Opción B: Usar el script original mejorado

Si prefieres usar tu script original, asegúrate de que genere un JSON con este formato:

```json
[
  {
    "nombre": "Juan Pérez",
    "fecha_hora": "2025-01-15 10:00:00"
  }
]
```

## Paso 2: Importar a la Base de Datos

### Verificar configuración

Antes de importar, verifica:

1. **Consultorios:** Asegúrate de tener al menos un consultorio creado
   - Ve a: **Odontólogos** → **Consultorios**
   - O ejecuta: `php artisan tinker` y verifica con `App\Models\Clinic::all()`

2. **Odontólogos:** Asegúrate de tener al menos un odontólogo
   - Ve a: **Odontólogos**
   - O verifica con: `App\Models\User::all()`

### Ejecutar la importación

#### Modo de prueba (Dry-run):

Primero prueba sin guardar datos reales:

```bash
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan appointments:import turnos_2025_import.json --clinic=1 --user=1 --dry-run
```

#### Importación real:

Si todo se ve bien, ejecuta sin `--dry-run`:

```bash
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan appointments:import turnos_2025_import.json --clinic=1 --user=1
```

### Parámetros del comando

- `turnos_2025_import.json` - Nombre del archivo JSON (por defecto)
- `--clinic=1` - ID del consultorio (por defecto: 1)
- `--user=1` - ID del odontólogo (por defecto: 1)
- `--dry-run` - Modo de prueba (no guarda datos)

### Ejemplo con diferentes IDs:

```bash
# Importar al Consultorio 2, Odontólogo 2
php artisan appointments:import turnos_2025_import.json --clinic=2 --user=2

# Importar con archivo diferente
php artisan appointments:import mi_archivo.json --clinic=1 --user=1
```

## 📊 Qué hace la importación

1. **Lee el archivo JSON** con los turnos
2. **Crea pacientes** si no existen (buscando por nombre)
3. **Crea turnos** con:
   - Fecha y hora del Excel
   - Estado: "Asistió" (por ser histórico)
   - Consultorio y Odontólogo especificados
   - Duración: 30 minutos (por defecto)
4. **Evita duplicados** (no crea turnos que ya existen)
5. **Muestra estadísticas** al finalizar

## 🔍 Limpieza de Nombres

El script Python limpia automáticamente:

- ✅ Elimina DNI: "Juan Pérez DNI 12345678" → "Juan Pérez"
- ✅ Elimina teléfonos: "María García (11) 1234-5678" → "María García"
- ✅ Normaliza formato: "juan perez" → "Juan Perez"
- ✅ Elimina guiones y datos extras

## ⚠️ Notas Importantes

1. **Backup:** Haz un backup de tu base de datos antes de importar
2. **Prueba primero:** Siempre usa `--dry-run` primero
3. **Pacientes duplicados:** El sistema busca pacientes por nombre similar para evitar duplicados
4. **Turnos duplicados:** Si un turno ya existe (mismo paciente, misma fecha/hora, mismo consultorio), se omite

## 📝 Verificar la Importación

Después de importar:

1. Ve a **Turnos** → Verifica que aparezcan los turnos importados
2. Ve a **Pacientes** → Verifica que se hayan creado los nuevos pacientes
3. Usa los filtros para ver turnos por fecha

## 🔄 Si necesitas reimportar

Si quieres eliminar los turnos importados y volver a importar:

```bash
# En tinker
php artisan tinker

# Eliminar turnos importados
App\Models\Appointment::where('notes', 'Importado desde Excel 2025')->delete();
```

---

**¿Problemas?** Verifica los logs: `storage/logs/laravel.log`


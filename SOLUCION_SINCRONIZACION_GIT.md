# Solución para Problemas de Sincronización Git en el Hosting

## Problema

El hosting está configurado para sincronizar automáticamente con Git, pero está fallando con este error:

```
error: The following untracked working tree files would be overwritten by merge:
.htaccess
index.php
test-db.php
test-laravel-config.php
Please move or remove them before you can merge.
```

## Causa

Estos archivos existen en el servidor como archivos "untracked" (no rastreados por Git localmente), pero también existen en el repositorio remoto. Cuando Git intenta hacer `pull`, detecta que los archivos locales serían sobrescritos y aborta la operación por seguridad.

## Solución

### Opción 1: Ejecutar Script Automático (Recomendado)

Si tenés acceso SSH al servidor:

1. Conectate por SSH al servidor
2. Navegá al directorio del proyecto:
   ```bash
   cd /home/c2670660/public_html/crm
   ```
3. Ejecutá el script de corrección:
   ```bash
   bash fix-git-sync.sh
   ```

El script automáticamente:
- Elimina los archivos locales que están causando conflicto
- Hace `git pull` para traer las versiones correctas del repositorio
- Verifica que todo esté sincronizado

### Opción 2: Solución Manual

Si no tenés SSH, podés hacerlo manualmente desde el panel de control del hosting:

1. **Eliminar los archivos conflictivos:**
   - Eliminá estos archivos desde el administrador de archivos del hosting:
     - `.htaccess` (en la raíz de `/crm/`)
     - `index.php` (en la raíz de `/crm/`)
     - `test-db.php` (en la raíz de `/crm/`)
     - `test-laravel-config.php` (en la raíz de `/crm/`)

2. **Forzar la sincronización:**
   - Desde el panel de control del hosting, forzá una nueva sincronización Git
   - O esperá a que el sistema automático lo intente de nuevo

### Opción 3: Configurar Git para Sobrescribir (Solo si tenés SSH)

Si querés que Git sobrescriba automáticamente archivos locales en el futuro:

```bash
cd /home/c2670660/public_html/crm
git config pull.ff only
git config merge.ours.driver true
```

Luego forzá el pull:
```bash
git fetch origin
git reset --hard origin/main
```

**⚠️ ADVERTENCIA:** `git reset --hard` eliminará TODOS los cambios locales no guardados. Solo usalo si estás seguro de que no hay cambios importantes en el servidor.

## Prevención Futura

Para evitar este problema en el futuro:

1. **No crear archivos manualmente en el servidor** que también están en el repositorio
2. **Siempre hacer cambios vía Git** y luego hacer push/pull
3. **Si necesitás hacer cambios directos en el servidor**, asegurate de hacer commit de esos cambios antes de hacer pull

## Verificación

Después de resolver el conflicto, verificá que:

1. Los archivos existen y tienen el contenido correcto
2. La sincronización automática funciona (revisá los logs del hosting)
3. La aplicación funciona correctamente

## Archivos Afectados

Los archivos que estaban causando conflicto son:

- **`.htaccess`**: Configuración de Apache para el subdirectorio
- **`index.php`**: Front controller para servir Laravel desde subdirectorio
- **`test-db.php`**: Script de prueba de conexión a base de datos (puede eliminarse después de verificar)
- **`test-laravel-config.php`**: Script de prueba de configuración de Laravel (puede eliminarse después de verificar)

Todos estos archivos son necesarios para el funcionamiento de la aplicación en el subdirectorio `/crm/`.

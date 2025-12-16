# Solución: Error "Method Not Allowed" en Login

## 🔧 Problema

Al intentar hacer login, aparece el error:
```
The POST method is not supported for route admin/login. Supported methods: GET, HEAD.
```

## ✅ Soluciones

### Solución 1: Limpiar Cache de Rutas (Recomendado)

El problema más común es que el cache de rutas está desactualizado. En el servidor, ejecutá:

```bash
cd /public_html/crm
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

Si tenés acceso SSH, ejecutá estos comandos. Si no, podés crear un script temporal para limpiar el cache.

### Solución 2: Verificar APP_URL en .env

Asegurate de que en el `.env` del servidor tengas:

```env
APP_URL=https://agoradental.com.ar/crm
ASSET_URL=/crm
```

**Importante:** `APP_URL` debe terminar con `/crm` (sin barra final), y `ASSET_URL` debe ser `/crm` (con barra inicial, sin barra final).

### Solución 3: Verificar que .htaccess esté funcionando

El `.htaccess` en la raíz debe estar redirigiendo correctamente a `public/index.php`. Verificá que:

1. El archivo `.htaccess` existe en `/public_html/crm/.htaccess`
2. El servidor tiene `AllowOverride All` habilitado
3. El módulo `mod_rewrite` está habilitado

### Solución 4: Crear Script Temporal para Limpiar Cache

Si no tenés acceso SSH, creá un archivo `clear-cache.php` en la raíz:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->call('route:clear');
$kernel->call('config:clear');
$kernel->call('cache:clear');
$kernel->call('view:clear');

echo "Cache limpiado exitosamente!";
```

Accedé a `https://agoradental.com.ar/crm/clear-cache.php` una vez, y luego eliminá el archivo por seguridad.

### Solución 5: Verificar Permisos

Asegurate de que los permisos sean correctos:

```bash
chmod -R 755 storage bootstrap/cache
chmod 644 .htaccess
chmod 644 public/.htaccess
```

## 🔍 Verificación

Después de aplicar las soluciones:

1. Limpiá la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
2. Intentá hacer login nuevamente
3. Si el problema persiste, verificá los logs de Laravel en `storage/logs/laravel.log`

## 📝 Notas

- El error "Method Not Allowed" generalmente indica que Laravel está recibiendo la solicitud, pero la ruta no está registrada correctamente para aceptar POST
- Esto puede suceder si el cache de rutas está desactualizado o si el path base no está configurado correctamente
- Asegurate de que `APP_URL` en el `.env` incluya el subdirectorio `/crm`

## ✅ Verificación Final

Si todo está configurado correctamente, deberías poder:
1. Acceder a `https://agoradental.com.ar/crm/admin/login`
2. Ver el formulario de login con estilos
3. Ingresar credenciales
4. Hacer clic en "Iniciar sesión" y ser redirigido al dashboard sin errores


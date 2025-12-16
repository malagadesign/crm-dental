# Solución para Error "Unexpected token '<'" con Vite

## Problema

El error `Uncaught SyntaxError: Unexpected token '<'` en la consola del navegador indica que el navegador está recibiendo HTML en lugar de JavaScript cuando intenta cargar un asset.

## Causa

Este error generalmente ocurre cuando:
1. Vite está intentando cargar assets desde una ruta incorrecta
2. El `ASSET_URL` no está configurado correctamente
3. Los assets no están compilados o no existen

## Solución

### 1. Verificar que ASSET_URL esté en el .env

En el servidor, asegurate de que el `.env` tenga:

```env
ASSET_URL=/crm
APP_URL=https://agoradental.com.ar/crm
```

### 2. Limpiar caché de configuración

Si tenés acceso SSH:

```bash
cd /home/c2670660/public_html/crm
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### 3. Verificar que los assets de Filament existan

Filament usa assets precompilados, no Vite. Verificá que existan estos directorios:

- `/public/js/filament/`
- `/public/css/filament/`

Si no existen, ejecutá:

```bash
php artisan filament:assets
```

### 4. Si el problema persiste

El error puede ser que Filament esté intentando usar Vite cuando no debería. Verificá que no haya un archivo `public/hot` que active el modo desarrollo de Vite:

```bash
# Si existe, eliminarlo
rm public/hot
```

O verificá que no haya un `manifest.json` en `public/build/` que esté desactualizado.

## Verificación

Después de aplicar estos cambios:

1. Recargá la página con `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac) para limpiar la caché del navegador
2. Verificá en la consola del navegador que no haya más errores
3. Los assets deberían cargarse desde `/crm/js/...` y `/crm/css/...`

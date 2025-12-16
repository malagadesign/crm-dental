# Solución: Los Estilos No Cargan en el Admin Login

## Problema

El panel de administración (login de Filament) se muestra sin estilos CSS y con errores en la consola del navegador:
- `Uncaught SyntaxError: Unexpected token '<'`
- Error 404 al cargar archivos JavaScript
- La página se ve sin formato

## Causa

Los assets de Vite (CSS y JavaScript) no están compilados o la configuración de `ASSET_URL` no está correcta.

## Solución Paso a Paso

### Paso 1: Verificar y Configurar ASSET_URL

En el archivo `.env` del servidor (`/public_html/crm/.env`), asegurate de tener:

```env
APP_URL=https://agoradental.com.ar/crm
ASSET_URL=/crm
```

**Importante:** `ASSET_URL` debe ser `/crm` (sin el dominio completo, solo la ruta base).

### Paso 2: Compilar los Assets

#### Opción A: Si tenés acceso SSH al servidor

```bash
# Conectate al servidor vía SSH
ssh usuario@agoradental.com.ar

# Navegá a la carpeta del proyecto
cd /public_html/crm

# Instalá las dependencias de Node.js (solo primera vez)
npm install

# Compilá los assets para producción
npm run build

# Limpiá el cache de Laravel
php artisan config:clear
php artisan cache:clear
```

#### Opción B: Si NO tenés acceso SSH

1. **Compilá los assets localmente:**
   ```bash
   # En tu máquina local
   cd /Users/mica/htdocs/crm-dental
   npm install
   npm run build
   ```

2. **Subí la carpeta `public/build/` al servidor:**
   - Conectate vía FTP al servidor
   - Navegá a `/public_html/crm/public/`
   - Subí toda la carpeta `build/` (debe quedar en `/public_html/crm/public/build/`)

3. **Verificá que los archivos se subieron correctamente:**
   - Debe existir `/public_html/crm/public/build/manifest.json`
   - Debe existir `/public_html/crm/public/build/assets/` con archivos `.js` y `.css`

### Paso 3: Verificar Permisos

Asegurate de que la carpeta `public/build/` tenga permisos correctos:

```bash
# Si tenés SSH
chmod -R 755 public/build
```

O desde el panel de control del hosting, verificá que la carpeta tenga permisos de lectura.

### Paso 4: Limpiar Cache

Después de compilar y configurar, limpiá el cache:

```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
```

### Paso 5: Verificar

1. Abrí el navegador en modo incógnito
2. Accedé a `https://agoradental.com.ar/crm/admin/login`
3. Abrí la consola del desarrollador (F12)
4. Verificá que no haya errores 404 al cargar archivos `.js` o `.css`
5. Los estilos deberían cargarse correctamente

## Verificación Rápida

Para verificar que todo está bien configurado, revisá:

- [ ] `ASSET_URL=/crm` está en el `.env` del servidor
- [ ] La carpeta `public/build/` existe en el servidor
- [ ] El archivo `public/build/manifest.json` existe
- [ ] Hay archivos en `public/build/assets/`
- [ ] Los permisos de `public/build/` son 755
- [ ] El cache de Laravel fue limpiado

## Si el Problema Persiste

1. **Verificá la URL en el navegador:**
   - Los assets deberían cargarse desde: `https://agoradental.com.ar/crm/build/assets/...`
   - Si intenta cargar desde otra ruta, el problema es la configuración de `ASSET_URL`

2. **Revisá los logs de Laravel:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Verificá que el servidor web puede leer los archivos:**
   - Probá acceder directamente a: `https://agoradental.com.ar/crm/build/manifest.json`
   - Debería mostrar un archivo JSON, no un error 404

4. **Verificá la configuración del servidor web:**
   - Asegurate de que el `.htaccess` en `public/` permite servir archivos estáticos
   - Verificá que no hay reglas de rewrite que bloqueen los assets

## Notas Adicionales

- Los assets se compilan una vez y se reutilizan. Solo necesitás recompilar si:
  - Cambiás código JavaScript o CSS
  - Actualizás dependencias de npm
  - Cambiás la configuración de Vite

- En desarrollo local, usá `npm run dev` para desarrollo con hot-reload
- En producción, siempre usá `npm run build` para generar assets optimizados


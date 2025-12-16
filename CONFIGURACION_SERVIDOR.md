# Configuración del Servidor - CRM Dental

## Variables de Entorno Requeridas (.env)

### 1. Configuración de la Aplicación

```env
APP_NAME="CRM Dental"
APP_ENV=production
APP_KEY=base64:TU_CLAVE_AQUI
APP_DEBUG=false
APP_URL=https://agoradental.com.ar/crm
```

**Importante:** 
- `APP_KEY`: Debe generarse con `php artisan key:generate` en el servidor
- `APP_DEBUG`: Debe ser `false` en producción (o `true` temporalmente para debugging)
- `APP_URL`: Debe incluir el prefijo `/crm` (ej: `https://agoradental.com.ar/crm`)
- `ASSET_URL`: **CRÍTICO** - Debe ser `/crm` para que los assets (CSS, JS, Livewire) se carguen correctamente. Agregá esta línea al `.env`:
  ```env
  ASSET_URL=/crm
  ```

### 2. Configuración de Base de Datos (CRÍTICO)

```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nombre_de_tu_base_de_datos
DB_USERNAME=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
```

**Pasos para configurar:**

1. **Crear la base de datos en el panel de tu hosting:**
   - Accedé al panel de control (cPanel, Plesk, etc.)
   - Buscá "MySQL Databases" o "Bases de Datos"
   - Creá una nueva base de datos (ej: `c2670660_crmdental`)
   - Anotá el nombre completo (puede incluir un prefijo del usuario)

2. **Crear usuario de MySQL:**
   - En el mismo panel, creá un usuario MySQL
   - Asignale todos los privilegios a la base de datos que creaste
   - Anotá el nombre de usuario completo y la contraseña

3. **Configurar el `.env` en el servidor:**
   - En `/public_html/crm/.env`, configurá estas variables con los datos reales:
   
   ```env
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=c2670660_crmdental  # ← Tu base de datos real
   DB_USERNAME=c2670660_usuario     # ← Tu usuario MySQL real
   DB_PASSWORD=tu_password_seguro  # ← Tu contraseña real
   ```

4. **Ejecutar migraciones:**
   - Si tenés acceso SSH o terminal en el hosting:
     ```bash
     cd /public_html/crm
     php artisan migrate --force
     ```
   - Si no tenés SSH, podés usar el panel del hosting si tiene opción de ejecutar comandos PHP

### 3. Configuración de Sesión

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

### 4. Configuración de Cache

```env
CACHE_STORE=database
QUEUE_CONNECTION=database
```

**Nota:** La aplicación usa `database` para cache y colas, NO usa Redis ni Memcached.

### 5. Configuración de Redis y Memcached (No se usan, pero deben estar configurados)

Aunque la aplicación **NO usa** Redis ni Memcached (usa `database` para todo), estas variables deben estar en el `.env`:

```env
# Redis (no se usa, pero debe estar configurado)
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Memcached (no se usa, pero debe estar configurado)
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

**Importante:**
- `127.0.0.1` en el servidor de hosting se refiere al **servidor mismo**, no a tu computadora local
- Si tu hosting no tiene Redis/Memcached instalados, no hay problema porque la app no los usa
- Estos valores son seguros dejarlos así porque Laravel solo intentará conectarse si cambias `CACHE_STORE` o `SESSION_DRIVER` a `redis` o `memcached`

### 6. Configuración de Mail (Opcional)

```env
MAIL_MAILER=smtp
MAIL_HOST=mail.agoradental.com.ar
MAIL_PORT=587
MAIL_USERNAME=tu_email@agoradental.com.ar
MAIL_PASSWORD=tu_password_email
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu_email@agoradental.com.ar
MAIL_FROM_NAME="${APP_NAME}"
```

## Compilación de Assets (CSS/JS) - CRÍTICO

**Los estilos y JavaScript NO funcionarán si los assets no están compilados.**

### Opción 1: Compilar en el Servidor (Recomendado)

Si tenés acceso SSH al servidor:

```bash
cd /public_html/crm

# Instalar dependencias de Node.js (solo primera vez)
npm install

# Compilar assets para producción
npm run build

# Limpiar cache de Laravel
php artisan config:clear
php artisan cache:clear
```

### Opción 2: Compilar Localmente y Subir

Si no tenés acceso SSH, compilá localmente y subí la carpeta `public/build/`:

```bash
# En tu máquina local
cd /ruta/a/crm-dental
npm install
npm run build

# Esto creará la carpeta public/build/ con los assets compilados
# Subí toda la carpeta public/build/ al servidor vía FTP
```

**Importante:** La carpeta `public/build/` debe estar en `/public_html/crm/public/build/` en el servidor.

### Verificar que los Assets Están Compilados

Después de compilar, deberías ver:
- `/public/build/manifest.json` (archivo de configuración de Vite)
- `/public/build/assets/*.js` (archivos JavaScript compilados)
- `/public/build/assets/*.css` (archivos CSS compilados)

## Checklist de Configuración

- [ ] Archivo `.env` creado en `/public_html/crm/.env`
- [ ] `APP_KEY` generado con `php artisan key:generate`
- [ ] `ASSET_URL=/crm` configurado en `.env` (CRÍTICO para que carguen los estilos)
- [ ] Assets compilados (`npm run build` ejecutado y carpeta `public/build/` existe)
- [ ] Base de datos MySQL creada
- [ ] Usuario MySQL creado y con permisos
- [ ] Variables `DB_*` configuradas correctamente en `.env`
- [ ] Migraciones ejecutadas (`php artisan migrate --force`)
- [ ] Usuario admin creado (si no existe, crear manualmente en la base de datos o usar seeder)

## Solución de Problemas

### Error: "MySQL server has gone away"

**Causas posibles:**
1. Base de datos no existe o nombre incorrecto
2. Usuario/contraseña incorrectos
3. Host incorrecto (puede ser `localhost` o `127.0.0.1` según tu hosting)
4. Base de datos no creada aún

**Solución:**
1. Verificá en el panel del hosting que la base de datos existe
2. Verificá que el usuario tiene permisos sobre esa base
3. Probá conectarte desde phpMyAdmin con esas credenciales
4. Verificá que el `.env` tiene los valores correctos

### Error: "Access denied for user"

- Verificá que el usuario y contraseña son correctos
- Verificá que el usuario tiene permisos sobre la base de datos

### Error: "Unknown database"

- Verificá que el nombre de la base de datos en `.env` es exactamente el mismo que creaste
- Algunos hostings agregan un prefijo al nombre (ej: `usuario_nombredb`)

### Error: Los estilos no cargan / Página sin CSS

**Síntomas:**
- La página de login se ve sin estilos
- Error en consola: `Uncaught SyntaxError: Unexpected token '<'`
- Error 404 al intentar cargar archivos `.js` o `.css`

**Causas posibles:**
1. Los assets no están compilados (falta la carpeta `public/build/`)
2. `ASSET_URL` no está configurado en el `.env`
3. La carpeta `public/build/` no se subió al servidor

**Solución:**
1. Verificá que `ASSET_URL=/crm` está en el `.env` del servidor
2. Compilá los assets (ver sección "Compilación de Assets" arriba)
3. Verificá que la carpeta `public/build/` existe en el servidor
4. Limpiá el cache: `php artisan config:clear && php artisan cache:clear`
5. Verificá los permisos de la carpeta `public/build/` (debe ser 755)

## Notas Importantes

- **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
- El archivo `.env` debe estar **solo en el servidor**
- Los permisos del `.env` deben ser `600` o `640` (solo lectura para el propietario)
- Después de cambiar el `.env`, si tenés acceso SSH, ejecutá:
  ```bash
  php artisan config:clear
  php artisan cache:clear
  ```

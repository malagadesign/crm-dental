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
- `APP_DEBUG`: Debe ser `false` en producción
- `APP_URL`: Debe incluir el prefijo `/crm`

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
CACHE_DRIVER=database
QUEUE_CONNECTION=database
```

### 5. Configuración de Mail (Opcional)

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

## Checklist de Configuración

- [ ] Archivo `.env` creado en `/public_html/crm/.env`
- [ ] `APP_KEY` generado con `php artisan key:generate`
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

## Notas Importantes

- **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
- El archivo `.env` debe estar **solo en el servidor**
- Los permisos del `.env` deben ser `600` o `640` (solo lectura para el propietario)
- Después de cambiar el `.env`, si tenés acceso SSH, ejecutá:
  ```bash
  php artisan config:clear
  php artisan cache:clear
  ```

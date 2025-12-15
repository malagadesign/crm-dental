# Guía de Acceso al CRM Dental

## 📍 URL de Acceso

### En Desarrollo Local con MAMP:

**URL estándar de MAMP:**
```
http://localhost:8888/admin
```

**O si tienes configurado otro puerto:**
```
http://localhost:PUERTO/admin
```

**Nota:** El puerto por defecto de MAMP es **8888** para Apache. Si lo cambiaste, usa tu puerto configurado.

### Si usas `php artisan serve` (alternativa):
```
http://localhost:8000/admin
```

### En Producción:
```
https://tudominio.com/admin
```
O según la configuración de tu hosting:
```
https://www.tudominio.com/admin
```

## 🔐 Credenciales por Defecto

Después de ejecutar las migraciones y seeders, puedes acceder con:

**Email:** `admin@example.com`  
**Contraseña:** `password`

> ⚠️ **IMPORTANTE:** Cambia esta contraseña inmediatamente después del primer acceso, especialmente en producción.

## 🚀 Pasos para Primera Configuración

### 1. Configuración Local con MAMP

#### Paso 1: Configurar el proyecto

```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd /Users/mica/htdocs/crm-dental

# 2. Copia el archivo .env.example a .env (si no lo hiciste)
cp .env.example .env

# 3. Genera la clave de aplicación
# Usa el PHP de MAMP
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan key:generate

# O si tienes MAMP en PATH:
php artisan key:generate
```

#### Paso 2: Configurar la Base de Datos en MAMP

1. **Inicia MAMP** y asegúrate de que Apache y MySQL estén corriendo

2. **Abre phpMyAdmin** (generalmente en `http://localhost:8888/phpMyAdmin`)

3. **Crea la base de datos:**
   - Click en "Nuevo" o "New"
   - Nombre: `crm_dental`
   - Cotejamiento: `utf8mb4_unicode_ci`
   - Click en "Crear"

4. **Configura el archivo `.env`** con los datos de MAMP:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=8889  # Puerto por defecto de MySQL en MAMP
   DB_DATABASE=crm_dental
   DB_USERNAME=root
   DB_PASSWORD=root  # Contraseña por defecto de MAMP
   ```

   **Nota:** Si cambiaste la contraseña de root en MAMP, úsala aquí.

#### Paso 3: Configurar el VirtualHost en MAMP

**Opción A: Usar la carpeta htdocs de MAMP (Recomendado)**

1. Crea un enlace simbólico o copia el proyecto a `htdocs`:
   ```bash
   # Crear enlace simbólico (recomendado)
   ln -s /Users/mica/htdocs/crm-dental /Applications/MAMP/htdocs/crm-dental
   
   # O copia el proyecto directamente
   # (no recomendado, pero funciona)
   ```

2. Accede a: `http://localhost:8888/crm-dental/public/admin`

**Opción B: Configurar VirtualHost personalizado (Avanzado)**

1. Edita el archivo de hosts:
   ```bash
   sudo nano /etc/hosts
   ```
   Agrega esta línea:
   ```
   127.0.0.1 crm-dental.test
   ```

2. Edita el archivo `httpd-vhosts.conf` de MAMP:
   ```bash
   nano /Applications/MAMP/conf/apache/httpd-vhosts.conf
   ```

3. Agrega esta configuración:
   ```apache
   <VirtualHost *:8888>
       ServerName crm-dental.test
       DocumentRoot "/Users/mica/htdocs/crm-dental/public"
       
       <Directory "/Users/mica/htdocs/crm-dental/public">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

4. Reinicia Apache en MAMP

5. Accede a: `http://crm-dental.test:8888/admin`

#### Paso 4: Ejecutar Migraciones

```bash
# Usa el PHP de MAMP
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan migrate --seed

# O si configuraste MAMP en PATH
php artisan migrate --seed
```

#### Paso 5: Verificar Permisos

```bash
chmod -R 775 storage bootstrap/cache
chmod -R 775 storage/logs
```

### 2. Acceso al Panel

**Con MAMP (Opción A - Enlace en htdocs):**
1. Abre tu navegador y ve a: `http://localhost:8888/crm-dental/public/admin`

**Con MAMP (Opción B - VirtualHost):**
1. Abre tu navegador y ve a: `http://crm-dental.test:8888/admin`

2. Verás la pantalla de login de Filament
3. Ingresa las credenciales:
   - Email: `admin@example.com`
   - Contraseña: `password`
4. Haz clic en "Iniciar sesión"

### 3. Cambiar Contraseña (PRIORITARIO)

1. Una vez dentro, haz clic en tu nombre/avatar en la esquina superior derecha
2. Selecciona "Perfil" o "Account"
3. Cambia la contraseña por una segura
4. Guarda los cambios

## 📱 Estructura del Panel

Una vez dentro, verás el menú lateral con:

- **Dashboard** - Panel principal con resumen
- **Pacientes** - Gestión de pacientes
- **Consultorios** - Gestión de consultorios
- **Turnos** - Gestión de turnos (incluye vista de calendario)
- **Tratamientos** - Catálogo de tratamientos
- **Leads** - Gestión de leads de Instagram

## 🔒 Configuración en Producción

### Pasos para Desplegar:

1. **Sube los archivos al servidor** (vía FTP, Git, etc.)

2. **Configura el archivo .env en el servidor:**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://tudominio.com
   
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=tu_base_de_datos
   DB_USERNAME=tu_usuario_db
   DB_PASSWORD=tu_contraseña_db
   ```

3. **En el servidor (SSH o terminal del hosting):**
   ```bash
   # Instalar dependencias
   composer install --no-dev --optimize-autoloader
   
   # Generar clave
   php artisan key:generate
   
   # Ejecutar migraciones
   php artisan migrate --force
   
   # Ejecutar seeders (solo primera vez)
   php artisan db:seed
   
   # Optimizar para producción
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

4. **Configurar permisos de carpetas:**
   ```bash
   chmod -R 755 storage bootstrap/cache
   chmod -R 775 storage/logs
   ```

5. **Configurar el servidor web:**
   - El punto de entrada debe ser la carpeta `public`
   - Configura un VirtualHost apuntando a `public/index.php`

### Ejemplo para Apache (.htaccess ya incluido):

```apache
<VirtualHost *:80>
    ServerName tudominio.com
    DocumentRoot /ruta/a/crm-dental/public
    
    <Directory /ruta/a/crm-dental/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Ejemplo para Nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /ruta/a/crm-dental/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 👥 Crear Usuarios Adicionales

Para crear más usuarios (asistentes, secretarias, etc.):

1. Ve a **Pacientes** → Cualquier sección (no hay gestión de usuarios en Filament por defecto)
2. O crea usuarios desde Tinker:
   ```bash
   php artisan tinker
   ```
   ```php
   use App\Models\User;
   use Illuminate\Support\Facades\Hash;
   
   User::create([
       'name' => 'Asistente',
       'email' => 'asistente@example.com',
       'password' => Hash::make('contraseña_segura'),
   ]);
   ```

## 🔧 Solución de Problemas

### Error: "No application encryption key has been specified"
```bash
php artisan key:generate
```

### Error: "Access denied for user"
- Verifica las credenciales de la base de datos en `.env`
- Asegúrate de que la base de datos existe
- Verifica que el usuario MySQL tenga permisos

### Error 404 al acceder a /admin
- Verifica que el archivo `.htaccess` esté en la carpeta `public`
- Verifica que `mod_rewrite` esté habilitado en Apache
- Si usas Nginx, verifica la configuración del servidor

### Error: "Class 'PDO' not found"
- Instala la extensión PDO de PHP: `sudo apt-get install php-pdo php-mysql`

## 📞 Primera Vez - Checklist

- [ ] Configurar base de datos en `.env`
- [ ] Ejecutar `php artisan migrate --seed`
- [ ] Acceder a `/admin`
- [ ] Login con `admin@example.com` / `password`
- [ ] **CAMBIAR LA CONTRASEÑA**
- [ ] Crear al menos 2 consultorios (ya creados por el seeder)
- [ ] Crear algunos pacientes de prueba
- [ ] Crear algunos tratamientos
- [ ] Crear un turno de prueba
- [ ] Probar la vista de calendario

## 🎯 URL de Acceso Rápido

- **Login:** `/admin`
- **Dashboard:** `/admin` (después de login)
- **Calendario de Turnos:** `/admin/appointments/calendar`
- **Lista de Turnos:** `/admin/appointments`
- **Pacientes:** `/admin/patients`
- **Consultorios:** `/admin/clinics`
- **Tratamientos:** `/admin/treatments`
- **Leads:** `/admin/leads`

---

**¿Problemas?** Verifica los logs en `storage/logs/laravel.log`


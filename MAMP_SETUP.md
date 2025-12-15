# Configuración Rápida para MAMP

## 🚀 Guía Rápida para MAMP en macOS

### 1. Verificar que MAMP esté corriendo

- Abre MAMP
- Click en "Iniciar Servidores"
- Verifica que Apache y MySQL estén en verde

### 2. Verificar Versión de PHP de MAMP

MAMP incluye PHP 8.x. Verifica qué versión tienes:
```bash
/Applications/MAMP/bin/php/php8.3.0/bin/php -v
```

Ajusta la ruta según tu versión instalada.

### 3. Configurar Base de Datos

#### Crear Base de Datos:

1. Abre phpMyAdmin: `http://localhost:8888/phpMyAdmin`
2. Click en "Nuevo" en el menú lateral
3. Nombre de base de datos: `crm_dental`
4. Cotejamiento: `utf8mb4_unicode_ci`
5. Click en "Crear"

#### Configurar .env:

Edita el archivo `.env` en la raíz del proyecto:

```env
APP_NAME="CRM Dental"
APP_ENV=local
APP_KEY=base64:... (se genera con key:generate)
APP_DEBUG=true
APP_URL=http://localhost:8888

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=8889
DB_DATABASE=crm_dental
DB_USERNAME=root
DB_PASSWORD=root
```

**⚠️ Nota:** El puerto de MySQL en MAMP es **8889** (no 3306).

### 4. Configurar Ruta del Proyecto

#### Opción Simple (Recomendada para empezar):

Crea un enlace simbólico desde htdocs:

```bash
ln -s /Users/mica/htdocs/crm-dental /Applications/MAMP/htdocs/crm-dental
```

Luego accede a:
```
http://localhost:8888/crm-dental/public/admin
```

#### Opción con VirtualHost (Más profesional):

1. **Editar hosts:**
   ```bash
   sudo nano /etc/hosts
   ```
   Agrega:
   ```
   127.0.0.1 crm-dental.local
   ```

2. **Editar httpd-vhosts.conf:**
   ```bash
   nano /Applications/MAMP/conf/apache/httpd-vhosts.conf
   ```
   
   Agrega al final:
   ```apache
   <VirtualHost *:8888>
       ServerName crm-dental.local
       DocumentRoot "/Users/mica/htdocs/crm-dental/public"
       
       <Directory "/Users/mica/htdocs/crm-dental/public">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. **Reinicia Apache en MAMP**

4. **Accede a:**
   ```
   http://crm-dental.local:8888/admin
   ```

### 5. Ejecutar Comandos de Laravel

Para usar los comandos de Laravel, usa el PHP de MAMP:

```bash
# Ejemplo: Generar clave
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan key:generate

# Ejemplo: Migraciones
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan migrate --seed

# Ejemplo: Limpiar cache
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan cache:clear
```

**Tip:** Crea un alias en tu `.zshrc` o `.bashrc`:

```bash
nano ~/.zshrc
```

Agrega:
```bash
alias mamp-php="/Applications/MAMP/bin/php/php8.3.0/bin/php"
```

Luego recarga:
```bash
source ~/.zshrc
```

Ahora puedes usar:
```bash
mamp-php artisan migrate
```

### 6. Verificar Permisos

```bash
cd /Users/mica/htdocs/crm-dental
chmod -R 775 storage bootstrap/cache
chmod -R 775 storage/logs
```

### 7. Instalar Dependencias

```bash
# Si composer está en PATH
composer install

# O usa el PHP de MAMP con composer
/Applications/MAMP/bin/php/php8.3.0/bin/php /usr/local/bin/composer install
```

### 8. Primer Acceso

1. Ve a: `http://localhost:8888/crm-dental/public/admin`
2. Login:
   - Email: `admin@example.com`
   - Password: `password`
3. **¡Cambia la contraseña inmediatamente!**

## 🔧 Solución de Problemas con MAMP

### Error: "No such file or directory" en artisan

**Solución:** Usa la ruta completa del PHP de MAMP:
```bash
/Applications/MAMP/bin/php/php8.3.0/bin/php artisan
```

### Error: "Connection refused" en MySQL

**Solución:** 
- Verifica que MySQL esté corriendo en MAMP
- Verifica el puerto en `.env` (debe ser 8889, no 3306)
- Verifica que el usuario y contraseña sean correctos (por defecto: root/root)

### Error 404 al acceder a /admin

**Solución:**
- Verifica que estés accediendo a `/public/admin` (no solo `/admin`)
- O configura correctamente el VirtualHost apuntando a la carpeta `public`
- Verifica que `mod_rewrite` esté habilitado en Apache

### Error: "Access denied for user 'root'@'localhost'"

**Solución:**
- Verifica la contraseña de MySQL en MAMP
- Por defecto es `root`, pero puede que la hayas cambiado
- Actualiza el `.env` con la contraseña correcta

### Error: "Class 'PDO' not found"

**Solución:**
- Verifica que la extensión PDO esté habilitada en MAMP
- En MAMP, ve a: Preferencias → PHP → Extensiones
- Asegúrate de que `pdo_mysql` esté marcada

## 📍 Puertos por Defecto de MAMP

- **Apache:** 8888
- **MySQL:** 8889
- **phpMyAdmin:** 8888/phpMyAdmin

Si los cambiaste, ajusta las configuraciones según tus puertos.

## ✅ Checklist Final

- [ ] MAMP está corriendo (Apache y MySQL en verde)
- [ ] Base de datos `crm_dental` creada en phpMyAdmin
- [ ] Archivo `.env` configurado correctamente
- [ ] `php artisan key:generate` ejecutado
- [ ] `php artisan migrate --seed` ejecutado
- [ ] Permisos de carpetas configurados (775)
- [ ] Proyecto accesible desde navegador
- [ ] Login exitoso con credenciales por defecto
- [ ] Contraseña cambiada

---

**¿Listo?** Accede a `http://localhost:8888/crm-dental/public/admin` y comienza a usar tu CRM Dental! 🦷


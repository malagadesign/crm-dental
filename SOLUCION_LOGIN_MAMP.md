# Solución: Error "Method Not Allowed" en Login con MAMP

## 🔧 Problema

Al intentar hacer login, aparece el error:
```
The POST method is not supported for route admin/login. Supported methods: GET, HEAD.
```

## ✅ Soluciones

### Solución 1: Habilitar AllowOverride en MAMP (Recomendado)

1. **Abre el archivo de configuración de Apache de MAMP:**
   ```bash
   nano /Applications/MAMP/conf/apache/httpd.conf
   ```

2. **Busca la línea:**
   ```apache
   AllowOverride None
   ```

3. **Cámbiala por:**
   ```apache
   AllowOverride All
   ```

4. **Guarda el archivo** (Ctrl+O, Enter, Ctrl+X)

5. **Reinicia Apache en MAMP** (Stop y Start)

### Solución 2: Configurar VirtualHost específico para el proyecto

Crea un VirtualHost personalizado en MAMP que tenga `AllowOverride All`:

1. **Edita el archivo de hosts:**
   ```bash
   sudo nano /etc/hosts
   ```
   Agrega:
   ```
   127.0.0.1 crm-dental.local
   ```

2. **Edita `httpd-vhosts.conf` de MAMP:**
   ```bash
   nano /Applications/MAMP/conf/apache/extra/httpd-vhosts.conf
   ```

3. **Agrega al final:**
   ```apache
   <VirtualHost *:8888>
       ServerName crm-dental.local
       DocumentRoot "/Users/mica/htdocs/crm-dental/public"
       
       <Directory "/Users/mica/htdocs/crm-dental/public">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog "/Applications/MAMP/logs/crm-dental_error.log"
       CustomLog "/Applications/MAMP/logs/crm-dental_access.log" common
   </VirtualHost>
   ```

4. **Asegúrate de que el módulo `vhost_alias` esté habilitado** en `httpd.conf`:
   ```apache
   LoadModule vhost_alias_module modules/mod_vhost_alias.so
   ```

5. **Reinicia Apache en MAMP**

6. **Accede a:** `http://crm-dental.local:8888/admin`

### Solución 3: Usar php artisan serve (Alternativa rápida)

Si las soluciones anteriores no funcionan, puedes usar el servidor de desarrollo de Laravel:

```bash
cd /Users/mica/htdocs/crm-dental
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan serve --host=127.0.0.1 --port=8000
```

Luego accede a: `http://127.0.0.1:8000/admin`

## 🔍 Verificar que funcione

Después de aplicar la Solución 1 o 2:

1. Limpia las cachés:
   ```bash
   /Applications/MAMP/bin/php/php8.3.14/bin/php artisan optimize:clear
   ```

2. Verifica que el `.htaccess` esté siendo leído:
   - Crea un archivo de prueba `test.php` en `public/`
   - Agrega: `<?php phpinfo(); ?>`
   - Accede: `http://localhost:8888/crm-dental/public/test.php`
   - Busca "mod_rewrite" y verifica que esté habilitado

3. Intenta hacer login nuevamente

## 📝 Notas

- **AllowOverride All** permite que los archivos `.htaccess` funcionen, que son esenciales para Laravel
- Sin `AllowOverride`, Laravel no puede reescribir las URLs correctamente
- Filament/Livewire necesita que las rutas funcionen correctamente para manejar los formularios POST

## ✅ Verificación Final

Si todo está configurado correctamente, deberías poder:
1. Acceder a `http://localhost:8888/crm-dental/public/admin`
2. Ver el formulario de login
3. Ingresar credenciales (`admin@example.com` / `password`)
4. Hacer clic en "Iniciar sesión" sin errores

---

**Recomendación:** Usa la **Solución 1** (AllowOverride All) ya que es la más simple y permite que todos tus proyectos Laravel funcionen correctamente con MAMP.


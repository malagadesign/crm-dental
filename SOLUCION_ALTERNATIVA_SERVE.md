# Solución Alternativa: Usar php artisan serve

## 🚀 Solución Rápida y Simple

Si MAMP sigue dando problemas con las rutas, puedes usar el servidor de desarrollo integrado de Laravel que no requiere configuración de Apache.

### Paso 1: Iniciar el servidor

```bash
cd /Users/mica/htdocs/crm-dental
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan serve --host=127.0.0.1 --port=8000
```

### Paso 2: Acceder al sistema

Abre tu navegador y ve a:
```
http://127.0.0.1:8000/admin
```

### Paso 3: Login

- Email: `admin@example.com`
- Password: `password`

---

## 🔧 Por qué funciona mejor

- ✅ No requiere configuración de Apache
- ✅ No necesita `.htaccess` funcionando
- ✅ Las rutas se procesan correctamente
- ✅ Livewire funciona sin problemas
- ✅ Ideal para desarrollo local

## ⚠️ Nota Importante

El servidor se detendrá cuando cierres la terminal. Para mantenerlo corriendo en segundo plano o como servicio, puedes usar:

```bash
# En segundo plano
nohup /Applications/MAMP/bin/php/php8.3.14/bin/php artisan serve --host=127.0.0.1 --port=8000 > /dev/null 2>&1 &

# O crear un alias en tu .zshrc
echo 'alias crm-serve="/Applications/MAMP/bin/php/php8.3.14/bin/php artisan serve --host=127.0.0.1 --port=8000"' >> ~/.zshrc
source ~/.zshrc

# Luego solo ejecuta:
crm-serve
```

## 🔄 Si quieres seguir usando MAMP

Para que MAMP funcione correctamente, necesitas:

1. **Verificar que AllowOverride esté en "All"** en el VirtualHost específico (no solo en la configuración global)

2. **Crear un VirtualHost dedicado** en MAMP:

   Edita: `/Applications/MAMP/conf/apache/extra/httpd-vhosts.conf`
   
   Agrega:
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

3. **Agregar al /etc/hosts:**
   ```
   127.0.0.1 crm-dental.local
   ```

4. **Reiniciar MAMP**

5. **Acceder a:** `http://crm-dental.local:8888/admin`

---

**Recomendación:** Para desarrollo local, `php artisan serve` es más simple y confiable. Usa MAMP solo si necesitas características específicas de Apache o si estás probando la configuración para producción.


# Solución: Error de Versión de PHP en MAMP

## 🔧 Problema Resuelto

Si viste el error:
```
Composer detected issues in your platform: Your Composer dependencies require a PHP version ">= 8.4.0". You are running 8.3.14.
```

Esto sucede porque las dependencias se instalaron con una versión de PHP diferente a la que usa MAMP.

## ✅ Solución Aplicada

1. **Se reinstalaron las dependencias usando PHP 8.3.14 de MAMP**
2. **Se instaló Composer 2.9.2 localmente** para compatibilidad
3. **Se corrigió el widget del calendario** para compatibilidad

## 🚀 Ahora Deberías Poder:

1. **Acceder al sistema:**
   ```
   http://localhost:8888/crm-dental/public/admin
   ```

2. **Usar comandos de Laravel con PHP de MAMP:**
   ```bash
   /Applications/MAMP/bin/php/php8.3.14/bin/php artisan migrate
   ```

3. **O usar el composer local:**
   ```bash
   /Applications/MAMP/bin/php/php8.3.14/bin/php ./composer install
   ```

## 📝 Notas Importantes

- **MAMP usa PHP 8.3.14** - Las dependencias están ahora configuradas para esta versión
- **El composer local** está en `./composer` en la raíz del proyecto
- **Siempre usa el PHP de MAMP** para comandos de artisan y composer

## 🛠️ Si Necesitas Reinstalar Dependencias

```bash
cd /Users/mica/htdocs/crm-dental
rm -rf vendor composer.lock
/Applications/MAMP/bin/php/php8.3.14/bin/php ./composer install
```

## 🔄 Comandos Útiles con MAMP

```bash
# Ejecutar migraciones
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan migrate --seed

# Limpiar cache
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan cache:clear
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan config:clear

# Generar clave
/Applications/MAMP/bin/php/php8.3.14/bin/php artisan key:generate
```

## 💡 Tip: Crear Alias (Opcional)

Puedes agregar esto a tu `~/.zshrc` para facilitar el uso:

```bash
# PHP de MAMP
alias mamp-php="/Applications/MAMP/bin/php/php8.3.14/bin/php"

# Composer con PHP de MAMP
alias mamp-composer="mamp-php ./composer"
```

Luego usa:
```bash
mamp-php artisan migrate
mamp-composer install
```

---

**¿Todo funcionando?** Intenta acceder nuevamente a `http://localhost:8888/crm-dental/public/admin` 🎉


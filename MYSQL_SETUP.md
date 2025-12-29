# Configuración MySQL con MAMP

## ✅ Ya cambié el schema a MySQL

El archivo `prisma/schema.prisma` ya está configurado para MySQL.

## 📋 Próximos Pasos

### 1. Actualizar `.env`

Edita tu archivo `.env` y cambia `DATABASE_URL` a:

```env
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"
```

**Importante:** MAMP usa el puerto **8889** para MySQL (no 3306).

### 2. Crear la Base de Datos

**Opción A: Desde phpMyAdmin (Más fácil)**

1. Abre: http://localhost:8888/phpMyAdmin
2. Click en "Nuevo" o "New"
3. Nombre: `crm_dental`
4. Cotejamiento: `utf8mb4_unicode_ci`
5. Click en "Crear"

**Opción B: Desde Terminal**

```bash
mysql -u root -proot -h 127.0.0.1 -P 8889 -e "CREATE DATABASE IF NOT EXISTS crm_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Regenerar Prisma Client

```bash
pnpm db:generate
```

### 4. Sincronizar Schema con Base de Datos

```bash
pnpm db:push
```

Esto creará todas las tablas en tu base de datos MySQL.

### 5. Crear Datos Iniciales

```bash
pnpm db:seed
```

### 6. Ejecutar el Proyecto

```bash
pnpm dev
```

## 🔍 Verificar que MAMP está corriendo

Asegúrate de que:
- ✅ MAMP está iniciado
- ✅ MySQL está en verde (corriendo)
- ✅ El puerto es 8889

## 🆘 Si hay problemas

### Error: "Can't reach database server"

1. Verifica que MAMP está corriendo
2. Verifica que MySQL está activo (debe estar en verde)
3. Verifica el puerto en `.env` (debe ser 8889)

### Error: "Access denied"

Verifica las credenciales en `.env`:
- Usuario: `root`
- Password: `root` (o la que configuraste en MAMP)

### Error: "Unknown database"

Ejecuta el paso 2 para crear la base de datos.

## ✅ Checklist

- [ ] MAMP está corriendo
- [ ] MySQL está activo
- [ ] `.env` tiene `DATABASE_URL` con puerto 8889
- [ ] Base de datos `crm_dental` creada
- [ ] `pnpm db:generate` ejecutado
- [ ] `pnpm db:push` ejecutado
- [ ] `pnpm db:seed` ejecutado
- [ ] `pnpm dev` funciona

¡Listo! 🚀

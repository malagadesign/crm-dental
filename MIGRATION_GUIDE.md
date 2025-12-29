# Guía de Migración - Laravel a Next.js

Esta guía te ayudará a migrar tu aplicación CRM Dental de Laravel + Filament a Next.js + TypeScript.

## 📋 Pasos de Migración

### 1. Preparar el Entorno

```bash
cd nextjs-crm
npm install
```

### 2. Configurar Base de Datos

#### Opción A: Migrar datos existentes (MySQL/PostgreSQL)

1. **Exportar datos de Laravel:**
   ```bash
   # Desde el proyecto Laravel
   php artisan db:export --format=sql > database_export.sql
   ```

2. **Importar a nueva base de datos:**
   - Crear nueva base de datos PostgreSQL (recomendado para Vercel)
   - Importar el SQL exportado

3. **Ajustar schema de Prisma:**
   - El schema ya está creado en `prisma/schema.prisma`
   - Si usas MySQL, cambiar `provider = "postgresql"` a `provider = "mysql"`

#### Opción B: Empezar desde cero

```bash
npx prisma db push
npx prisma db seed  # Si tienes seeders
```

### 3. Configurar Variables de Entorno

Crear archivo `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_dental?schema=public"

# NextAuth
NEXTAUTH_SECRET="genera-un-secret-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Migrar Contraseñas

Las contraseñas en Laravel están hasheadas con bcrypt. Necesitas:

1. **Mantener las mismas contraseñas hasheadas** en la nueva base de datos
2. **O resetear todas las contraseñas** y que los usuarios las cambien

### 5. Migrar Archivos Subidos

Si tienes archivos en `storage/app/public`:

1. Copiar archivos a `public/uploads/` en Next.js
2. Actualizar referencias en la base de datos

### 6. Configurar Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno:**
   - `DATABASE_URL` (usar connection string de Vercel Postgres o externa)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (tu dominio de Vercel)

3. **Deploy automático** - Vercel detectará Next.js

## 🔄 Diferencias Clave

### Autenticación
- **Laravel:** Session-based
- **Next.js:** JWT con NextAuth.js

### Base de Datos
- **Laravel:** Eloquent ORM
- **Next.js:** Prisma ORM

### UI
- **Laravel:** Filament (PHP)
- **Next.js:** React + shadcn/ui

### Rutas
- **Laravel:** `routes/web.php`
- **Next.js:** App Router (`app/` directory)

## 📝 Checklist de Migración

- [ ] Instalar dependencias
- [ ] Configurar base de datos
- [ ] Migrar datos (si aplica)
- [ ] Configurar variables de entorno
- [ ] Probar autenticación
- [ ] Migrar archivos estáticos
- [ ] Configurar Vercel
- [ ] Probar en producción
- [ ] Actualizar DNS si es necesario

## 🚀 Próximos Pasos

Una vez migrado, puedes:
1. Agregar más funcionalidades
2. Mejorar UI/UX
3. Agregar features nuevas
4. Optimizar performance

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel Docs](https://vercel.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

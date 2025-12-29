# 🚀 Inicio Rápido - Próximos Pasos

## ✅ Lo que ya hiciste

- [x] Instalaste dependencias con pnpm
- [x] Aprobaste build scripts de Prisma
- [x] Generaste Prisma Client

## 📋 Próximos Pasos

### 1. Crear archivo `.env`

```bash
# Crear el archivo .env
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_dental?schema=public"

# NextAuth
NEXTAUTH_SECRET="genera-un-secret-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
EOF
```

**O edita manualmente** creando `.env` con:

```env
# Database - Ajusta según tu configuración
DATABASE_URL="postgresql://user:password@localhost:5432/crm_dental?schema=public"

# NextAuth - Genera el secret con: openssl rand -base64 32
NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Generar Secret de NextAuth

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `.env` como `NEXTAUTH_SECRET`.

### 3. Configurar Base de Datos

**Opción A: PostgreSQL (Recomendado)**

Si no tienes PostgreSQL, puedes usar:
- [Supabase](https://supabase.com) (gratis)
- [Neon](https://neon.tech) (gratis)
- PostgreSQL local

**Opción B: MySQL**

Si prefieres MySQL, cambia en `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Y en `.env`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/crm_dental"
```

### 4. Sincronizar Schema con Base de Datos

```bash
pnpm db:push
```

Esto creará todas las tablas en tu base de datos.

### 5. Instalar tsx para el seed

```bash
pnpm add -D tsx
```

### 6. Crear Usuario Inicial

```bash
pnpm db:seed
```

Esto creará:
- Usuario admin: `admin@example.com` / `password`
- Un consultorio de ejemplo
- Un tratamiento de ejemplo

### 7. Ejecutar en Desarrollo

```bash
pnpm dev
```

Abre: http://localhost:3000

## 🎯 Comandos Resumidos

```bash
# 1. Crear .env (edita con tus datos)
nano .env

# 2. Generar secret
openssl rand -base64 32

# 3. Instalar tsx
pnpm add -D tsx

# 4. Sincronizar base de datos
pnpm db:push

# 5. Crear datos iniciales
pnpm db:seed

# 6. Ejecutar
pnpm dev
```

## 🔐 Credenciales por Defecto

Después de ejecutar `pnpm db:seed`:

- **Email:** `admin@example.com`
- **Password:** `password`

⚠️ **IMPORTANTE:** Cambia la contraseña después del primer acceso!

## 🆘 Problemas Comunes

### Error: "DATABASE_URL is not set"
- Verifica que el archivo `.env` existe
- Verifica que `DATABASE_URL` está configurado correctamente

### Error: "Can't reach database server"
- Verifica que tu base de datos está corriendo
- Verifica las credenciales en `DATABASE_URL`
- Verifica que el puerto es correcto (5432 para PostgreSQL, 3306 para MySQL)

### Error: "Prisma Client not generated"
- Ejecuta: `pnpm db:generate`

## 📚 Siguiente

Una vez que tengas todo funcionando, puedes:
1. Explorar el código en `app/`
2. Ver los componentes en `components/`
3. Agregar más funcionalidades
4. Personalizar el diseño

¡Éxito! 🎉

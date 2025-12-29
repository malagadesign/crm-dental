# Configuración de Base de Datos

## 🔍 Problema Actual

No puedes conectarte a PostgreSQL en `localhost:5432`. Tienes dos opciones:

## Opción 1: Usar MySQL (MAMP) - ⚡ Rápido y Fácil

Ya tienes MySQL corriendo con MAMP, así que es la opción más rápida.

### Pasos:

1. **Cambiar Prisma a MySQL:**

Edita `prisma/schema.prisma` y cambia:
```prisma
datasource db {
  provider = "mysql"  // Cambiar de "postgresql" a "mysql"
  url      = env("DATABASE_URL")
}
```

2. **Actualizar .env:**

```env
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"
```

**Nota:** MAMP usa el puerto **8889** para MySQL (no 3306).

3. **Crear la base de datos:**

Abre phpMyAdmin: http://localhost:8888/phpMyAdmin

O desde terminal:
```bash
mysql -u root -proot -h 127.0.0.1 -P 8889 -e "CREATE DATABASE IF NOT EXISTS crm_dental;"
```

4. **Sincronizar schema:**

```bash
pnpm db:push
```

## Opción 2: Instalar PostgreSQL

### Con Homebrew (macOS):

```bash
# Instalar PostgreSQL
brew install postgresql@14

# Iniciar PostgreSQL
brew services start postgresql@14

# Crear base de datos
createdb crm_dental
```

### Actualizar .env:

```env
DATABASE_URL="postgresql://tu_usuario@localhost:5432/crm_dental?schema=public"
```

## Opción 3: Usar Base de Datos en la Nube (Recomendado para Vercel)

### Supabase (Gratis):

1. Ve a https://supabase.com
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la connection string
5. Actualiza `.env`:

```env
DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[TU-PROJECT].supabase.co:5432/postgres"
```

### Neon (Gratis):

1. Ve a https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la connection string
5. Actualiza `.env`

## 🎯 Recomendación

**Para desarrollo local:** Usa MySQL con MAMP (Opción 1) - Es lo más rápido.

**Para producción/Vercel:** Usa Supabase o Neon (Opción 3) - PostgreSQL gratuito en la nube.

## ✅ Después de Configurar

Una vez que puedas conectarte:

```bash
# Sincronizar schema
pnpm db:push

# Crear datos iniciales
pnpm db:seed

# Ejecutar proyecto
pnpm dev
```

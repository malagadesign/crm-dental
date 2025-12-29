# Setup Inicial - CRM Dental Next.js

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

#### Opción A: PostgreSQL (Recomendado para Vercel)

1. Instalar PostgreSQL localmente o usar un servicio como [Supabase](https://supabase.com)
2. Crear base de datos:
   ```sql
   CREATE DATABASE crm_dental;
   ```

3. Configurar `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/crm_dental?schema=public"
   ```

#### Opción B: MySQL

1. Cambiar en `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Configurar `.env`:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/crm_dental"
   ```

### 3. Configurar Prisma

```bash
# Generar Prisma Client
npm run db:generate

# Sincronizar schema con base de datos
npm run db:push

# (Opcional) Crear migración
npm run db:migrate
```

### 4. Configurar NextAuth

Generar secret para NextAuth:

```bash
openssl rand -base64 32
```

Agregar a `.env`:
```env
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Crear Usuario Inicial

Puedes crear un script de seed o usar Prisma Studio:

```bash
npm run db:studio
```

O crear manualmente en la base de datos con contraseña hasheada con bcrypt.

### 6. Ejecutar en Desarrollo

```bash
npm run dev
```

Abrir: http://localhost:3000

## 🔐 Crear Usuario Admin

### Opción 1: Script de Seed

Crear `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await hash('password', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log('Usuario creado:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Agregar a `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Ejecutar:
```bash
npx prisma db seed
```

### Opción 2: Prisma Studio

```bash
npm run db:studio
```

Crear usuario manualmente con contraseña hasheada.

## 🎨 Personalización

### Colores

Editar `app/globals.css` para cambiar los colores del tema.

### Logo/Branding

Reemplazar en:
- `app/layout.tsx` (metadata)
- `components/layout/header.tsx`
- `components/layout/sidebar.tsx`

## 📦 Despliegue en Vercel

1. **Push a GitHub/GitLab**
2. **Conectar a Vercel**
3. **Configurar variables de entorno:**
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. **Deploy automático**

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: "Database connection"
- Verificar `DATABASE_URL` en `.env`
- Verificar que la base de datos esté corriendo
- Verificar credenciales

### Error: "NextAuth secret"
- Generar nuevo secret con `openssl rand -base64 32`
- Actualizar `NEXTAUTH_SECRET` en `.env`

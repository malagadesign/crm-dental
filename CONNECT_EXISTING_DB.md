# Conectar a Base de Datos Existente

## ✅ Ya tienes la base de datos

Perfecto, si ya tienes `crm_dental` en phpMyAdmin, solo necesitamos conectarla.

## 📋 Pasos

### 1. Verificar .env

Asegúrate de que tu `.env` tenga:

```env
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"
```

**Nota:** Si tu contraseña de MySQL no es `root`, ajusta la URL.

### 2. Regenerar Prisma Client

```bash
pnpm db:generate
```

### 3. Opciones para Sincronizar

Tienes dos opciones:

#### Opción A: Mantener datos existentes (Recomendado)

Si ya tienes datos en las tablas, **NO ejecutes** `db:push` porque puede borrar datos.

En su lugar, verifica que las tablas existan y que el schema coincida.

#### Opción B: Resetear y empezar de cero

Si quieres empezar limpio (y no te importa perder datos):

```bash
# Esto borrará y recreará las tablas
pnpm db:push --force-reset
```

### 4. Verificar Conexión

Puedes probar la conexión con Prisma Studio:

```bash
pnpm db:studio
```

Esto abrirá una interfaz visual para ver tus datos.

### 5. Crear Usuario Inicial (si no existe)

Si ya tienes usuarios en la tabla `users`, puedes saltar este paso.

Si no, ejecuta:

```bash
pnpm db:seed
```

Esto creará:
- Usuario: `admin@example.com` / `password`
- Consultorio de ejemplo
- Tratamiento de ejemplo

## 🔍 Verificar Tablas Existentes

Si las tablas ya existen desde Laravel, verifica que tengan estos nombres:

- `users`
- `clinics`
- `patients`
- `treatments`
- `appointments`
- `medical_records`
- `leads`

## ⚠️ Importante: Migrar Contraseñas

Si ya tienes usuarios en la base de datos desde Laravel:

- Las contraseñas están hasheadas con bcrypt (igual que en Laravel)
- Deberían funcionar directamente con NextAuth
- Puedes probar hacer login con las credenciales existentes

## 🚀 Ejecutar

Una vez configurado:

```bash
pnpm dev
```

Abre: http://localhost:3000

## 🆘 Si hay problemas

### Error: "Table already exists"

Si las tablas ya existen, Prisma puede dar error. Opciones:

1. **Usar Prisma Studio para verificar:**
   ```bash
   pnpm db:studio
   ```

2. **Si el schema es diferente, crear migración:**
   ```bash
   pnpm db:migrate
   ```

### Error: "Column type mismatch"

Si las columnas son diferentes, puedes:
- Ajustar el schema de Prisma para que coincida
- O hacer una migración manual

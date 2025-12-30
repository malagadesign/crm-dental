# 🚀 Guía de Deployment en Vercel

Esta guía te ayudará a desplegar tu aplicación CRM Dental en Vercel paso a paso.

## 📋 Requisitos Previos

1. ✅ Repositorio en GitHub: `https://github.com/malagadesign/crm-dental`
2. ✅ Cuenta en Vercel (gratuita): [vercel.com](https://vercel.com)
3. ✅ Base de datos MySQL accesible desde internet (o usar Vercel Postgres/PlanetScale)

## 🔧 Paso 1: Conectar Repositorio a Vercel

1. **Inicia sesión en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub

2. **Importar Proyecto**
   - Haz clic en **"Add New..."** → **"Project"**
   - Selecciona el repositorio `malagadesign/crm-dental`
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configuración del Proyecto**
   - **Framework Preset**: Next.js (debería detectarse automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `pnpm build` (o `npm run build`)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `pnpm install` (o `npm install`)

## 🔐 Paso 2: Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes variables:

### Variables Requeridas:

```env
DATABASE_URL=mysql://usuario:password@host:3306/crm_dental
NEXTAUTH_SECRET=tu-secret-generado-aqui
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NODE_ENV=production
```

### Cómo obtener cada variable:

#### 1. `DATABASE_URL`
- Si usas una base de datos MySQL remota:
  ```
  mysql://usuario:password@host:3306/crm_dental
  ```
- Si prefieres usar una base de datos gestionada:
  - **PlanetScale** (MySQL compatible): [planetscale.com](https://planetscale.com)
  - **Vercel Postgres** (requiere migración): [vercel.com/storage/postgres](https://vercel.com/storage/postgres)

#### 2. `NEXTAUTH_SECRET`
Genera un secret seguro:
```bash
openssl rand -base64 32
```
Copia el resultado y pégalo como valor de `NEXTAUTH_SECRET`.

#### 3. `NEXTAUTH_URL`
- **Primera vez**: Usa `https://tu-proyecto.vercel.app` (Vercel te dará la URL después del primer deploy)
- **Después**: Actualiza con tu dominio personalizado si lo tienes

#### 4. `NODE_ENV`
- Valor: `production`

### Configurar para cada entorno:

Vercel permite configurar variables para diferentes entornos:
- **Production**: Para producción
- **Preview**: Para branches de preview
- **Development**: Para desarrollo local

**Recomendación**: Configura al menos `Production` y `Preview`.

## 🗄️ Paso 3: Configurar Base de Datos

### Opción A: Base de Datos MySQL Existente

Si ya tienes una base de datos MySQL:

1. **Asegúrate de que sea accesible desde internet**
   - Configura el firewall para permitir conexiones desde Vercel
   - Vercel usa IPs dinámicas, considera usar un servicio como [PlanetScale](https://planetscale.com)

2. **Ejecuta las migraciones**
   - Puedes hacerlo localmente antes del deploy:
     ```bash
     pnpm db:migrate
     ```
   - O usar Prisma Studio después del deploy

### Opción B: Usar PlanetScale (Recomendado)

1. **Crear cuenta en PlanetScale**
   - Ve a [planetscale.com](https://planetscale.com)
   - Crea una cuenta gratuita

2. **Crear base de datos**
   - Crea una nueva base de datos
   - Copia la URL de conexión (formato: `mysql://...`)

3. **Actualizar `DATABASE_URL` en Vercel**
   - Usa la URL de PlanetScale como `DATABASE_URL`

4. **Ejecutar migraciones**
   ```bash
   # Localmente, con la nueva DATABASE_URL
   pnpm db:migrate
   ```

## 🚀 Paso 4: Desplegar

1. **Haz clic en "Deploy"**
   - Vercel comenzará el proceso de build automáticamente

2. **Monitorea el build**
   - Puedes ver los logs en tiempo real
   - El build incluye:
     - Instalación de dependencias (`pnpm install`)
     - Generación del cliente de Prisma (`prisma generate`)
     - Build de Next.js (`next build`)

3. **Espera a que termine**
   - El primer deploy puede tardar 2-5 minutos
   - Verás una URL cuando termine: `https://tu-proyecto.vercel.app`

## ✅ Paso 5: Verificar Deployment

1. **Visita la URL de tu aplicación**
   - Deberías ver la página de login

2. **Verifica la conexión a la base de datos**
   - Intenta iniciar sesión
   - Si hay errores, revisa los logs en Vercel

3. **Revisa los logs si hay problemas**
   - Ve a **"Deployments"** → Selecciona el deployment → **"View Function Logs"**

## 🔄 Paso 6: Configurar Auto-Deploy

Vercel está configurado para hacer auto-deploy en cada push a `main`:

- ✅ Push a `main` → Deploy automático a producción
- ✅ Pull Request → Deploy de preview automático

## 🛠️ Troubleshooting

### Error: "Prisma Client not generated"

**Solución**: El script `postinstall` debería generar el cliente automáticamente. Si no funciona:
- Verifica que `prisma generate` esté en el script `postinstall` en `package.json`
- Revisa los logs de build en Vercel

### Error: "Database connection failed"

**Solución**:
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos sea accesible desde internet
- Revisa el firewall de tu base de datos

### Error: "NEXTAUTH_SECRET is missing"

**Solución**:
- Asegúrate de haber configurado `NEXTAUTH_SECRET` en las variables de entorno
- Regenera el secret si es necesario

### Build falla

**Solución**:
- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `pnpm-lock.yaml` esté en el repositorio

## 📝 Notas Importantes

1. **Primera vez**: Después del primer deploy, actualiza `NEXTAUTH_URL` con la URL real de Vercel
2. **Base de datos**: Si usas MySQL local, necesitarás una base de datos en la nube o un túnel (ngrok, etc.)
3. **Migraciones**: Ejecuta las migraciones antes del primer deploy o después usando Prisma Studio
4. **Dominio personalizado**: Puedes configurar un dominio personalizado en Vercel después del deploy

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Vercel. Cada push a `main` desplegará automáticamente una nueva versión.

---

**¿Necesitas ayuda?** Revisa los logs en Vercel o consulta la [documentación de Vercel](https://vercel.com/docs).


# CRM Dental - Sistema de Gestión de Consultorios Dentales

Sistema completo de gestión para consultorios dentales desarrollado con Next.js, TypeScript, Prisma y MySQL.

## 🚀 Características

- **Gestión de Pacientes**: Registro completo con DNI, contacto, historial médico
- **Sistema de Turnos**: Calendario visual con vistas mensual, semanal y diaria
- **Historia Clínica**: Registro de evolución y archivos adjuntos
- **Gestión de Leads**: Seguimiento de leads desde diferentes fuentes
- **Multi-Consultorio**: Soporte para múltiples consultorios
- **Catálogo de Tratamientos**: Gestión de tratamientos con precios y duraciones
- **Unificación de Duplicados**: Herramienta para detectar y unificar pacientes duplicados

## 🛠️ Tecnologías

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL (Prisma ORM)
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **Calendario**: FullCalendar
- **Estado**: TanStack Query (React Query)

## 📋 Requisitos Previos

- Node.js 18+ 
- pnpm (o npm/yarn)
- MySQL 8.0+
- Cuenta de Vercel (para deployment)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/malagadesign/crm-dental.git
cd crm-dental
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="mysql://usuario:password@localhost:3306/crm_dental"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# (Opcional) Poblar con datos de ejemplo
pnpm db:seed
```

5. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Deployment en Vercel

1. **Conectar repositorio a Vercel**
   - Ve a [Vercel](https://vercel.com)
   - Importa el repositorio de GitHub
   - Vercel detectará automáticamente Next.js

2. **Configurar variables de entorno en Vercel**
   - `DATABASE_URL`: URL de tu base de datos MySQL
   - `NEXTAUTH_SECRET`: Genera uno con `openssl rand -base64 32`
   - `NEXTAUTH_URL`: URL de tu aplicación en Vercel

3. **Configurar Build Settings**
   - Build Command: `pnpm build` (o `npm run build`)
   - Output Directory: `.next`
   - Install Command: `pnpm install` (o `npm install`)

4. **Desplegar**
   - Vercel desplegará automáticamente en cada push a `main`

## 📁 Estructura del Proyecto

```
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── calendar/         # Componentes del calendario
│   ├── patients/         # Componentes de pacientes
│   └── ui/               # Componentes UI base
├── lib/                   # Utilidades y configuraciones
├── prisma/                # Schema y seed de Prisma
├── types/                 # Tipos TypeScript
└── public/               # Archivos estáticos
```

## 🔐 Usuario por Defecto

Después de ejecutar el seed, puedes iniciar sesión con:
- Email: `admin@example.com`
- Password: `password`

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

## 📝 Scripts Disponibles

- `pnpm dev` - Inicia servidor de desarrollo
- `pnpm build` - Construye para producción
- `pnpm start` - Inicia servidor de producción
- `pnpm db:generate` - Genera cliente de Prisma
- `pnpm db:migrate` - Ejecuta migraciones
- `pnpm db:seed` - Pobla la base de datos
- `pnpm db:studio` - Abre Prisma Studio

## 📦 Backup del Proyecto Anterior

El proyecto anterior de Laravel/Filament está archivado en la carpeta `/bck` para referencia.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 🆘 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

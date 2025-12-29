# Estructura del Proyecto

## 📁 Organización de Carpetas

```
nextjs-crm/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Grupo de rutas de autenticación
│   │   └── login/               # Página de login
│   ├── (dashboard)/             # Grupo de rutas del dashboard (protegidas)
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── patients/            # Gestión de pacientes (por implementar)
│   │   ├── appointments/        # Gestión de turnos (por implementar)
│   │   ├── clinics/             # Gestión de consultorios (por implementar)
│   │   ├── treatments/          # Gestión de tratamientos (por implementar)
│   │   ├── leads/               # Gestión de leads (por implementar)
│   │   └── layout.tsx           # Layout del dashboard
│   ├── api/                     # API Routes
│   │   └── auth/                # NextAuth endpoints
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página principal (redirige a login)
│
├── components/                   # Componentes React
│   ├── ui/                      # Componentes de shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── avatar.tsx
│   ├── layout/                  # Componentes de layout
│   │   ├── sidebar.tsx          # Barra lateral de navegación
│   │   └── header.tsx           # Header con usuario
│   └── providers.tsx            # Providers (React Query, NextAuth)
│
├── lib/                         # Utilidades y helpers
│   ├── utils.ts                 # Funciones utilitarias (cn, formatCurrency, etc.)
│   └── prisma.ts                # Cliente de Prisma (singleton)
│
├── hooks/                       # Custom React Hooks (por implementar)
│
├── types/                       # TypeScript types
│   ├── index.ts                 # Types principales
│   └── next-auth.d.ts           # Types de NextAuth
│
├── prisma/                      # Prisma
│   └── schema.prisma            # Schema de la base de datos
│
├── public/                      # Archivos estáticos
│
└── [config files]              # Configuración (package.json, tsconfig.json, etc.)
```

## 🎯 Componentes Implementados

### ✅ Completados

- **Autenticación:**
  - Login page
  - NextAuth configuration
  - Protected routes

- **Layout:**
  - Sidebar navigation
  - Header with user menu
  - Dashboard layout

- **UI Components:**
  - Button
  - Input
  - Card
  - Label
  - Dropdown Menu
  - Avatar

- **Base:**
  - Prisma schema
  - TypeScript types
  - Utilities
  - Providers setup

### 🚧 Por Implementar

- **Páginas:**
  - `/dashboard/patients` - Lista y gestión de pacientes
  - `/dashboard/appointments` - Calendario y gestión de turnos
  - `/dashboard/clinics` - Gestión de consultorios
  - `/dashboard/treatments` - Catálogo de tratamientos
  - `/dashboard/leads` - Gestión de leads

- **Componentes:**
  - Data tables (con react-table)
  - Forms (con react-hook-form + zod)
  - Calendar component
  - File upload
  - Modals/Dialogs
  - Toast notifications

- **Features:**
  - CRUD completo para cada entidad
  - Validación de solapamiento de turnos
  - Historia clínica con archivos
  - Filtros y búsqueda
  - Exportación de datos

## 🔄 Próximos Pasos

1. **Implementar páginas principales:**
   - Empezar con Patients (más simple)
   - Luego Appointments (más complejo)
   - Resto de módulos

2. **Agregar más componentes UI:**
   - Table
   - Dialog
   - Select
   - DatePicker
   - Toast

3. **Implementar features avanzadas:**
   - Calendario visual
   - Búsqueda y filtros
   - Exportación
   - Notificaciones

4. **Optimizaciones:**
   - Caching con React Query
   - Optimistic updates
   - Loading states
   - Error handling

## 📚 Convenciones

### Naming
- **Componentes:** PascalCase (`PatientList.tsx`)
- **Hooks:** camelCase con prefijo `use` (`usePatients.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Types:** PascalCase (`Patient`, `AppointmentWithRelations`)

### Estructura de Archivos
- Un componente por archivo
- Types en `types/` o inline si son específicos
- Hooks en `hooks/`
- Utils en `lib/`

### Imports
- Usar path aliases (`@/components/...`)
- Agrupar imports (React, Next, third-party, local)
- Orden alfabético dentro de grupos

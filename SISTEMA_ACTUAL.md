# Información del Sistema Actual - CRM Dental

## 1. Stack Tecnológico

### Frontend y Framework
- **Next.js**: 14.2.35
- **App Router**: Sí (estructura `app/` directory)
- **React**: 18.3.1
- **TypeScript**: 5.3.3

### Autenticación
- **NextAuth.js**: 4.24.5
- **Estrategia**: JWT (JSON Web Tokens)
- **Provider**: Credentials (email/password)
- **Roles**: admin, secretary, odontologo (almacenados como String)

### Base de Datos
- **ORM**: Prisma 5.7.1
- **Base de Datos**: PostgreSQL (Supabase)
- **Provider**: postgresql

### UI y Estado
- **Styling**: Tailwind CSS 3.4.0
- **Componentes**: Radix UI
- **Estado**: TanStack Query (React Query) 5.17.0
- **Formularios**: React Hook Form 7.49.2
- **Validación**: Zod 3.22.4

### Calendario
- **FullCalendar**: 6.1.20 (con plugins: daygrid, timegrid, interaction, react)

---

## 2. Tablas Principales de Supabase (Prisma Schema)

### `patients` (Pacientes)
```prisma
- id: Int @id @default(autoincrement())
- firstName: String (first_name)
- lastName: String (last_name)
- dni: String? @unique  // Identificador único opcional
- birthDate: DateTime? (birth_date)
- phone: String?
- email: String?
- address: String?
- origin: PatientOrigin (instagram, recomendacion, google, otro)
- notes: String? @db.Text
- createdAt: DateTime
- updatedAt: DateTime

Relaciones:
- appointments: Appointment[]
- medicalRecords: MedicalRecord[]
- leads: Lead[]
```

### `appointments` (Turnos)
```prisma
- id: Int @id @default(autoincrement())
- patientId: Int (patient_id) → Patient
- clinicId: Int (clinic_id) → Clinic
- treatmentId: Int? (treatment_id) → Treatment (opcional)
- userId: Int? (user_id) → User (odontólogo, opcional)
- datetimeStart: DateTime (datetime_start)
- datetimeEnd: DateTime (datetime_end)
- status: AppointmentStatus (confirmado, cancelado, asistio, no_asistio)
- notes: String?  // Notas del turno
- createdAt: DateTime
- updatedAt: DateTime

Índices: [userId, datetimeStart, datetimeEnd]
```

### `treatments` (Tratamientos/Catálogo)
```prisma
- id: Int @id @default(autoincrement())
- name: String
- description: String?
- price: Decimal(10, 2)
- durationMinutes: Int @default(30) (duration_minutes)
- active: Boolean @default(true)
- createdAt: DateTime
- updatedAt: DateTime

Relaciones:
- appointments: Appointment[]
```

### `medical_records` (Historia Clínica/Notas Clínicas)
```prisma
- id: Int @id @default(autoincrement())
- patientId: Int (patient_id) → Patient
- appointmentId: Int? (appointment_id) → Appointment (opcional, puede estar relacionado con un turno)
- userId: Int? (user_id) → User (quien creó el registro)
- recordDate: DateTime (record_date)
- notes: String  // Texto libre con las notas clínicas
- attachments: String?  // JSON como string (para archivos adjuntos futuros)
- createdAt: DateTime
- updatedAt: DateTime
```

### `clinics` (Consultorios)
```prisma
- id: Int @id @default(autoincrement())
- name: String
- address: String?
- phone: String?
- email: String?
- createdAt: DateTime
- updatedAt: DateTime

Relaciones:
- appointments: Appointment[]
```

### `users` (Usuarios/Odontólogos/Administradores/Secretarias)
```prisma
- id: Int @id @default(autoincrement())
- name: String
- email: String @unique
- password: String (hasheado con bcryptjs)
- role: String @default("admin")  // "admin", "secretary", "odontologo"
- emailVerifiedAt: DateTime?
- rememberToken: String?
- createdAt: DateTime
- updatedAt: DateTime

Relaciones:
- appointments: Appointment[]
- medicalRecords: MedicalRecord[]
```

### `leads` (Leads/Prospectos)
```prisma
- id: Int @id @default(autoincrement())
- firstName: String? (first_name)
- lastName: String? (last_name)
- phone: String?
- email: String?
- origin: LeadOrigin (instagram, google, facebook, recomendacion, otro)
- message: String?
- status: LeadStatus (nuevo, contactado, convertido, descartado)
- patientId: Int? (patient_id) → Patient (cuando se convierte en paciente)
- createdAt: DateTime
- updatedAt: DateTime
```

---

## 3. Cómo se Guardan los Tratamientos Realizados

**Modelo actual:** Los tratamientos realizados se guardan de **múltiples formas**:

### A. Por Turno (Appointment)
- **Campo**: `Appointment.treatmentId` (opcional)
- **Relación**: Muchos a uno con `Treatment` (catálogo de tratamientos)
- **Uso**: Se selecciona un tratamiento del catálogo al crear/editar un turno
- **Limitación**: Solo permite UN tratamiento por turno
- **Notas adicionales**: Se pueden agregar en `Appointment.notes` (texto libre)

### B. Por Nota Clínica (MedicalRecord)
- **Campo**: `MedicalRecord.notes` (texto libre)
- **Relación opcional**: `MedicalRecord.appointmentId` (puede estar relacionado con un turno)
- **Uso**: Se describe en texto libre qué tratamientos se realizaron
- **Ventaja**: Permite múltiples tratamientos y mayor detalle
- **Limitación**: No hay estructura para múltiples tratamientos específicos con precios, dientes, etc.

### C. Por Notas del Turno
- **Campo**: `Appointment.notes` (texto libre)
- **Uso**: Notas adicionales sobre el turno, pueden incluir tratamientos realizados

**Resumen**: Actualmente NO hay una tabla específica de "tratamientos realizados" por visita. Es un modelo **híbrido**:
- Si es un tratamiento del catálogo → se usa `Appointment.treatmentId`
- Si son múltiples tratamientos o detalles → se usa `MedicalRecord.notes` o `Appointment.notes` (texto libre)

**No hay registro estructurado de**:
- Múltiples tratamientos por visita
- Qué dientes fueron tratados
- Estado de los dientes (odontograma)
- Plan de tratamiento estructurado

---

## 4. Identificación del Paciente

### Primary Key (PK)
- **Campo**: `Patient.id`
- **Tipo**: `Int` (Integer, autoincrement)
- **Uso**: Clave primaria interna del sistema

### Identificador Único Externo
- **Campo**: `Patient.dni`
- **Tipo**: `String` opcional con constraint `@unique`
- **Uso**: DNI (Documento Nacional de Identidad argentino)
- **Características**:
  - Es opcional (puede ser `null`)
  - Es único (no puede haber dos pacientes con el mismo DNI)
  - Se usa para búsqueda y identificación del paciente
  - Se extrae automáticamente con OCR desde imágenes de DNI

**Formato de búsqueda**: El sistema permite buscar por DNI, pero la identificación principal es el `id` numérico.

---

## 5. Pantalla de Ficha del Paciente

**Ruta**: `/dashboard/patients/[id]`

### Información Mostrada

#### A. Header
- Nombre completo del paciente
- Botón "Nueva Nota Clínica"
- Botón "Volver" a la lista de pacientes

#### B. Información Personal (Card)
- DNI
- Fecha de Nacimiento
- Teléfono
- Email
- Dirección
- Origen (cómo llegó el paciente)
- Notas generales del paciente

#### C. Estadísticas (Card)
- Total de Turnos (count de `appointments`)
- Cantidad de Notas Clínicas (count de `medicalRecords`)
- Fecha de Registro (`createdAt`)

#### D. Historia Clínica (Card)
- Lista de todas las `MedicalRecord` ordenadas por fecha descendente
- Para cada registro muestra:
  - Fecha (`recordDate`)
  - Usuario que creó el registro (`user.name`)
  - Notas (`notes` - texto completo)
  - Si está relacionado con un turno (`appointment.datetimeStart`)

#### E. Historial de Turnos (Card)
- Lista de todos los `Appointment` ordenados por fecha descendente
- Para cada turno muestra:
  - Fecha y hora (`datetimeStart`)
  - Estado con badge de color (`status`)
  - Consultorio (`clinic.name`)
  - Tratamiento si existe (`treatment.name`)
  - Odontólogo si existe (`user.name`)
  - Duración calculada
  - Notas del turno si existen (`notes`)

### Acciones Disponibles
1. **Nueva Nota Clínica**: Abre modal para crear `MedicalRecord`
   - Fecha
   - Relacionar con turno (opcional)
   - Notas (texto libre)

2. **Link al Paciente**: Desde el nombre se puede navegar a la ficha completa

3. **Historial completo**: Ver todos los turnos del paciente

**NO hay acciones para**:
- Editar datos del paciente desde esta pantalla (se hace desde la lista)
- Ver/editar odontograma
- Ver plan de tratamiento estructurado
- Agregar múltiples tratamientos realizados en una visita

---

## 6. Odontograma - Nivel de Detalle

**Estado actual**: **NO existe odontograma** en el sistema actual.

### No hay:
- Representación visual de la boca/dientes
- Registro de estado de dientes (sano, cariado, obturado, etc.)
- Diagrama odontológico
- Historial de tratamientos por diente
- Estado de piezas dentales

### Lo que SÍ existe relacionado:
- `MedicalRecord.notes`: Se puede escribir texto libre sobre estado dental
- `Appointment.treatmentId`: Relación con un tratamiento genérico del catálogo
- `Appointment.notes`: Notas del turno que pueden mencionar dientes

### Recomendación para Odontograma:

**Opción 1: Simple (Recomendado para empezar)**
- Representación visual básica de 32 dientes (numeración universal)
- Estados simples por diente: Sano, Cariado, Obturado, Ausente, Corona, etc.
- Registro por visita: qué diente se trató y con qué tratamiento
- Historial por diente: ver evolución de cada diente

**Opción 2: Completo (Más avanzado)**
- Vista completa de odontograma (superior/inferior, izquierda/derecha)
- Estados más detallados (caries profunda, endodoncia, implante, etc.)
- Plan de tratamiento estructurado
- Múltiples tratamientos por diente con fechas
- Imágenes/radiografías por diente
- Notas específicas por diente

**Sugerencia**: Empezar con **Opción 1 (Simple)** y luego expandir a **Opción 2 (Completo)** según necesidades.

---

## 7. Resumen de Relaciones Clave

```
Patient (1) ──→ (N) Appointment ──→ (1) Treatment (opcional)
Patient (1) ──→ (N) Appointment ──→ (1) Clinic
Patient (1) ──→ (N) Appointment ──→ (1) User (odontólogo, opcional)
Patient (1) ──→ (N) MedicalRecord ──→ (1) Appointment (opcional)
Patient (1) ──→ (N) MedicalRecord ──→ (1) User (quien creó)
```

---

## 8. Estructura de Carpetas (App Router)

```
app/
├── (auth)/login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── dashboard/
│       ├── page.tsx (dashboard principal)
│       ├── appointments/page.tsx (lista de turnos)
│       ├── calendar/page.tsx (calendario)
│       ├── patients/
│       │   ├── page.tsx (lista de pacientes)
│       │   └── [id]/page.tsx (ficha del paciente)
│       ├── treatments/page.tsx (catálogo de tratamientos)
│       ├── clinics/page.tsx (consultorios)
│       ├── leads/page.tsx (prospectos)
│       ├── users/page.tsx (usuarios)
│       └── profile/page.tsx (perfil del usuario)
└── api/ (API routes)
```

---

## Notas Adicionales

- **Roles de usuario**: `admin`, `secretary`, `odontologo` (almacenados como String, no enum)
- **Autenticación**: NextAuth.js con JWT, no hay OAuth
- **Base de datos**: PostgreSQL en Supabase, Prisma como ORM
- **Deployment**: Vercel (según configuración anterior)
- **OCR**: Implementado para extraer datos de DNI argentino con Google Cloud Vision API

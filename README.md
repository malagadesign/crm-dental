# CRM Dental

Sistema de gestión para consultorios dentales desarrollado con Laravel 11 y FilamentPHP.

## Características

- ✅ **Gestión de Pacientes**: CRUD completo con historial clínico
- ✅ **Historia Clínica**: Sistema de notas de evolución por fecha con archivos adjuntos
- ✅ **Gestión de Consultorios**: Soporte para múltiples consultorios
- ✅ **Sistema de Turnos**: Agenda con validación de solapamientos
- ✅ **Catálogo de Tratamientos**: Precios y duraciones configurables
- ✅ **Gestión de Leads**: Seguimiento de leads desde Instagram y otras fuentes

## Requisitos

- PHP >= 8.2
- Composer
- MySQL >= 5.7 o MariaDB >= 10.3
- Node.js y NPM (para compilar assets si es necesario)

## Instalación

1. **Clonar el repositorio o descargar el proyecto**

2. **Instalar dependencias:**
   ```bash
   composer install
   ```

3. **Configurar el archivo .env:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configurar la base de datos en `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=crm_dental
   DB_USERNAME=tu_usuario
   DB_PASSWORD=tu_contraseña
   ```

5. **Ejecutar migraciones y seeders:**
   ```bash
   php artisan migrate --seed
   ```

6. **Iniciar el servidor de desarrollo:**
   ```bash
   php artisan serve
   ```

7. **Acceder al panel de administración:**
   - URL: `http://localhost:8000/admin`
   - Email: `admin@example.com`
   - Contraseña: `password`

## Estructura de la Base de Datos

### Tablas Principales:

- **users**: Usuarios del sistema (odontólogos, asistentes)
- **clinics**: Consultorios
- **patients**: Pacientes
- **appointments**: Turnos/agendas
- **treatments**: Catálogo de tratamientos
- **medical_records**: Historia clínica de pacientes
- **leads**: Leads captados desde Instagram u otras fuentes

## Funcionalidades Principales

### Gestión de Pacientes
- Crear, editar y eliminar pacientes
- Campos: Nombre, DNI, teléfono, email, dirección, origen (Instagram, Recomendación, Google, etc.)
- Acceso directo a la historia clínica desde la vista del paciente

### Historia Clínica
- Agregar notas de evolución por fecha
- Editor de texto enriquecido
- Subir archivos adjuntos (imágenes, PDFs)
- Filtros por rango de fechas

### Sistema de Turnos
- Crear turnos asociados a paciente, consultorio, tratamiento y odontólogo
- **Validación automática**: Previene que un odontólogo tenga turnos solapados en diferentes consultorios
- Estados: Confirmado, Cancelado, Asistió, No Asistió
- Filtros por consultorio, odontólogo, estado y rango de fechas

### Gestión de Consultorios
- Crear y gestionar múltiples consultorios
- Cada consultorio tiene dirección, teléfono y email

### Catálogo de Tratamientos
- Definir tratamientos con nombre, descripción, precio y duración
- La duración se usa automáticamente para calcular la hora de fin del turno
- Activar/desactivar tratamientos

### Gestión de Leads
- Seguimiento de leads desde diferentes fuentes
- Estados: Nuevo, Contactado, Convertido, Descartado
- Asociar leads convertidos a pacientes

## Próximas Fases

### Fase 2: Agenda Multi-Consultorio ✅ COMPLETADA
- ✅ Integración con calendario visual (FullCalendar)
- ✅ Vista de calendario mensual/semanal/diario
- ✅ Filtro por consultorio
- ✅ Colores por estado de turno (Confirmado, Cancelado, Asistió, No Asistió)
- ✅ Click en turno para editar

### Fase 3: Integración con Instagram
- Landing page pública para captación de leads
- Formulario optimizado para móviles
- Endpoint `/agendar` para compartir en la BIO de Instagram

### Fase 4: Odontograma
- Implementación de odontograma interactivo
- O solución temporal con subida de archivos

## Desarrollo

### Comandos Útiles

```bash
# Crear una nueva migración
php artisan make:migration nombre_de_la_migracion

# Crear un nuevo modelo
php artisan make:model NombreModelo

# Crear un recurso Filament
php artisan make:filament-resource NombreResource --generate

# Limpiar cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## Despliegue en Producción

1. **Configurar el archivo `.env` con datos de producción**

2. **Optimizar Laravel:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Si tienes acceso SSH al servidor:**
   ```bash
   git pull
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   ```

4. **Si solo tienes acceso FTP:**
   - Subir todos los archivos excepto `node_modules` y `vendor` (si no están en el servidor)
   - En el servidor, ejecutar `composer install` y `php artisan migrate`
   - Configurar el `.env` directamente en el servidor
   - Asegurarse de que la carpeta `public` sea la raíz del dominio

## Seguridad

- Cambiar la contraseña por defecto del usuario admin después de la instalación
- Configurar correctamente `APP_ENV=production` y `APP_DEBUG=false` en producción
- Asegurar que los permisos de archivos estén configurados correctamente

## Soporte

Para más información sobre Laravel: https://laravel.com/docs
Para más información sobre FilamentPHP: https://filamentphp.com/docs

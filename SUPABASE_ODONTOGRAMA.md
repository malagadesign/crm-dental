# Configuración Supabase para Odontograma

## 📋 Resumen

Se agregaron dos nuevas tablas al sistema:
- `tooth_events` - Historial de eventos odontológicos
- `tooth_states` - Estado actual por diente (optimización)

## ✅ Migración Automática

Las tablas, índices y constraints se crean automáticamente al ejecutar:
```bash
pnpm db:migrate
```

Prisma maneja todo lo necesario, incluyendo:
- ✅ Tablas `tooth_events` y `tooth_states`
- ✅ Foreign keys a `patients`, `appointments`, `medical_records`, `treatments`, `users`
- ✅ Índices optimizados:
  - `(patient_id, tooth_number, event_date DESC)` en `tooth_events`
  - `(appointment_id)` en `tooth_events`
  - `(medical_record_id)` en `tooth_events`
  - `UNIQUE(patient_id, tooth_number)` en `tooth_states`
  - `UNIQUE(last_event_id)` en `tooth_states`

## 🔐 Row Level Security (RLS) - Opcional

Si tienes **RLS habilitado** en Supabase, necesitas agregar políticas para las nuevas tablas.

### Opción 1: Si usas autenticación NextAuth (Recomendado)

Si todas las queries pasan por Next.js API routes con autenticación, puedes:

1. **Deshabilitar RLS para estas tablas** (si ya lo tienes habilitado globalmente):
```sql
ALTER TABLE tooth_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_states DISABLE ROW LEVEL SECURITY;
```

2. **O agregar políticas permisivas** (si prefieres mantener RLS):
```sql
-- Políticas para tooth_events
CREATE POLICY "Enable all for authenticated users" ON tooth_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para tooth_states
CREATE POLICY "Enable all for authenticated users" ON tooth_states
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Opción 2: Si usas autenticación Supabase Auth

Si planeas usar Supabase Auth directamente, necesitarías políticas más específicas:

```sql
-- Políticas para tooth_events basadas en user_id
CREATE POLICY "Users can view tooth events" ON tooth_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = tooth_events.patient_id
    )
  );

CREATE POLICY "Users can insert tooth events" ON tooth_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()::int
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::int
      AND users.role IN ('admin', 'odontologo', 'secretary')
    )
  );

-- Similar para tooth_states
CREATE POLICY "Users can view tooth states" ON tooth_states
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify tooth states" ON tooth_states
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## 🎯 Validaciones Adicionales (Opcional)

Si quieres agregar validaciones a nivel de base de datos además de las de Zod:

### Check constraint para tooth_number válido (FDI)

```sql
-- Validar que tooth_number sea un número FDI válido (11-18, 21-28, 31-38, 41-48)
ALTER TABLE tooth_events
  ADD CONSTRAINT check_valid_tooth_number
  CHECK (
    (tooth_number >= 11 AND tooth_number <= 18) OR
    (tooth_number >= 21 AND tooth_number <= 28) OR
    (tooth_number >= 31 AND tooth_number <= 38) OR
    (tooth_number >= 41 AND tooth_number <= 48)
  );

ALTER TABLE tooth_states
  ADD CONSTRAINT check_valid_tooth_number
  CHECK (
    (tooth_number >= 11 AND tooth_number <= 18) OR
    (tooth_number >= 21 AND tooth_number <= 28) OR
    (tooth_number >= 31 AND tooth_number <= 38) OR
    (tooth_number >= 41 AND tooth_number <= 48)
  );
```

### Check constraint para kind válido

```sql
-- Validar que kind sea un estado válido
ALTER TABLE tooth_events
  ADD CONSTRAINT check_valid_kind
  CHECK (
    kind IN (
      'healthy', 'caries', 'filled', 'crown', 'endo',
      'missing', 'extraction', 'implant', 'bridge',
      'fracture', 'watch'
    )
  );

ALTER TABLE tooth_states
  ADD CONSTRAINT check_valid_current_status
  CHECK (
    current_status IN (
      'healthy', 'caries', 'filled', 'crown', 'endo',
      'missing', 'extraction', 'implant', 'bridge',
      'fracture', 'watch'
    )
  );
```

**Nota:** Estas validaciones son redundantes ya que Zod valida en el API, pero proporcionan una capa adicional de seguridad a nivel de BD.

## 🔄 Triggers (No Necesarios)

**No necesitas triggers** porque:
- ✅ La actualización de `tooth_states` se maneja automáticamente en una **transacción Prisma** cuando se crea un evento (ver `app/api/odontogram/events/route.ts`)
- ✅ La consistencia está garantizada por la transacción
- ✅ Evita complejidad adicional en la base de datos

## 📊 Índices Adicionales (Opcional)

Los índices necesarios ya están definidos en Prisma. Si notas consultas lentas, podrías agregar:

```sql
-- Si necesitas buscar eventos por fecha específica
CREATE INDEX IF NOT EXISTS idx_tooth_events_event_date 
  ON tooth_events(event_date DESC);

-- Si necesitas buscar por usuario que creó el evento
CREATE INDEX IF NOT EXISTS idx_tooth_events_created_by 
  ON tooth_events(created_by_user_id);
```

## ✅ Verificación Post-Migración

Después de ejecutar `pnpm db:migrate`, verifica en Supabase:

1. **Tablas creadas:**
   - `tooth_events`
   - `tooth_states`

2. **Índices creados:**
   - Verifica en Supabase Dashboard → Database → Indexes

3. **Foreign keys:**
   - Verifica que todas las relaciones estén correctas

4. **Datos de prueba:**
   ```sql
   -- Verificar estructura
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'tooth_events'
   ORDER BY ordinal_position;
   ```

## 🚀 Listo para Usar

Una vez completada la migración, el odontograma estará listo para usar. No necesitas configuración adicional en Supabase si:
- ✅ Usas NextAuth (autenticación manejada por Next.js)
- ✅ Las queries pasan por API routes
- ✅ No tienes RLS habilitado

Si tienes dudas sobre tu configuración específica de Supabase, revisa el dashboard de Supabase para ver el estado actual de RLS y políticas.

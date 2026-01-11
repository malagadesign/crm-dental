-- ============================================================
-- SQL PARA CREAR TABLAS DE ODONTOGRAMA EN SUPABASE
-- ============================================================
-- Ejecutar este SQL solo si la migración de Prisma falla
-- o si necesitas crear/verificar las tablas manualmente
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA: tooth_events
-- ============================================================

CREATE TABLE IF NOT EXISTS "tooth_events" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "tooth_number" INTEGER NOT NULL,
  "kind" VARCHAR(255) NOT NULL,
  "treatment_id" INTEGER,
  "appointment_id" INTEGER,
  "medical_record_id" INTEGER,
  "note" TEXT,
  "event_date" TIMESTAMP(3) NOT NULL,
  "created_by_user_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT "tooth_events_patient_id_fkey" 
    FOREIGN KEY ("patient_id") 
    REFERENCES "patients"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "tooth_events_treatment_id_fkey" 
    FOREIGN KEY ("treatment_id") 
    REFERENCES "treatments"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  CONSTRAINT "tooth_events_appointment_id_fkey" 
    FOREIGN KEY ("appointment_id") 
    REFERENCES "appointments"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  CONSTRAINT "tooth_events_medical_record_id_fkey" 
    FOREIGN KEY ("medical_record_id") 
    REFERENCES "medical_records"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  CONSTRAINT "tooth_events_created_by_user_id_fkey" 
    FOREIGN KEY ("created_by_user_id") 
    REFERENCES "users"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
);

-- ============================================================
-- 2. CREAR TABLA: tooth_states
-- ============================================================

CREATE TABLE IF NOT EXISTS "tooth_states" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "tooth_number" INTEGER NOT NULL,
  "current_status" VARCHAR(255) NOT NULL,
  "last_event_id" INTEGER UNIQUE,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT "tooth_states_patient_id_fkey" 
    FOREIGN KEY ("patient_id") 
    REFERENCES "patients"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "tooth_states_last_event_id_fkey" 
    FOREIGN KEY ("last_event_id") 
    REFERENCES "tooth_events"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  -- Constraint único: un paciente solo puede tener un estado por diente
  CONSTRAINT "tooth_states_patient_id_tooth_number_key" 
    UNIQUE ("patient_id", "tooth_number")
);

-- ============================================================
-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================

-- Índice compuesto para búsquedas por paciente, diente y fecha (ordenado descendente)
CREATE INDEX IF NOT EXISTS "tooth_events_patient_id_tooth_number_event_date_idx" 
  ON "tooth_events"("patient_id", "tooth_number", "event_date" DESC);

-- Índice para búsquedas por appointment
CREATE INDEX IF NOT EXISTS "tooth_events_appointment_id_idx" 
  ON "tooth_events"("appointment_id");

-- Índice para búsquedas por medical_record
CREATE INDEX IF NOT EXISTS "tooth_events_medical_record_id_idx" 
  ON "tooth_events"("medical_record_id");

-- Índice para búsquedas por paciente y diente en tooth_states
CREATE INDEX IF NOT EXISTS "tooth_states_patient_id_tooth_number_idx" 
  ON "tooth_states"("patient_id", "tooth_number");

-- ============================================================
-- 4. VALIDACIONES OPCIONALES (CHECK CONSTRAINTS)
-- ============================================================
-- Descomenta estas líneas si quieres validaciones a nivel de BD
-- ============================================================

-- Validar que tooth_number sea un número FDI válido (11-48)
-- ALTER TABLE "tooth_events"
--   ADD CONSTRAINT "check_valid_tooth_number_events"
--   CHECK (
--     ("tooth_number" >= 11 AND "tooth_number" <= 18) OR
--     ("tooth_number" >= 21 AND "tooth_number" <= 28) OR
--     ("tooth_number" >= 31 AND "tooth_number" <= 38) OR
--     ("tooth_number" >= 41 AND "tooth_number" <= 48)
--   );

-- ALTER TABLE "tooth_states"
--   ADD CONSTRAINT "check_valid_tooth_number_states"
--   CHECK (
--     ("tooth_number" >= 11 AND "tooth_number" <= 18) OR
--     ("tooth_number" >= 21 AND "tooth_number" <= 28) OR
--     ("tooth_number" >= 31 AND "tooth_number" <= 38) OR
--     ("tooth_number" >= 41 AND "tooth_number" <= 48)
--   );

-- Validar que kind sea un estado válido
-- ALTER TABLE "tooth_events"
--   ADD CONSTRAINT "check_valid_kind"
--   CHECK (
--     "kind" IN (
--       'healthy', 'caries', 'filled', 'crown', 'endo',
--       'missing', 'extraction', 'implant', 'bridge',
--       'fracture', 'watch'
--     )
--   );

-- ALTER TABLE "tooth_states"
--   ADD CONSTRAINT "check_valid_current_status"
--   CHECK (
--     "current_status" IN (
--       'healthy', 'caries', 'filled', 'crown', 'endo',
--       'missing', 'extraction', 'implant', 'bridge',
--       'fracture', 'watch'
--     )
--   );

-- ============================================================
-- 5. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================
-- Esta función actualiza el campo updated_at cuando se modifica un registro

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para tooth_events
DROP TRIGGER IF EXISTS update_tooth_events_updated_at ON "tooth_events";
CREATE TRIGGER update_tooth_events_updated_at
    BEFORE UPDATE ON "tooth_events"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tooth_states
DROP TRIGGER IF EXISTS update_tooth_states_updated_at ON "tooth_states";
CREATE TRIGGER update_tooth_states_updated_at
    BEFORE UPDATE ON "tooth_states"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. VERIFICACIÓN POST-CREACIÓN
-- ============================================================
-- Ejecuta estas consultas para verificar que todo esté correcto

-- Verificar que las tablas fueron creadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tooth_events', 'tooth_states')
ORDER BY table_name;

-- Verificar estructura de tooth_events
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tooth_events'
ORDER BY ordinal_position;

-- Verificar estructura de tooth_states
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tooth_states'
ORDER BY ordinal_position;

-- Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('tooth_events', 'tooth_states')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar índices
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tooth_events', 'tooth_states')
ORDER BY tablename, indexname;

-- ============================================================
-- 7. LIMPIEZA (SOLO SI NECESITAS ELIMINAR TODO)
-- ============================================================
-- ⚠️ CUIDADO: Esto elimina las tablas y todos los datos
-- Solo ejecutar si necesitas empezar de cero

-- DROP TRIGGER IF EXISTS update_tooth_states_updated_at ON "tooth_states";
-- DROP TRIGGER IF EXISTS update_tooth_events_updated_at ON "tooth_events";
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS "tooth_states" CASCADE;
-- DROP TABLE IF EXISTS "tooth_events" CASCADE;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

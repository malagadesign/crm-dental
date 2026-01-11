-- ============================================================
-- SQL PARA CREAR TABLA DE GRUPOS IGNORADOS EN SUPABASE
-- ============================================================
-- Ejecutar este SQL si la migración de Prisma falla
-- o si necesitas crear/verificar la tabla manualmente
-- ============================================================

-- ============================================================
-- CREAR TABLA: ignored_duplicate_groups
-- ============================================================

CREATE TABLE IF NOT EXISTS "ignored_duplicate_groups" (
  "id" SERIAL PRIMARY KEY,
  "group_hash" VARCHAR(255) UNIQUE NOT NULL,
  "patient_ids" TEXT NOT NULL, -- JSON array de IDs de pacientes
  "reason" TEXT,
  "ignored_by" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT "ignored_duplicate_groups_ignored_by_fkey" 
    FOREIGN KEY ("ignored_by") 
    REFERENCES "users"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
);

-- ============================================================
-- CREAR ÍNDICES
-- ============================================================

-- Índice único ya está en la columna group_hash (UNIQUE constraint)
-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS "ignored_duplicate_groups_ignored_by_idx" 
  ON "ignored_duplicate_groups"("ignored_by");

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS "ignored_duplicate_groups_created_at_idx" 
  ON "ignored_duplicate_groups"("created_at" DESC);

-- ============================================================
-- FUNCIÓN Y TRIGGER PARA updated_at
-- ============================================================

-- Reutilizar la función existente o crear si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para ignored_duplicate_groups
DROP TRIGGER IF EXISTS update_ignored_duplicate_groups_updated_at ON "ignored_duplicate_groups";
CREATE TRIGGER update_ignored_duplicate_groups_updated_at
    BEFORE UPDATE ON "ignored_duplicate_groups"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICACIÓN POST-CREACIÓN
-- ============================================================

-- Verificar que la tabla fue creada
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'ignored_duplicate_groups';

-- Verificar estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ignored_duplicate_groups'
ORDER BY ordinal_position;

-- Verificar foreign key
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
  AND tc.table_name = 'ignored_duplicate_groups';

-- ============================================================
-- LIMPIEZA (SOLO SI NECESITAS ELIMINAR)
-- ============================================================
-- ⚠️ CUIDADO: Esto elimina la tabla y todos los datos

-- DROP TRIGGER IF EXISTS update_ignored_duplicate_groups_updated_at ON "ignored_duplicate_groups";
-- DROP TABLE IF EXISTS "ignored_duplicate_groups" CASCADE;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

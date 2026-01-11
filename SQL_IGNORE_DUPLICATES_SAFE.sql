-- ============================================================
-- SQL PARA CREAR TABLA DE GRUPOS IGNORADOS EN SUPABASE
-- VERSIÓN SIN OPERACIONES DROP (sin warnings)
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA: ignored_duplicate_groups
-- ============================================================

CREATE TABLE IF NOT EXISTS "ignored_duplicate_groups" (
  "id" SERIAL PRIMARY KEY,
  "group_hash" VARCHAR(255) UNIQUE NOT NULL,
  "patient_ids" TEXT NOT NULL,
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
-- 2. CREAR ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS "ignored_duplicate_groups_ignored_by_idx" 
  ON "ignored_duplicate_groups"("ignored_by");

CREATE INDEX IF NOT EXISTS "ignored_duplicate_groups_created_at_idx" 
  ON "ignored_duplicate_groups"("created_at" DESC);

-- ============================================================
-- 3. CREAR FUNCIÓN PARA updated_at (si no existe)
-- ============================================================
-- Esta función se puede reutilizar si ya existe del odontograma

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

-- ============================================================
-- 4. CREAR TRIGGER (si no existe)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ignored_duplicate_groups_updated_at'
  ) THEN
    CREATE TRIGGER update_ignored_duplicate_groups_updated_at
      BEFORE UPDATE ON "ignored_duplicate_groups"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- FIN - Ejecutar este SQL completo sin warnings
-- ============================================================

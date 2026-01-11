-- Fix: Resetear la secuencia de autoincremento para la tabla appointments
-- Este error ocurre cuando la secuencia está desincronizada con los datos reales
-- Ejecutar este script en Supabase SQL Editor

-- PASO 1: Verificar el nombre de la secuencia (ejecutar primero para confirmar)
-- SELECT pg_get_serial_sequence('appointments', 'id') AS sequence_name;

-- PASO 2: Resetear la secuencia (ejecutar esta línea)
-- Esto establece el próximo valor de la secuencia al MAX(id) + 1
SELECT setval(
  pg_get_serial_sequence('appointments', 'id'),
  COALESCE((SELECT MAX(id) FROM appointments), 0) + 1,
  false
);

-- PASO 3: Verificar que se corrigió (ejecutar después para confirmar)
-- SELECT 
--   currval(pg_get_serial_sequence('appointments', 'id')) AS current_sequence_value,
--   (SELECT MAX(id) FROM appointments) AS max_id_from_table;

-- Versión alternativa si la anterior no funciona (usar solo una opción):
-- SELECT setval('appointments_id_seq', COALESCE((SELECT MAX(id) FROM appointments), 0) + 1, false);

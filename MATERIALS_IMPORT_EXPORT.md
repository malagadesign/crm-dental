# Import/Export Masivo de Materiales

## Instalación

1. Instalar dependencias:
```bash
pnpm install
```

2. Regenerar cliente de Prisma (ya incluye los nuevos campos):
```bash
pnpm db:generate
```

## Funcionalidad

### Exportar Excel

1. Desde `/dashboard/materials`, hacer clic en "Exportar Excel"
2. Se descargará un archivo `materials_import.xlsx` con todos los materiales activos
3. El archivo incluye todas las columnas necesarias para editar e importar

### Importar Excel

1. Desde `/dashboard/materials`, hacer clic en "Importar Excel"
2. Seleccionar el archivo Excel (.xlsx)
3. Hacer clic en "Importar"
4. El sistema validará el archivo y procesará la importación
5. Se mostrará un resumen de materiales creados/actualizados y movimientos creados

## Formato del Excel

**Nombre de hoja:** `materials_import` (obligatorio)

**Columnas (en este orden):**

- `sku` (obligatorio) - Código único del material
- `name` (obligatorio si el material no existe) - Nombre del material
- `category` - Categoría del material
- `unit` - Unidad (debe ser: unidades, cajas, kg, litros, paquetes, rollos, frascos, bidones, bolsas, kits, packs)
- `min_stock` - Stock mínimo (número >= 0)
- `target_stock` - Stock objetivo (número >= 0)
- `critical` - Material crítico (true/false, TRUE/FALSE, si/no, 1/0)
- `consumable` - Es consumible (true/false, TRUE/FALSE, si/no, 1/0)
- `purchase_unit_label` - Etiqueta de unidad de compra (texto)
- `purchase_unit_size` - Tamaño de unidad de compra (número >= 0)
- `active` - Material activo (true/false, TRUE/FALSE, si/no, 1/0)
- `initial_stock` - Stock inicial a cargar (número >= 0). Si > 0, se crea un movimiento de entrada
- `reason` - Motivo del movimiento (opcional, si no se especifica y hay initial_stock, se usa "Stock inicial (Excel)")
- `movement_clinic_id` - ID del consultorio destinatario (opcional, se guarda en metadata)
- `movement_clinic_name` - Nombre del consultorio destinatario (opcional, se guarda en metadata)

## Reglas de Importación

1. **SKU obligatorio**: Todas las filas deben tener un SKU único
2. **Name obligatorio para nuevos materiales**: Si el SKU no existe en la base de datos, se requiere el campo `name`
3. **Upsert por SKU**: 
   - Si el SKU existe: se actualizan los campos especificados
   - Si el SKU no existe: se crea un nuevo material
4. **Stock inicial**: Si `initial_stock > 0`, se crea un movimiento de tipo "entrada"
5. **Transaccional**: Si hay algún error, NO se aplica ningún cambio (rollback completo)
6. **Validaciones**:
   - SKU único dentro del archivo
   - Unidades válidas (enum MaterialUnit)
   - Números >= 0 para stocks y tamaños
   - Booleanos válidos (acepta múltiples formatos)

## Permisos

- **admin**: Puede exportar e importar
- **odontologo**: Puede exportar e importar
- **secretary**: NO puede exportar ni importar (los botones no son visibles)

## Estructura de Archivos

- `lib/materials-import-export.ts` - Helpers para parsear/generar Excel y validación
- `app/api/materials/export/route.ts` - Endpoint GET para exportar
- `app/api/materials/import/route.ts` - Endpoint POST para importar
- `components/materials/materials-import-export.tsx` - Componente UI

## Pruebas Rápidas

1. **Exportar materiales existentes:**
   - Ir a `/dashboard/materials`
   - Clic en "Exportar Excel"
   - Verificar que se descarga el archivo correctamente

2. **Importar materiales nuevos:**
   - Exportar el Excel
   - Agregar una nueva fila con:
     - `sku`: "TEST-001"
     - `name`: "Material de Prueba"
     - `unit`: "unidades"
     - `initial_stock`: 100
   - Guardar y importar
   - Verificar que se crea el material y el movimiento

3. **Importar actualización:**
   - Exportar el Excel
   - Modificar `min_stock` de un material existente
   - Importar
   - Verificar que se actualiza el material

4. **Validación de errores:**
   - Crear un Excel con SKU duplicado
   - Intentar importar
   - Verificar que se muestran errores y NO se aplican cambios

## Notas Técnicas

- El stock (`current_stock`) **NUNCA** se modifica directamente
- Los movimientos se crean en `stock_movements` y los triggers SQL actualizan `current_stock` automáticamente
- Los materiales nuevos siempre inician con `current_stock = 0`
- La metadata de consultorio se guarda en `stock_movements.metadata` como JSONB
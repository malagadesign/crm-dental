import { z } from "zod";
import * as XLSX from "xlsx";

// Schema de validación para cada fila del Excel (en español)
export const materialImportRowSchema = z.object({
  sku: z.string().min(1, "SKU es obligatorio"),
  nombre: z.string().optional(),
  categoria: z.string().optional().nullable(),
  unidad: z
    .enum([
      "unidades",
      "cajas",
      "kg",
      "litros",
      "paquetes",
      "rollos",
      "frascos",
      "bidones",
      "bolsas",
      "kits",
      "packs",
    ])
    .optional(),
  stock_minimo: z
    .number()
    .nonnegative("Stock mínimo debe ser >= 0")
    .optional()
    .default(0),
  stock_objetivo: z
    .number()
    .nonnegative("Stock objetivo debe ser >= 0")
    .optional()
    .default(0),
  critico: z.boolean().optional().default(false),
  consumible: z.boolean().optional().default(true),
  unidad_compra: z.string().optional().nullable(),
  contenido_unidad: z
    .number()
    .nonnegative("Contenido por unidad debe ser >= 0")
    .optional()
    .nullable(),
  activo: z.boolean().optional().default(true),
  stock_inicial: z
    .number()
    .nonnegative("Stock inicial debe ser >= 0")
    .optional()
    .default(0),
  motivo: z.string().optional().nullable(),
  consultorio: z.string().optional().nullable(),
});

export type MaterialImportRow = z.infer<typeof materialImportRowSchema>;

// Helper para normalizar valores booleanos en español
export function parseBooleanEs(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return (
      lower === "true" ||
      lower === "verdadero" ||
      lower === "si" ||
      lower === "sí" ||
      lower === "1" ||
      lower === "yes"
    );
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

// Helper para normalizar nombre de consultorio (case-insensitive + trim)
export function normalizeClinicName(name: string | null | undefined): string | null {
  if (!name || typeof name !== "string") return null;
  return name.trim();
}

// Helper para parsear número o devolver 0
export function parseNumberOrZero(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper para parsear número o null
export function parseNumberOrNull(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Parsear fila del Excel a objeto validado
export function parseExcelRow(
  row: any,
  rowIndex: number
): {
  data: MaterialImportRow | null;
  errors: Array<{ row: number; column: string; message: string }>;
} {
  const errors: Array<{ row: number; column: string; message: string }> = [];
  const rowNumber = rowIndex + 2; // +2 porque Excel empieza en 1 y tiene encabezado
  let data: any = {};

  // SKU obligatorio
  if (!row.SKU || String(row.SKU).trim() === "") {
    errors.push({
      row: rowNumber,
      column: "SKU",
      message: "SKU es obligatorio",
    });
    return { data: null, errors };
  }
  data.sku = String(row.SKU).trim();

  // Nombre (obligatorio solo si el material no existe)
  if (row.Nombre !== undefined && row.Nombre !== null && row.Nombre !== "") {
    data.nombre = String(row.Nombre).trim();
  }

  // Categoría
  if (
    row.Categoría !== undefined &&
    row.Categoría !== null &&
    row.Categoría !== ""
  ) {
    data.categoria = String(row.Categoría).trim() || null;
  }

  // Unidad
  if (row.Unidad) {
    const unit = String(row.Unidad).trim().toLowerCase();
    const validUnits = [
      "unidades",
      "cajas",
      "kg",
      "litros",
      "paquetes",
      "rollos",
      "frascos",
      "bidones",
      "bolsas",
      "kits",
      "packs",
    ];
    if (validUnits.includes(unit)) {
      data.unidad = unit;
    } else {
      errors.push({
        row: rowNumber,
        column: "Unidad",
        message: `"${row.Unidad}" no es válida. Valores permitidos: ${validUnits.join(", ")}`,
      });
    }
  }

  // Stock mínimo
  const stockMinimo = parseNumberOrNull(row["Stock mínimo"]);
  if (stockMinimo !== null) {
    if (stockMinimo < 0) {
      errors.push({
        row: rowNumber,
        column: "Stock mínimo",
        message: "Debe ser >= 0",
      });
    } else {
      data.stock_minimo = stockMinimo;
    }
  }

  // Stock objetivo
  const stockObjetivo = parseNumberOrNull(row["Stock objetivo"]);
  if (stockObjetivo !== null) {
    if (stockObjetivo < 0) {
      errors.push({
        row: rowNumber,
        column: "Stock objetivo",
        message: "Debe ser >= 0",
      });
    } else {
      data.stock_objetivo = stockObjetivo;
    }
  }

  // Crítico
  if (
    row.Crítico !== undefined &&
    row.Crítico !== null &&
    row.Crítico !== ""
  ) {
    data.critico = parseBooleanEs(row.Crítico);
  }

  // Consumible
  if (
    row.Consumible !== undefined &&
    row.Consumible !== null &&
    row.Consumible !== ""
  ) {
    data.consumible = parseBooleanEs(row.Consumible);
  }

  // Unidad de compra
  if (
    row["Unidad de compra"] !== undefined &&
    row["Unidad de compra"] !== null &&
    row["Unidad de compra"] !== ""
  ) {
    data.unidad_compra = String(row["Unidad de compra"]).trim() || null;
  }

  // Contenido por unidad
  const contenidoUnidad = parseNumberOrNull(row["Contenido por unidad"]);
  if (contenidoUnidad !== null) {
    if (contenidoUnidad < 0) {
      errors.push({
        row: rowNumber,
        column: "Contenido por unidad",
        message: "Debe ser >= 0",
      });
    } else {
      data.contenido_unidad = contenidoUnidad;
    }
  }

  // Activo
  if (
    row.Activo !== undefined &&
    row.Activo !== null &&
    row.Activo !== ""
  ) {
    data.activo = parseBooleanEs(row.Activo);
  }

  // Stock inicial
  const stockInicial = parseNumberOrNull(row["Stock inicial"]);
  if (stockInicial !== null) {
    if (stockInicial < 0) {
      errors.push({
        row: rowNumber,
        column: "Stock inicial",
        message: "Debe ser >= 0",
      });
    } else {
      data.stock_inicial = stockInicial;
    }
  }

  // Motivo
  if (row.Motivo !== undefined && row.Motivo !== null && row.Motivo !== "") {
    data.motivo = String(row.Motivo).trim() || null;
  }

  // Consultorio
  if (
    row.Consultorio !== undefined &&
    row.Consultorio !== null &&
    row.Consultorio !== ""
  ) {
    data.consultorio = normalizeClinicName(row.Consultorio);
  }

  // Validar con Zod
  try {
    const validated = materialImportRowSchema.parse(data);
    return { data: validated, errors };
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(
        ...error.errors.map((e) => ({
          row: rowNumber,
          column: e.path.join(".") || "General",
          message: e.message,
        }))
      );
    }
    return { data: null, errors };
  }
}

// Generar Excel desde materiales (en español)
export function generateMaterialsExcel(materials: any[]): Buffer {
  const workbook = XLSX.utils.book_new();

  const rows = materials.map((material) => ({
    SKU: material.sku || "",
    Nombre: material.name || "",
    Categoría: material.category || "",
    Unidad: material.unit || "unidades",
    "Stock mínimo": Number(material.minStock) || 0,
    "Stock objetivo": Number(material.targetStock) || 0,
    Crítico: material.critical || false,
    Consumible: material.consumable !== undefined ? material.consumable : true,
    "Unidad de compra": material.purchaseUnitLabel || "",
    "Contenido por unidad":
      material.purchaseUnitSize !== null && material.purchaseUnitSize !== undefined
        ? Number(material.purchaseUnitSize)
        : "",
    Activo: material.active !== undefined ? material.active : true,
    "Stock inicial": "", // Vacío para que el usuario complete
    Motivo: "", // Vacío
    Consultorio: "", // Vacío
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Materiales");

  // Convertir a buffer
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return Buffer.from(excelBuffer);
}

// Parsear Excel a array de objetos
export function parseMaterialsExcel(buffer: Buffer): {
  rows: MaterialImportRow[];
  errors: Array<{ row: number; column: string; message: string }>;
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = "Materiales";
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          column: "Hoja",
          message: `No se encontró la hoja "${sheetName}" en el archivo`,
        },
      ],
    };
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  const errors: Array<{ row: number; column: string; message: string }> = [];
  const rows: MaterialImportRow[] = [];

  // Verificar SKUs únicos dentro del archivo
  const skus = new Set<string>();
  data.forEach((row: any, index: number) => {
    const sku = row.SKU ? String(row.SKU).trim() : "";
    if (sku && skus.has(sku)) {
      errors.push({
        row: index + 2,
        column: "SKU",
        message: `SKU "${sku}" duplicado en el archivo`,
      });
    }
    if (sku) {
      skus.add(sku);
    }
  });

  // Parsear cada fila
  data.forEach((row: any, index: number) => {
    const parsed = parseExcelRow(row, index);
    errors.push(...parsed.errors);
    if (parsed.data) {
      rows.push(parsed.data);
    }
  });

  return { rows, errors };
}
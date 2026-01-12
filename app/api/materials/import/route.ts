import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseMaterialsExcel,
  MaterialImportRow,
  normalizeClinicName,
} from "@/lib/materials-import-export";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user?.role || "";
    if (userRole !== "admin" && userRole !== "odontologo") {
      return NextResponse.json(
        { error: "No tienes permiso para importar materiales" },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user?.id as string) || null;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Leer archivo como buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parsear Excel
    const { rows, errors: parseErrors } = parseMaterialsExcel(buffer);

    // Si hay errores de parsing, devolverlos sin procesar
    if (parseErrors.length > 0) {
      return NextResponse.json(
        {
          errors: parseErrors,
          createdMaterials: 0,
          updatedMaterials: 0,
          createdMovements: 0,
        },
        { status: 400 }
      );
    }

    // Validar que todos los materiales nuevos tengan nombre
    const validationErrors: Array<{
      row: number;
      column: string;
      message: string;
    }> = [];
    const existingMaterialsBySku = new Map<string, any>();

    // Pre-cargar materiales existentes por SKU
    const skus = rows.map((r) => r.sku).filter(Boolean);
    if (skus.length > 0) {
      const existing = await prisma.material.findMany({
        where: {
          sku: { in: skus },
        },
      });
      existing.forEach((m) => {
        if (m.sku) {
          existingMaterialsBySku.set(m.sku, m);
        }
      });
    }

    // Pre-cargar consultorios por nombre (case-insensitive)
    const clinicNames = rows
      .map((r) => normalizeClinicName(r.consultorio))
      .filter(Boolean) as string[];
    const clinicsMap = new Map<string, { id: number; name: string }>();

    if (clinicNames.length > 0) {
      // Obtener todos los consultorios y hacer match case-insensitive en memoria
      const allClinics = await prisma.clinic.findMany({
        select: { id: true, name: true },
      });

      // Crear mapa case-insensitive
      allClinics.forEach((clinic) => {
        const normalized = normalizeClinicName(clinic.name);
        if (normalized) {
          clinicsMap.set(normalized.toLowerCase(), clinic);
        }
      });
    }

    // Validar filas
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y tiene encabezado
      const exists = existingMaterialsBySku.has(row.sku);
      if (!exists && !row.nombre) {
        validationErrors.push({
          row: rowNumber,
          column: "Nombre",
          message:
            "El campo 'Nombre' es obligatorio para materiales nuevos (SKU no existe)",
        });
      }

      // Validar consultorio si viene
      if (row.consultorio && row.stock_inicial > 0) {
        const normalizedClinicName = normalizeClinicName(row.consultorio);
        if (normalizedClinicName) {
          const clinic = clinicsMap.get(normalizedClinicName.toLowerCase());
          if (!clinic) {
            validationErrors.push({
              row: rowNumber,
              column: "Consultorio",
              message: `No se encontró el consultorio "${row.consultorio}"`,
            });
          }
        }
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          errors: validationErrors,
          createdMaterials: 0,
          updatedMaterials: 0,
          createdMovements: 0,
        },
        { status: 400 }
      );
    }

    // Procesar en transacción
    let createdMaterials = 0;
    let updatedMaterials = 0;
    let createdMovements = 0;

    try {
      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          const existing = existingMaterialsBySku.get(row.sku);
          let materialId: number;

          if (existing) {
            // Actualizar material existente
            const updateData: any = {};
            if (row.nombre) updateData.name = row.nombre;
            if (row.categoria !== undefined) updateData.category = row.categoria;
            if (row.unidad) updateData.unit = row.unidad;
            if (row.stock_minimo !== undefined)
              updateData.minStock = row.stock_minimo;
            if (row.stock_objetivo !== undefined)
              updateData.targetStock = row.stock_objetivo;
            if (row.critico !== undefined) updateData.critical = row.critico;
            if (row.consumible !== undefined)
              updateData.consumable = row.consumible;
            if (row.unidad_compra !== undefined)
              updateData.purchaseUnitLabel = row.unidad_compra;
            if (row.contenido_unidad !== undefined)
              updateData.purchaseUnitSize = row.contenido_unidad;
            if (row.activo !== undefined) updateData.active = row.activo;

            await tx.material.update({
              where: { id: existing.id },
              data: updateData,
            });
            materialId = existing.id;
            updatedMaterials++;
          } else {
            // Crear nuevo material
            if (!row.nombre) {
              throw new Error(
                `SKU ${row.sku}: nombre es obligatorio para nuevos materiales`
              );
            }

            const newMaterial = await tx.material.create({
              data: {
                sku: row.sku,
                name: row.nombre,
                category: row.categoria || null,
                unit: row.unidad || "unidades",
                minStock: row.stock_minimo || 0,
                targetStock: row.stock_objetivo || 0,
                currentStock: 0, // Siempre inicia en 0
                critical: row.critico || false,
                consumable: row.consumible !== undefined ? row.consumible : true,
                purchaseUnitLabel: row.unidad_compra || null,
                purchaseUnitSize: row.contenido_unidad || null,
                active: row.activo !== undefined ? row.activo : true,
              },
            });
            materialId = newMaterial.id;
            createdMaterials++;
          }

          // Crear movimiento si hay stock_inicial > 0
          if (row.stock_inicial > 0) {
            const metadata: any = {};
            let clinicId: number | null = null;
            let clinicName: string | null = null;

            if (row.consultorio) {
              const normalizedClinicName = normalizeClinicName(row.consultorio);
              if (normalizedClinicName) {
                const clinic = clinicsMap.get(normalizedClinicName.toLowerCase());
                if (clinic) {
                  clinicId = clinic.id;
                  clinicName = clinic.name;
                  metadata.clinicId = clinic.id;
                  metadata.clinicName = clinic.name;
                }
              }
            }

            await tx.stockMovement.create({
              data: {
                materialId: materialId,
                type: "entrada",
                quantity: row.stock_inicial,
                reason: row.motivo || "Stock inicial (Excel)",
                userId: userId,
                metadata: Object.keys(metadata).length > 0 ? metadata : null,
              },
            });
            createdMovements++;
          }
        }
      });
    } catch (transactionError: any) {
      console.error("Transaction error:", transactionError);
      return NextResponse.json(
        {
          error: "Error procesando la importación",
          details: transactionError.message,
          errors: [],
          createdMaterials: 0,
          updatedMaterials: 0,
          createdMovements: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      createdMaterials,
      updatedMaterials,
      createdMovements,
      errors: [],
    });
  } catch (error: any) {
    console.error("Error importing materials:", error);
    return NextResponse.json(
      {
        error: "Error importing materials",
        details: error.message,
        errors: [],
        createdMaterials: 0,
        updatedMaterials: 0,
        createdMovements: 0,
      },
      { status: 500 }
    );
  }
}
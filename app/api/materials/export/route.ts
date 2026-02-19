import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMaterialsExcel } from "@/lib/materials-import-export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user?.role || "";
    if (userRole !== "admin" && userRole !== "odontologo") {
      return NextResponse.json(
        { error: "No tienes permiso para exportar materiales" },
        { status: 403 }
      );
    }

    // Obtener todos los materiales activos y no eliminados
    const materials = await prisma.material.findMany({
      where: {
        active: true,
        deletedAt: null,
      },
      orderBy: [
        { critical: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        unit: true,
        minStock: true,
        targetStock: true,
        critical: true,
        consumable: true,
        purchaseUnitLabel: true,
        purchaseUnitSize: true,
        active: true,
      },
    });

    // Generar Excel
    const excelBuffer = generateMaterialsExcel(materials);

    // Devolver como archivo
    return new NextResponse(excelBuffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="materials_import.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting materials:", error);
    return NextResponse.json(
      { error: "Error exporting materials", details: error.message },
      { status: 500 }
    );
  }
}
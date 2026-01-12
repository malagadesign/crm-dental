import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const materialSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  unit: z.enum(["unidades", "cajas", "kg", "litros", "paquetes", "rollos", "frascos", "bidones", "bolsas", "kits", "packs"]),
  price: z.number().nonnegative("El precio debe ser positivo").optional().nullable(),
  minStock: z.number().nonnegative("El stock mínimo debe ser positivo").default(0),
  targetStock: z.number().nonnegative("El stock objetivo debe ser positivo").default(0),
  // currentStock NO se acepta en creación - siempre se inicializa en 0, se actualiza mediante movimientos
  category: z.string().optional(),
  active: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: any = {
      active: true, // Siempre filtrar solo activos
      deletedAt: null, // Soft delete: filtrar eliminados
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(materials);
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Error fetching materials", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = materialSchema.parse(body);

    const material = await prisma.material.create({
      data: {
        name: data.name,
        description: data.description || null,
        unit: data.unit,
        price: data.price ?? null,
        minStock: data.minStock || 0,
        targetStock: data.targetStock || 0,
        currentStock: 0, // Siempre inicializar en 0, usar movimientos para cargar stock inicial
        category: data.category || null,
        active: data.active !== undefined ? data.active : true,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error("Error creating material:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error creating material", details: error.message },
      { status: 500 }
    );
  }
}

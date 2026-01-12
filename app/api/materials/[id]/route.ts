import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const materialUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.enum(["unidades", "cajas", "kg", "litros", "paquetes", "rollos", "frascos", "bidones", "bolsas", "kits", "packs"]).optional(),
  price: z.number().nonnegative().optional().nullable(),
  minStock: z.number().nonnegative().optional(),
  targetStock: z.number().nonnegative().optional(),
  category: z.string().optional().nullable(),
  active: z.boolean().optional(),
  // currentStock NO se puede editar desde la app, solo cambia mediante movimientos
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const material = await prisma.material.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        stockMovements: {
          orderBy: { movementDate: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error: any) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Error fetching material" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = materialUpdateSchema.parse(body);

    const material = await prisma.material.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.targetStock !== undefined && { targetStock: data.targetStock }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.active !== undefined && { active: data.active }),
        // currentStock NO se puede editar desde la app, solo cambia mediante movimientos (triggers SQL)
      },
    });

    return NextResponse.json(material);
  } catch (error: any) {
    console.error("Error updating material:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error updating material", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario sea admin
    const userRole = session.user.role || "secretary";
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar materiales" },
        { status: 403 }
      );
    }

    // Soft delete: actualizar deleted_at en lugar de eliminar físicamente
    await prisma.material.update({
      where: { id: parseInt(params.id) },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Error deleting material", details: error.message },
      { status: 500 }
    );
  }
}

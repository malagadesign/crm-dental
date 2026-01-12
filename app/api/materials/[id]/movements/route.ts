import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const movementSchema = z
  .object({
    type: z.enum(["entrada", "salida", "ajuste"]),
    quantity: z.number().positive("La cantidad debe ser positiva"),
    reason: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Si es ajuste, reason es obligatorio
      if (data.type === "ajuste") {
        return data.reason && typeof data.reason === "string" && data.reason.trim().length > 0;
      }
      return true;
    },
    {
      message: "El motivo es obligatorio para ajustes",
      path: ["reason"],
    }
  );

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const movements = await prisma.stockMovement.findMany({
      where: { materialId: parseInt(params.id) },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Error fetching stock movements" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validación de roles
    const userRole = session.user.role || "secretary";
    const body = await request.json();
    const data = movementSchema.parse(body);

    // Secretary no puede hacer ajustes
    if (data.type === "ajuste" && userRole === "secretary") {
      return NextResponse.json(
        { error: "Solo administradores y odontólogos pueden realizar ajustes" },
        { status: 403 }
      );
    }

    const userId = session.user.id ? parseInt(session.user.id) : null;

    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Solo crear el movimiento - los triggers SQL actualizarán el stock automáticamente
    const movement = await prisma.stockMovement.create({
      data: {
        materialId: parseInt(params.id),
        type: data.type,
        quantity: data.quantity,
        reason: data.reason?.trim() || null,
        userId: userId,
        movementDate: new Date(),
      },
    });

    const movementWithRelations = await prisma.stockMovement.findUnique({
      where: { id: movement.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        material: true,
      },
    });

    return NextResponse.json(movementWithRelations, { status: 201 });
  } catch (error: any) {
    console.error("Error creating stock movement:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    // Capturar errores del trigger SQL (stock negativo)
    if (error.message?.includes("Stock insuficiente") || error.message?.includes("insuficiente")) {
      return NextResponse.json(
        { error: "No hay suficiente stock disponible" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error creating stock movement", details: error.message },
      { status: 500 }
    );
  }
}

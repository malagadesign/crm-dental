import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Crear nueva tarea de turno
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, kind, description, dueOffsetMinutes } = body;

    if (!appointmentId || !kind) {
      return NextResponse.json(
        { error: "appointmentId y kind son requeridos" },
        { status: 400 }
      );
    }

    const parsedAppointmentId = parseInt(appointmentId.toString());
    if (isNaN(parsedAppointmentId)) {
      return NextResponse.json(
        { error: "appointmentId inválido" },
        { status: 400 }
      );
    }

    const task = await prisma.appointmentTask.create({
      data: {
        appointmentId: parsedAppointmentId,
        kind,
        description: description || null,
        dueOffsetMinutes:
          typeof dueOffsetMinutes === "number" ? dueOffsetMinutes : null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment task:", error);
    return NextResponse.json(
      { error: "Error creating appointment task" },
      { status: 500 }
    );
  }
}

// Obtener tareas de un turno (opcional, por si se necesita directo)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId es requerido" },
        { status: 400 }
      );
    }

    const parsedAppointmentId = parseInt(appointmentId);
    if (isNaN(parsedAppointmentId)) {
      return NextResponse.json(
        { error: "appointmentId inválido" },
        { status: 400 }
      );
    }

    const tasks = await prisma.appointmentTask.findMany({
      where: { appointmentId: parsedAppointmentId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching appointment tasks:", error);
    return NextResponse.json(
      { error: "Error fetching appointment tasks" },
      { status: 500 }
    );
  }
}


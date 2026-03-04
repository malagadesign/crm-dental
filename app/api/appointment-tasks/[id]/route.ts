import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Actualizar una tarea (por ahora principalmente toggle done)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { done } = body as { done?: boolean };

    const existing = await prisma.appointmentTask.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.appointmentTask.update({
      where: { id: taskId },
      data: {
        done: typeof done === "boolean" ? done : !existing.done,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment task:", error);
    return NextResponse.json(
      { error: "Error updating appointment task" },
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.appointmentTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment task:", error);
    return NextResponse.json(
      { error: "Error deleting appointment task" },
      { status: 500 }
    );
  }
}


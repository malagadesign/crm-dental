import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT: Editar nota clínica
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Todos los roles pueden editar (admin, odontologo, secretary)
    const userRole = session.user.role || "secretary";

    const body = await request.json();
    const { recordDate, notes, appointmentId, attachments } = body;

    if (!recordDate || !notes) {
      return NextResponse.json(
        { error: "recordDate and notes are required" },
        { status: 400 }
      );
    }

    const medicalRecordId = parseInt(params.id);

    // Verificar que la nota clínica existe
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // Actualizar la nota clínica
    const medicalRecord = await prisma.medicalRecord.update({
      where: { id: medicalRecordId },
      data: {
        recordDate: new Date(recordDate),
        notes,
        appointmentId: appointmentId && appointmentId !== "none" ? parseInt(appointmentId) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        user: true,
        appointment: true,
      },
    });

    return NextResponse.json(medicalRecord);
  } catch (error) {
    console.error("Error updating medical record:", error);
    return NextResponse.json(
      { error: "Error updating medical record" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar nota clínica (solo admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Solo admin puede eliminar
    const userRole = session.user.role || "secretary";
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar notas clínicas" },
        { status: 403 }
      );
    }

    const medicalRecordId = parseInt(params.id);

    // Verificar que la nota clínica existe
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // Eliminar la nota clínica
    await prisma.medicalRecord.delete({
      where: { id: medicalRecordId },
    });

    return NextResponse.json({ success: true, message: "Medical record deleted" });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    return NextResponse.json(
      { error: "Error deleting medical record" },
      { status: 500 }
    );
  }
}

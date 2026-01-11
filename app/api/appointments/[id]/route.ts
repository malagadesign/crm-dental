import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        patient: true,
        clinic: true,
        treatment: true,
        user: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Error fetching appointment" },
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
    const {
      patientId,
      clinicId,
      treatmentId,
      userId,
      datetimeStart,
      datetimeEnd,
      status,
      notes,
    } = body;

    if (!patientId || !clinicId || !datetimeStart || !datetimeEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalizar valores vacíos a null
    const normalizedTreatmentId = 
      treatmentId && treatmentId !== "" && treatmentId !== "none" 
        ? parseInt(treatmentId) 
        : null;
    const normalizedUserId = 
      userId && userId !== "" && userId !== "unassigned" 
        ? parseInt(userId) 
        : null;

    // Validar que no haya solapamiento si hay un usuario asignado
    if (normalizedUserId) {
      const overlapping = await prisma.appointment.findFirst({
        where: {
          userId: normalizedUserId,
          datetimeStart: {
            lt: new Date(datetimeEnd),
          },
          datetimeEnd: {
            gt: new Date(datetimeStart),
          },
          id: {
            not: parseInt(params.id), // Excluir el mismo appointment
          },
        },
      });

      if (overlapping) {
        return NextResponse.json(
          {
            error:
              "El odontólogo ya tiene un turno en ese horario en otro consultorio",
          },
          { status: 400 }
        );
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(params.id) },
      data: {
        patientId: parseInt(patientId),
        clinicId: parseInt(clinicId),
        treatmentId: normalizedTreatmentId,
        userId: normalizedUserId,
        datetimeStart: new Date(datetimeStart),
        datetimeEnd: new Date(datetimeEnd),
        status: status || "confirmado",
        notes,
      },
      include: {
        patient: true,
        clinic: true,
        treatment: true,
        user: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Error updating appointment" },
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

    await prisma.appointment.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Error deleting appointment" },
      { status: 500 }
    );
  }
}

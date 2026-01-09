import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clinicId = searchParams.get("clinicId");
    const userId = searchParams.get("userId");
    const patientId = searchParams.get("patientId");

    const where: any = {};

    if (startDate && endDate) {
      where.datetimeStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (clinicId) {
      where.clinicId = parseInt(clinicId);
    }

    // Filtrar por rol: odontólogos solo ven sus turnos, admin y secretaria ven todos
    const userRole = session.user.role;
    if (userRole === "odontologo" && session.user.id) {
      // Si es odontólogo, solo mostrar sus turnos
      where.userId = parseInt(session.user.id);
    } else if (userId) {
      // Si es admin o secretaria y se especifica userId, usar ese filtro
      where.userId = parseInt(userId);
    }

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        clinic: true,
        treatment: true,
        user: true,
      },
      orderBy: { datetimeStart: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Error fetching appointments" },
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

    // Validar que no haya solapamiento si hay un usuario asignado
    if (userId) {
      const overlapping = await prisma.appointment.findFirst({
        where: {
          userId: parseInt(userId),
          datetimeStart: {
            lt: new Date(datetimeEnd),
          },
          datetimeEnd: {
            gt: new Date(datetimeStart),
          },
          id: {
            not: undefined, // Para updates, excluir el mismo appointment
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

    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId),
        clinicId: parseInt(clinicId),
        treatmentId: treatmentId ? parseInt(treatmentId) : null,
        userId: userId ? parseInt(userId) : null,
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

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Error creating appointment" },
      { status: 500 }
    );
  }
}

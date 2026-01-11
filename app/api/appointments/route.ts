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
  let body: any = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body", details: parseError.message },
        { status: 400 }
      );
    }

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

    // Validar campos requeridos
    if (!patientId || !clinicId || !datetimeStart || !datetimeEnd) {
      return NextResponse.json(
        { 
          error: "Missing required fields",
          received: {
            patientId: !!patientId,
            clinicId: !!clinicId,
            datetimeStart: !!datetimeStart,
            datetimeEnd: !!datetimeEnd,
          },
        },
        { status: 400 }
      );
    }

    // Validar que los IDs sean números válidos
    const parsedPatientId = parseInt(patientId.toString());
    const parsedClinicId = parseInt(clinicId.toString());
    
    if (isNaN(parsedPatientId) || isNaN(parsedClinicId)) {
      return NextResponse.json(
        { error: "Invalid patient or clinic ID" },
        { status: 400 }
      );
    }

    // Validar que las fechas sean válidas
    const startDate = new Date(datetimeStart);
    const endDate = new Date(datetimeEnd);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ["confirmado", "cancelado", "asistio", "no_asistio"];
    const normalizedStatus = status || "confirmado";
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe
    const patientExists = await prisma.patient.findUnique({
      where: { id: parsedPatientId },
    });
    
    if (!patientExists) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Verificar que el consultorio existe
    const clinicExists = await prisma.clinic.findUnique({
      where: { id: parsedClinicId },
    });
    
    if (!clinicExists) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Normalizar userId para validación de solapamiento
    let normalizedUserIdForValidation: number | null = null;
    if (userId && userId !== "" && userId !== "unassigned") {
      const parsed = parseInt(userId.toString());
      if (!isNaN(parsed)) {
        normalizedUserIdForValidation = parsed;
      }
    }

    // Validar que no haya solapamiento si hay un usuario asignado
    if (normalizedUserIdForValidation !== null) {
      try {
        const overlapping = await prisma.appointment.findFirst({
          where: {
            userId: normalizedUserIdForValidation,
            datetimeStart: {
              lt: endDate,
            },
            datetimeEnd: {
              gt: startDate,
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
      } catch (dbError: any) {
        console.error("Error checking overlapping appointments:", dbError);
        // Continuar con la creación si hay un error en la validación de solapamiento
        // (no bloqueamos por esto, pero lo registramos)
      }
    }

    // Normalizar valores vacíos a null
    let normalizedTreatmentId: number | null = null;
    if (treatmentId && treatmentId !== "" && treatmentId !== "none") {
      const parsed = parseInt(treatmentId.toString());
      if (!isNaN(parsed)) {
        normalizedTreatmentId = parsed;
      }
    }

    let normalizedUserId: number | null = null;
    if (userId && userId !== "" && userId !== "unassigned") {
      const parsed = parseInt(userId.toString());
      if (!isNaN(parsed)) {
        normalizedUserId = parsed;
      }
    }

    // Validar que el tratamiento existe si se proporciona
    if (normalizedTreatmentId !== null) {
      try {
        const treatmentExists = await prisma.treatment.findUnique({
          where: { id: normalizedTreatmentId },
        });
        if (!treatmentExists) {
          return NextResponse.json(
            { error: "Treatment not found" },
            { status: 404 }
          );
        }
      } catch (dbError: any) {
        console.error("Error checking treatment:", dbError);
        return NextResponse.json(
          { error: "Error validating treatment", details: dbError.message },
          { status: 500 }
        );
      }
    }

    // Validar que el usuario existe si se proporciona
    if (normalizedUserId !== null) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: normalizedUserId },
        });
        if (!userExists) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
      } catch (dbError: any) {
        console.error("Error checking user:", dbError);
        return NextResponse.json(
          { error: "Error validating user", details: dbError.message },
          { status: 500 }
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: parsedPatientId,
        clinicId: parsedClinicId,
        treatmentId: normalizedTreatmentId,
        userId: normalizedUserId,
        datetimeStart: startDate,
        datetimeEnd: endDate,
        status: normalizedStatus,
        notes: notes || null,
      },
      include: {
        patient: true,
        clinic: true,
        treatment: true,
        user: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
      body: body || "No body parsed",
    });

    // Asegurar que siempre devolvamos JSON válido
    try {
      return NextResponse.json(
        { 
          error: "Error creating appointment",
          details: error.message || "Unknown error",
          code: error.code || null,
        },
        { status: 500 }
      );
    } catch (jsonError: any) {
      // Si incluso el JSON falla, devolver un error básico
      console.error("Critical error: Could not create JSON response", jsonError);
      return new NextResponse(
        JSON.stringify({ error: "Internal server error" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}

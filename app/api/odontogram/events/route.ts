import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Validación con Zod
const toothEventSchema = z.object({
  patientId: z.number().int().positive(),
  toothNumber: z.number().int().min(11).max(48),
  kind: z.enum([
    "healthy",
    "caries",
    "filled",
    "crown",
    "endo",
    "missing",
    "extraction",
    "implant",
    "bridge",
    "fracture",
    "watch",
  ]),
  treatmentId: z.number().int().positive().nullable().optional(),
  appointmentId: z.number().int().positive().nullable().optional(),
  medicalRecordId: z.number().int().positive().nullable().optional(),
  note: z.string().nullable().optional(),
  eventDate: z.union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Formato YYYY-MM-DD
    z.date(),
  ]),
});

// Estados permitidos por rol
const secretaryAllowedKinds = ["healthy", "watch", "missing"];
const odontologoAllowedKinds = [
  "healthy",
  "caries",
  "filled",
  "crown",
  "endo",
  "missing",
  "extraction",
  "implant",
  "bridge",
  "fracture",
  "watch",
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validar con Zod
    const validationResult = toothEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verificar rol y permisos
    const userRole = session.user.role || "secretary";
    if (userRole === "secretary" && !secretaryAllowedKinds.includes(data.kind)) {
      return NextResponse.json(
        {
          error:
            "No tiene permisos para crear este tipo de evento. Contacte a un odontólogo o administrador.",
        },
        { status: 403 }
      );
    }

    if (
      userRole === "odontologo" &&
      !odontologoAllowedKinds.includes(data.kind)
    ) {
      return NextResponse.json(
        {
          error: "No tiene permisos para crear este tipo de evento.",
        },
        { status: 403 }
      );
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Verificar referencias opcionales
    if (data.treatmentId) {
      const treatment = await prisma.treatment.findUnique({
        where: { id: data.treatmentId },
      });
      if (!treatment) {
        return NextResponse.json(
          { error: "Treatment not found" },
          { status: 404 }
        );
      }
    }

    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
      });
      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      // Verificar que el appointment pertenece al paciente
      if (appointment.patientId !== data.patientId) {
        return NextResponse.json(
          { error: "Appointment does not belong to this patient" },
          { status: 400 }
        );
      }
    }

    if (data.medicalRecordId) {
      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { id: data.medicalRecordId },
      });
      if (!medicalRecord) {
        return NextResponse.json(
          { error: "Medical record not found" },
          { status: 404 }
        );
      }
      // Verificar que el medical record pertenece al paciente
      if (medicalRecord.patientId !== data.patientId) {
        return NextResponse.json(
          { error: "Medical record does not belong to this patient" },
          { status: 400 }
        );
      }
    }

    // Validar número de diente FDI (11-18, 21-28, 31-38, 41-48)
    const validToothNumbers = [
      ...Array.from({ length: 8 }, (_, i) => 11 + i), // 11-18
      ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28
      ...Array.from({ length: 8 }, (_, i) => 31 + i), // 31-38
      ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
    ];

    if (!validToothNumbers.includes(data.toothNumber)) {
      return NextResponse.json(
        { error: "Invalid tooth number. Must be between 11-18, 21-28, 31-38, or 41-48" },
        { status: 400 }
      );
    }

    // Crear evento dentro de una transacción para asegurar consistencia
    // Convertir fecha: si es YYYY-MM-DD, agregar hora 00:00:00
    let eventDate: Date;
    if (typeof data.eventDate === "string") {
      // Si es solo fecha (YYYY-MM-DD), convertir a datetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
        eventDate = new Date(data.eventDate + "T00:00:00");
      } else {
        eventDate = new Date(data.eventDate);
      }
    } else {
      eventDate = data.eventDate;
    }
    const userId = session.user.id ? parseInt(session.user.id) : null;

    const result = await prisma.$transaction(async (tx) => {
      // Crear el evento
      const event = await tx.toothEvent.create({
        data: {
          patientId: data.patientId,
          toothNumber: data.toothNumber,
          kind: data.kind,
          treatmentId: data.treatmentId || null,
          appointmentId: data.appointmentId || null,
          medicalRecordId: data.medicalRecordId || null,
          note: data.note || null,
          eventDate: eventDate,
          createdByUserId: userId,
        },
        include: {
          treatment: true,
          appointment: {
            include: {
              clinic: true,
            },
          },
          medicalRecord: true,
          createdByUser: true,
        },
      });

      // Actualizar o crear el estado del diente
      await tx.toothState.upsert({
        where: {
          patientId_toothNumber: {
            patientId: data.patientId,
            toothNumber: data.toothNumber,
          },
        },
        update: {
          currentStatus: data.kind,
          lastEventId: event.id,
          updatedAt: new Date(),
        },
        create: {
          patientId: data.patientId,
          toothNumber: data.toothNumber,
          currentStatus: data.kind,
          lastEventId: event.id,
        },
      });

      return event;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tooth event:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Unique constraint violation" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating tooth event" },
      { status: 500 }
    );
  }
}

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

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        appointments: {
          include: {
            clinic: true,
            treatment: true,
            user: true,
          },
          orderBy: { datetimeStart: "desc" },
        },
        medicalRecords: {
          include: {
            user: true,
            appointment: true,
          },
          orderBy: { recordDate: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Error fetching patient" },
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
      firstName,
      lastName,
      dni,
      birthDate,
      phone,
      email,
      address,
      origin,
      notes,
    } = body;

    const trimmedFirst = typeof firstName === "string" ? firstName.trim() : "";
    const trimmedLast = typeof lastName === "string" ? lastName.trim() : "";
    if (!trimmedFirst || !trimmedLast) {
      return NextResponse.json(
        { error: "Nombre y apellido son obligatorios" },
        { status: 400 }
      );
    }

    // DNI vacío o solo espacios → null (permite varios pacientes sin DNI; el DNI se puede cargar después)
    const dniValue =
      typeof dni === "string" && dni.trim() !== "" ? dni.trim() : null;

    const patient = await prisma.patient.update({
      where: { id: parseInt(params.id) },
      data: {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        dni: dniValue,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: typeof phone === "string" ? phone.trim() || null : null,
        email: typeof email === "string" ? email.trim() || null : null,
        address: typeof address === "string" ? address.trim() || null : null,
        origin: origin || "otro",
        notes: typeof notes === "string" ? notes.trim() || null : null,
      },
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient:", error);
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      const isDniConflict = target?.includes("dni");
      return NextResponse.json(
        {
          error: isDniConflict
            ? "Ya existe un paciente con ese número de DNI."
            : "Ya existe un registro con esos datos.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error updating patient" },
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

    await prisma.patient.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Error deleting patient" },
      { status: 500 }
    );
  }
}

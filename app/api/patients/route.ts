import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Prisma.PatientWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { dni: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    // Validar y construir orderBy
    const validSortFields = [
      "firstName",
      "lastName",
      "dni",
      "phone",
      "email",
      "birthDate",
      "createdAt",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "asc" : "desc";

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { [sortField]: order },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Error fetching patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let dniValue: string | null = null;
  let phoneValue: string | null = null;
  let emailValue: string | null = null;

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

    // Debug: qué llega del cliente (solo en desarrollo o para diagnosticar)
    console.log("[POST /api/patients] body recibido:", {
      dni: dni,
      dniType: typeof dni,
      phone: phone,
      email: email,
    });

    const trimmedFirst = typeof firstName === "string" ? firstName.trim() : "";
    const trimmedLast = typeof lastName === "string" ? lastName.trim() : "";
    if (!trimmedFirst || !trimmedLast) {
      return NextResponse.json(
        { error: "Nombre y apellido son obligatorios" },
        { status: 400 }
      );
    }

    // DNI vacío o solo espacios → null (varios pacientes pueden no tener DNI; unique solo aplica a valores no nulos)
    dniValue = typeof dni === "string" && dni.trim() !== "" ? dni.trim() : null;
    if (dniValue === "" || dniValue === undefined) dniValue = null;

    phoneValue = typeof phone === "string" ? phone.trim() || null : null;
    emailValue = typeof email === "string" ? email.trim() || null : null;

    console.log("[POST /api/patients] valores a guardar:", {
      dniValue,
      phoneValue,
      emailValue,
      firstName: trimmedFirst,
      lastName: trimmedLast,
    });

    const patient = await prisma.patient.create({
      data: {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        dni: dniValue,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phoneValue,
        email: emailValue,
        address: typeof address === "string" ? address.trim() || null : null,
        origin: origin || "otro",
        notes: typeof notes === "string" ? notes.trim() || null : null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/patients] Error:", error?.message, error?.code, error?.meta);
    if (error.code === "P2002") {
      console.log("[POST /api/patients] P2002 - conflicto unique. meta.target:", error.meta?.target, "| dniValue:", dniValue, "| phoneValue:", phoneValue, "| emailValue:", emailValue);
      const target = error.meta?.target as string[] | undefined;
      const targetStr = Array.isArray(target) ? target.join(",") : String(target ?? "");
      const isDniConflict =
        target?.includes("dni") || (targetStr && targetStr.toLowerCase().includes("dni"));
      const isPhoneConflict =
        target?.includes("phone") || (targetStr && targetStr.toLowerCase().includes("phone"));
      const isEmailConflict =
        target?.includes("email") || (targetStr && targetStr.toLowerCase().includes("email"));

      // Buscar el paciente existente que causó el conflicto (usamos los valores que intentamos guardar)
      let existingPatient: { id: number; firstName: string; lastName: string; dni?: string | null; phone?: string | null; email?: string | null } | null = null;
      if (dniValue) {
        existingPatient = await prisma.patient.findFirst({ where: { dni: dniValue }, select: { id: true, firstName: true, lastName: true, dni: true } });
      } else if (phoneValue) {
        existingPatient = await prisma.patient.findFirst({ where: { phone: phoneValue }, select: { id: true, firstName: true, lastName: true, phone: true } });
      } else if (emailValue) {
        existingPatient = await prisma.patient.findFirst({ where: { email: emailValue }, select: { id: true, firstName: true, lastName: true, email: true } });
      }

      let errorMessage: string;
      if (isDniConflict) {
        errorMessage = "Ya existe un paciente con ese número de DNI.";
      } else if (isPhoneConflict) {
        errorMessage = "Ya existe un paciente con ese teléfono.";
      } else if (isEmailConflict) {
        errorMessage = "Ya existe un paciente con ese email.";
      } else {
        errorMessage = "Ya existe un paciente con algún dato que debe ser único (DNI, teléfono o email).";
      }
      if (existingPatient) {
        const nombre = `${existingPatient.firstName} ${existingPatient.lastName}`.trim();
        const dato = existingPatient.dni ?? existingPatient.phone ?? existingPatient.email ?? "";
        errorMessage += dato ? ` Coincide con: ${nombre} (${dato}).` : ` Coincide con: ${nombre}.`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          existingPatientId: existingPatient?.id ?? null,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating patient" },
      { status: 500 }
    );
  }
}

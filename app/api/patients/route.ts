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

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        dni,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        email,
        address,
        origin: origin || "otro",
        notes,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error("Error creating patient:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "DNI already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating patient" },
      { status: 500 }
    );
  }
}

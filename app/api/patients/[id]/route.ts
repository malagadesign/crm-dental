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

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id: parseInt(params.id) },
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

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "DNI already exists" },
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        patientId: parseInt(patientId),
      },
      include: {
        user: true,
        appointment: true,
      },
      orderBy: { recordDate: "desc" },
    });

    return NextResponse.json(medicalRecords);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json(
      { error: "Error fetching medical records" },
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
    const { patientId, appointmentId, recordDate, notes, attachments } = body;

    if (!patientId || !recordDate || !notes) {
      return NextResponse.json(
        { error: "patientId, recordDate and notes are required" },
        { status: 400 }
      );
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        patientId: parseInt(patientId),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        userId: session.user.id ? parseInt(session.user.id) : null,
        recordDate: new Date(recordDate),
        notes,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        user: true,
        appointment: true,
      },
    });

    return NextResponse.json(medicalRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating medical record:", error);
    return NextResponse.json(
      { error: "Error creating medical record" },
      { status: 500 }
    );
  }
}

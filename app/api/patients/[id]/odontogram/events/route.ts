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

    const patientId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const toothParam = searchParams.get("tooth");

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const where: any = {
      patientId,
    };

    if (toothParam) {
      const toothNumber = parseInt(toothParam);
      if (toothNumber >= 11 && toothNumber <= 48) {
        where.toothNumber = toothNumber;
      }
    }

    const events = await prisma.toothEvent.findMany({
      where,
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
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching tooth events:", error);
    return NextResponse.json(
      { error: "Error fetching tooth events" },
      { status: 500 }
    );
  }
}

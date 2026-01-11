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

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Obtener todos los estados de dientes del paciente
    const toothStates = await prisma.toothState.findMany({
      where: { patientId },
      include: {
        lastEvent: {
          include: {
            treatment: true,
            appointment: true,
            medicalRecord: true,
            createdByUser: true,
          },
        },
      },
    });

    // Crear un mapa de estados por número de diente
    const stateMap: Record<number, any> = {};
    toothStates.forEach((state) => {
      stateMap[state.toothNumber] = {
        toothNumber: state.toothNumber,
        currentStatus: state.currentStatus,
        lastEventId: state.lastEventId,
        lastEvent: state.lastEvent,
        updatedAt: state.updatedAt,
      };
    });

    // Inicializar todos los dientes FDI (11-48) con estado "healthy" si no existe
    const allTeeth: any[] = [];
    for (let i = 11; i <= 48; i++) {
      // Saltar números que no corresponden a dientes válidos (21-28, 31-38 son válidos)
      if (
        (i >= 11 && i <= 18) ||
        (i >= 21 && i <= 28) ||
        (i >= 31 && i <= 38) ||
        (i >= 41 && i <= 48)
      ) {
        allTeeth.push({
          toothNumber: i,
          currentStatus: stateMap[i]?.currentStatus || "healthy",
          lastEventId: stateMap[i]?.lastEventId || null,
          lastEvent: stateMap[i]?.lastEvent || null,
          updatedAt: stateMap[i]?.updatedAt || null,
        });
      }
    }

    return NextResponse.json(allTeeth);
  } catch (error) {
    console.error("Error fetching tooth states:", error);
    return NextResponse.json(
      { error: "Error fetching tooth states" },
      { status: 500 }
    );
  }
}

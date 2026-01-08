import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Función para calcular similitud entre dos strings (similar a similar_text de PHP)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  // Calcular distancia de Levenshtein
  const distance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - distance) / longer.length) * 100;
  
  return similarity;
}

// Función para calcular distancia de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Verifica si dos pacientes son duplicados
function areDuplicates(
  p1: any,
  p2: any,
  similarityThreshold: number = 80
): boolean {
  // Criterio 1: Mismo DNI (si ambos tienen DNI)
  if (p1.dni && p2.dni && p1.dni === p2.dni) {
    return true;
  }

  // Criterio 2: Mismo teléfono (si ambos tienen teléfono)
  if (p1.phone && p2.phone && p1.phone === p2.phone) {
    return true;
  }

  // Criterio 3: Mismo email (si ambos tienen email)
  if (p1.email && p2.email && p1.email === p2.email) {
    return true;
  }

  // Criterio 4: Nombres similares
  const fullName1 = `${p1.firstName} ${p1.lastName}`.toLowerCase().trim();
  const fullName2 = `${p2.firstName} ${p2.lastName}`.toLowerCase().trim();

  // Si los nombres son idénticos
  if (fullName1 === fullName2) {
    return true;
  }

  // Calcular similitud
  const similarity = calculateSimilarity(fullName1, fullName2);

  if (similarity >= similarityThreshold) {
    // Verificar también similitud por partes
    const firstName1 = p1.firstName.toLowerCase();
    const firstName2 = p2.firstName.toLowerCase();
    const lastName1 = p1.lastName.toLowerCase();
    const lastName2 = p2.lastName.toLowerCase();

    const firstNameSimilarity = calculateSimilarity(firstName1, firstName2);
    const lastNameSimilarity = calculateSimilarity(lastName1, lastName2);

    // Si el apellido es muy similar (>= 85%) y el nombre también (>= 70%)
    if (lastNameSimilarity >= 85 && firstNameSimilarity >= 70) {
      return true;
    }
  }

  return false;
}

// Selecciona el paciente principal (el más completo)
function selectMainPatient(group: any[]): any {
  return group.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Priorizar pacientes con más datos
    if (a.dni) scoreA += 10;
    if (b.dni) scoreB += 10;
    if (a.phone) scoreA += 5;
    if (b.phone) scoreB += 5;
    if (a.email) scoreA += 5;
    if (b.email) scoreB += 5;
    if (a.address) scoreA += 3;
    if (b.address) scoreB += 3;
    if (a.birthDate) scoreA += 2;
    if (b.birthDate) scoreB += 2;

    // Priorizar pacientes con más turnos (se calculará después)
    // Priorizar pacientes con más registros médicos (se calculará después)
    // Priorizar el más reciente
    scoreA += new Date(a.createdAt).getTime() / 1000000;
    scoreB += new Date(b.createdAt).getTime() / 1000000;

    return scoreB - scoreA;
  })[0];
}

// Encuentra pacientes duplicados
async function findDuplicates(similarityThreshold: number = 80) {
  const patients = await prisma.patient.findMany({
    include: {
      _count: {
        select: {
          appointments: true,
          medicalRecords: true,
        },
      },
    },
  });

  const duplicates: any[][] = [];
  const processed: number[] = [];

  for (const patient of patients) {
    if (processed.includes(patient.id)) {
      continue;
    }

    const group = [patient];
    processed.push(patient.id);

    for (const other of patients) {
      if (patient.id === other.id || processed.includes(other.id)) {
        continue;
      }

      if (areDuplicates(patient, other, similarityThreshold)) {
        group.push(other);
        processed.push(other.id);
      }
    }

    if (group.length > 1) {
      // Calcular scores con conteos reales
      for (const p of group) {
        const counts = await prisma.patient.findUnique({
          where: { id: p.id },
          include: {
            _count: {
              select: {
                appointments: true,
                medicalRecords: true,
              },
            },
          },
        });
        if (counts) {
          (p as any).appointmentsCount = counts._count.appointments;
          (p as any).medicalRecordsCount = counts._count.medicalRecords;
        }
      }
      duplicates.push(group);
    }
  }

  return duplicates;
}

// GET: Detectar duplicados
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const similarity = parseInt(searchParams.get("similarity") || "80");

    const duplicates = await findDuplicates(similarity);

    // Formatear respuesta
    const formatted = duplicates.map((group) => {
      const main = selectMainPatient(group);
      return {
        group: group.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: `${p.firstName} ${p.lastName}`,
          dni: p.dni,
          phone: p.phone,
          email: p.email,
          appointmentsCount: (p as any).appointmentsCount || 0,
          medicalRecordsCount: (p as any).medicalRecordsCount || 0,
          createdAt: p.createdAt,
        })),
        mainPatientId: main.id,
      };
    });

    return NextResponse.json({
      duplicates: formatted,
      totalGroups: formatted.length,
    });
  } catch (error: any) {
    console.error("Error finding duplicates:", error);
    return NextResponse.json(
      { error: "Error finding duplicates", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Unificar duplicados
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupIds, mainPatientId, dryRun = false } = body;

    if (!Array.isArray(groupIds) || groupIds.length < 2) {
      return NextResponse.json(
        { error: "Invalid group IDs" },
        { status: 400 }
      );
    }

    if (!mainPatientId || !groupIds.includes(mainPatientId)) {
      return NextResponse.json(
        { error: "Invalid main patient ID" },
        { status: 400 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        message: "Dry run - no changes made",
        wouldUnify: groupIds.length - 1,
      });
    }

    // Obtener pacientes
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: groupIds },
      },
    });

    const mainPatient = patients.find((p) => p.id === mainPatientId);
    if (!mainPatient) {
      return NextResponse.json(
        { error: "Main patient not found" },
        { status: 404 }
      );
    }

    const duplicates = patients.filter((p) => p.id !== mainPatientId);

    // Unificar en transacción
    const result = await prisma.$transaction(async (tx) => {
      const updates: any = {};

      // Combinar datos de duplicados
      for (const duplicate of duplicates) {
        if (!mainPatient.dni && duplicate.dni) {
          updates.dni = duplicate.dni;
        }
        if (!mainPatient.phone && duplicate.phone) {
          updates.phone = duplicate.phone;
        }
        if (!mainPatient.email && duplicate.email) {
          updates.email = duplicate.email;
        }
        if (!mainPatient.address && duplicate.address) {
          updates.address = duplicate.address;
        }
        if (!mainPatient.birthDate && duplicate.birthDate) {
          updates.birthDate = duplicate.birthDate;
        }

        // Combinar notas
        if (duplicate.notes) {
          const mainNotes = mainPatient.notes || "";
          const duplicateNotes = duplicate.notes || "";
          if (mainNotes && duplicateNotes) {
            updates.notes = `${mainNotes}\n\n--- Notas del registro duplicado (ID: ${duplicate.id}) ---\n${duplicateNotes}`;
          } else if (!mainNotes && duplicateNotes) {
            updates.notes = duplicateNotes;
          }
        }

        // Mover relaciones
        await tx.appointment.updateMany({
          where: { patientId: duplicate.id },
          data: { patientId: mainPatientId },
        });

        await tx.medicalRecord.updateMany({
          where: { patientId: duplicate.id },
          data: { patientId: mainPatientId },
        });

        await tx.lead.updateMany({
          where: { patientId: duplicate.id },
          data: { patientId: mainPatientId },
        });

        // Eliminar duplicado
        await tx.patient.delete({
          where: { id: duplicate.id },
        });
      }

      // Actualizar paciente principal
      if (Object.keys(updates).length > 0) {
        await tx.patient.update({
          where: { id: mainPatientId },
          data: updates,
        });
      }

      return { unified: duplicates.length, updated: Object.keys(updates).length };
    });

    return NextResponse.json({
      success: true,
      message: `Unificados ${result.unified} pacientes duplicados`,
      result,
    });
  } catch (error: any) {
    console.error("Error unifying duplicates:", error);
    return NextResponse.json(
      { error: "Error unifying duplicates", details: error.message },
      { status: 500 }
    );
  }
}


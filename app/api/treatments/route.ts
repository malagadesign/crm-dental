import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const treatments = await prisma.treatment.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(treatments);
  } catch (error) {
    console.error("Error fetching treatments:", error);
    return NextResponse.json(
      { error: "Error fetching treatments" },
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
    const { name, description, price, durationMinutes, active } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const treatment = await prisma.treatment.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        durationMinutes: durationMinutes || 30,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error("Error creating treatment:", error);
    return NextResponse.json(
      { error: "Error creating treatment" },
      { status: 500 }
    );
  }
}

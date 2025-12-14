import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/institutions - List all available institutions
export async function GET(request: NextRequest) {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: [
        { isSystem: "desc" }, // System institutions first
        { name: "asc" },
      ],
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return NextResponse.json(
      { error: "Failed to fetch institutions" },
      { status: 500 }
    );
  }
}

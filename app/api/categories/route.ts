import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get("includeSystem") !== "false";

    const where: any = {};

    if (includeSystem) {
      // Return both system and user categories
      where.OR = [{ isSystem: true }, { userId: null }];
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: true,
        parent: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { isSystem: "desc" }, // System categories first
        { order: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// GET /api/accounts/[id] - Get single account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const account = await prisma.financeAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        institution: true,
        bankParsingTemplate: true,
        statementFiles: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        transactions: {
          orderBy: {
            postedAt: "desc",
          },
          take: 20,
          include: {
            category: true,
            subcategory: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            statementFiles: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch account" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH /api/accounts/[id] - Update account
const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().optional(),
  isPrimaryIncomeAccount: z.boolean().optional(),
  currentBalance: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateAccountSchema.parse(body);

    // Check if account exists and belongs to user
    const existingAccount = await prisma.financeAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Update account
    const account = await prisma.financeAccount.update({
      where: { id },
      data: validatedData,
      include: {
        institution: true,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error updating account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update account" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Soft delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if account exists and belongs to user
    const existingAccount = await prisma.financeAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Soft delete (set isActive to false)
    await prisma.financeAccount.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

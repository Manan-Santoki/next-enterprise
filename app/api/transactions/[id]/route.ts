import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: {
          include: {
            institution: true,
          },
        },
        category: true,
        subcategory: true,
        counterparty: true,
        statementFile: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transaction" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update transaction
const updateTransactionSchema = z.object({
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isInternalTransfer: z.boolean().optional(),
  merchant: z.string().optional().nullable(),
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
    const validatedData = updateTransactionSchema.parse(body);

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...validatedData,
        aiCategorizationSource: validatedData.categoryId ? "manual" : existingTransaction.aiCategorizationSource,
      },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
    });

    // Create correction record for learning
    if (validatedData.categoryId && validatedData.categoryId !== existingTransaction.categoryId) {
      await prisma.transactionCorrection.create({
        data: {
          transactionId: id,
          userId: user.id,
          field: "category",
          oldValue: existingTransaction.categoryId,
          newValue: validatedData.categoryId,
        },
      });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update transaction" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

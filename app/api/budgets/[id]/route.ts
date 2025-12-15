import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  period: z.enum(["monthly", "weekly", "yearly"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  accountIds: z.array(z.string()).optional(),
});

// GET /api/budgets/[id] - Get a specific budget
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const params = await context.params;

    const budget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch budget" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH /api/budgets/[id] - Update a budget
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const params = await context.params;

    const data = updateBudgetSchema.parse(body);

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const budget = await prisma.budget.update({
      where: {
        id: params.id,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.amount && { amount: data.amount }),
        ...(data.period && { period: data.period }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.accountIds && { accountIds: data.accountIds }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update budget" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// DELETE /api/budgets/[id] - Delete a budget
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const params = await context.params;

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await prisma.budget.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete budget" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

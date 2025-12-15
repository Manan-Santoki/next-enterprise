import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createBudgetSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  amount: z.number().positive(),
  period: z.enum(["monthly", "weekly", "yearly"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountIds: z.array(z.string()).optional().default([]),
});

// GET /api/budgets - List all budgets with progress
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const includeProgress = searchParams.get("includeProgress") !== "false";

    const budgets = await prisma.budget.findMany({
      where: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!includeProgress) {
      return NextResponse.json({ budgets });
    }

    // Calculate progress for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget: typeof budgets[number]) => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        if (budget.startDate && budget.endDate) {
          startDate = budget.startDate;
          endDate = budget.endDate;
        } else {
          // Calculate period dates
          if (budget.period === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          } else if (budget.period === "weekly") {
            const dayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
          } else {
            // yearly
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
          }
        }

        // Get spending for this budget
        const where: any = {
          userId: user.id,
          postedAt: {
            gte: startDate,
            lte: endDate,
          },
          amount: { lt: 0 }, // Only expenses
          isInternalTransfer: false,
        };

        if (budget.categoryId) {
          where.categoryId = budget.categoryId;
        }

        if (budget.accountIds && budget.accountIds.length > 0) {
          where.accountId = { in: budget.accountIds };
        }

        const spending = await prisma.transaction.aggregate({
          where,
          _sum: {
            amount: true,
          },
        });

        const spent = Math.abs(parseFloat(spending._sum.amount?.toString() || "0"));
        const limit = parseFloat(budget.amount.toString());
        const remaining = limit - spent;
        const percentUsed = (spent / limit) * 100;

        // Determine status
        let status: "on-track" | "warning" | "exceeded";
        if (percentUsed >= 100) {
          status = "exceeded";
        } else if (percentUsed >= 80) {
          status = "warning";
        } else {
          status = "on-track";
        }

        return {
          ...budget,
          progress: {
            spent,
            remaining,
            percentUsed,
            status,
            periodStart: startDate.toISOString(),
            periodEnd: endDate.toISOString(),
          },
        };
      })
    );

    return NextResponse.json({ budgets: budgetsWithProgress });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch budgets" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/budgets - Create a new budget
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const data = createBudgetSchema.parse(body);

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: data.name,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        accountIds: data.accountIds,
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

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create budget" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

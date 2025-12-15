import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { processTransactionsWithFlowRules } from "@/lib/flow-rules/engine";

// GET /api/flow-rules - List flow rules
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const flowRules = await prisma.flowRule.findMany({
      where: {
        userId: user.id,
      },
      include: {
        sourceAccount: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        destinationAccount: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });

    return NextResponse.json({ flowRules });
  } catch (error) {
    console.error("Error fetching flow rules:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch flow rules" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/flow-rules - Create flow rule
const createFlowRuleSchema = z.object({
  sourceAccountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  matchDirection: z.enum(["in", "out", "both"]),
  descriptionIncludes: z.array(z.string()).optional().default([]),
  descriptionRegex: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  timeWindowHours: z.number().optional().default(48),
  handling: z.enum(["internal_transfer", "income", "expense", "ignore"]),
  notes: z.string().optional(),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await request.json()) as { applyToExisting?: boolean; [key: string]: unknown };

    // Validate input
    const validatedData = createFlowRuleSchema.parse(body);

    // Create flow rule
    const flowRule = await prisma.flowRule.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    // Optionally process existing transactions with new rule
    if (body.applyToExisting) {
      await processTransactionsWithFlowRules(user.id);
    }

    return NextResponse.json({ flowRule }, { status: 201 });
  } catch (error) {
    console.error("Error creating flow rule:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create flow rule" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

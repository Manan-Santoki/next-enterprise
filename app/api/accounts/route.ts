import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// GET /api/accounts - List all accounts for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const accounts = await prisma.financeAccount.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        institution: true,
        bankParsingTemplate: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/accounts - Create new account
const createAccountSchema = z.object({
  institutionId: z.string(),
  name: z.string().min(1, "Account name is required"),
  displayName: z.string().optional(),
  type: z.enum(["checking", "savings", "credit_card", "loan", "wallet"]),
  currency: z.string().length(3, "Currency must be 3 characters (e.g., USD, INR)"),
  connectionType: z.enum(["pdf_manual", "plaid"]),
  isPrimaryIncomeAccount: z.boolean().default(false),
  currentBalance: z.number().optional().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = createAccountSchema.parse(body);

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: validatedData.institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Create account
    const account = await prisma.financeAccount.create({
      data: {
        userId: user.id,
        institutionId: validatedData.institutionId,
        name: validatedData.name,
        displayName: validatedData.displayName,
        type: validatedData.type,
        currency: validatedData.currency,
        connectionType: validatedData.connectionType,
        isPrimaryIncomeAccount: validatedData.isPrimaryIncomeAccount,
        currentBalance: validatedData.currentBalance,
      },
      include: {
        institution: true,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create account" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

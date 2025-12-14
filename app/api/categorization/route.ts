import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { categorizeAllTransactions, learnFromCorrections } from "@/lib/categorization/engine";

// POST /api/categorization - Categorize all uncategorized transactions
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { action } = body;

    if (action === "categorize") {
      const result = await categorizeAllTransactions(user.id);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "learn") {
      const rulesCreated = await learnFromCorrections(user.id);
      return NextResponse.json({
        success: true,
        rulesCreated,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'categorize' or 'learn'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in categorization:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Categorization failed" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

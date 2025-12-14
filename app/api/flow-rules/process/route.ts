import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processTransactionsWithFlowRules } from "@/lib/flow-rules/engine";

// POST /api/flow-rules/process - Process all transactions with flow rules
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await processTransactionsWithFlowRules(user.id);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      transfers: result.transfers,
    });
  } catch (error) {
    console.error("Error processing flow rules:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process flow rules" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

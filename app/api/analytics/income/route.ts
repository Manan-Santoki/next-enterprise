import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getIncomeBreakdown } from "@/lib/analytics/queries";

// GET /api/analytics/income - Get income breakdown
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined;
    const accountIds = searchParams.get("accountIds")
      ? searchParams.get("accountIds")!.split(",")
      : undefined;

    const income = await getIncomeBreakdown({
      userId: user.id,
      fromDate,
      toDate,
      accountIds,
    });

    return NextResponse.json({ sources: income });
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch income" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

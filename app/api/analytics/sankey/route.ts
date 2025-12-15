import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSankeyData, getIncomeExpenseFlow } from "@/lib/analytics/sankey";

// GET /api/analytics/sankey - Get Sankey diagram data
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
    const type = searchParams.get("type") || "default"; // default or income-expense

    const filter = {
      userId: user.id,
      fromDate,
      toDate,
      accountIds,
    };

    let data;
    if (type === "income-expense") {
      data = await getIncomeExpenseFlow(filter);
    } else {
      data = await getSankeyData(filter);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sankey data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sankey data" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

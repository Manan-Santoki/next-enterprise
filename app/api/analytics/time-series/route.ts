import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSpendingTimeSeries } from "@/lib/analytics/queries";

// GET /api/analytics/time-series - Get time series data
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
    const groupBy = searchParams.get("groupBy") === "week" ? "week" : "month";

    const timeSeries = await getSpendingTimeSeries(
      {
        userId: user.id,
        fromDate,
        toDate,
        accountIds,
      },
      groupBy
    );

    return NextResponse.json({ data: timeSeries });
  } catch (error) {
    console.error("Error fetching time series:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch time series" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

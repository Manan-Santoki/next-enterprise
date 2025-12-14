import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOverview } from "@/lib/analytics/queries";

// GET /api/analytics/overview - Get financial overview
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

    const overview = await getOverview({
      userId: user.id,
      fromDate,
      toDate,
      accountIds,
    });

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching overview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch overview" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

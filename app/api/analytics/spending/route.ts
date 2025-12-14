import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSpendingByCategory, getTopMerchants } from "@/lib/analytics/queries";

// GET /api/analytics/spending - Get spending breakdown
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
    const categoryIds = searchParams.get("categoryIds")
      ? searchParams.get("categoryIds")!.split(",")
      : undefined;
    const type = searchParams.get("type") || "category"; // category or merchant

    if (type === "merchant") {
      const limit = searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10;

      const merchants = await getTopMerchants(
        {
          userId: user.id,
          fromDate,
          toDate,
          accountIds,
        },
        limit
      );

      return NextResponse.json({ merchants });
    }

    const categories = await getSpendingByCategory({
      userId: user.id,
      fromDate,
      toDate,
      accountIds,
      categoryIds,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching spending:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch spending" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

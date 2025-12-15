import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SankeyDiagram } from "@/components/dashboard/SankeyDiagram";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Default to last 3 months for better Sankey visualization
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500">
          Detailed financial insights and money flow visualization
        </p>
      </div>

      <OverviewCards
        fromDate={threeMonthsAgo.toISOString()}
        toDate={now.toISOString()}
      />

      <SankeyDiagram
        fromDate={threeMonthsAgo.toISOString()}
        toDate={now.toISOString()}
        type="income-expense"
        title="Income & Expense Flow"
        description="See how money flows from income sources through accounts to expenses"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SankeyDiagram
          fromDate={threeMonthsAgo.toISOString()}
          toDate={now.toISOString()}
          type="default"
          title="Account to Category Flow"
          description="Detailed breakdown of spending by account and category"
        />

        <SpendingChart
          fromDate={threeMonthsAgo.toISOString()}
          toDate={now.toISOString()}
        />
      </div>

      <TimeSeriesChart
        fromDate={threeMonthsAgo.toISOString()}
        toDate={now.toISOString()}
        groupBy="month"
      />
    </div>
  );
}

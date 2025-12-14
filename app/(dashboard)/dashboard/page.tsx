import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { TopMerchantsCard } from "@/components/dashboard/TopMerchantsCard";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Default to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your financial accounts and transactions</p>
      </div>

      <OverviewCards
        fromDate={firstDayOfMonth.toISOString()}
        toDate={lastDayOfMonth.toISOString()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingChart
          fromDate={firstDayOfMonth.toISOString()}
          toDate={lastDayOfMonth.toISOString()}
        />
        <TopMerchantsCard
          fromDate={firstDayOfMonth.toISOString()}
          toDate={lastDayOfMonth.toISOString()}
          limit={5}
        />
      </div>

      <TimeSeriesChart groupBy="month" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/accounts"
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 transition-colors"
        >
          <div className="text-2xl">🏦</div>
          <div className="mt-2 text-sm font-medium">Manage Accounts</div>
        </Link>
        <Link
          href="/dashboard/imports"
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 transition-colors"
        >
          <div className="text-2xl">📄</div>
          <div className="mt-2 text-sm font-medium">Upload Statement</div>
        </Link>
        <Link
          href="/dashboard/budgets"
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 transition-colors"
        >
          <div className="text-2xl">💰</div>
          <div className="mt-2 text-sm font-medium">Create Budget</div>
        </Link>
        <Link
          href="/dashboard/chat"
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 transition-colors"
        >
          <div className="text-2xl">🤖</div>
          <div className="mt-2 text-sm font-medium">Ask AI</div>
        </Link>
      </div>
    </div>
  );
}

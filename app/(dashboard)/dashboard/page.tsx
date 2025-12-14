import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your financial accounts and transactions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>This Month Income</CardDescription>
            <CardTitle className="text-2xl text-green-600">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">+0% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>This Month Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">+0% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Budget Used</CardDescription>
            <CardTitle className="text-2xl">0%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">$0 of $0 monthly limit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No transactions yet. Upload your first statement to get started!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No data available yet.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your finance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400">
              <div className="text-2xl">🏦</div>
              <div className="mt-2 text-sm font-medium">Add Account</div>
            </button>
            <button className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400">
              <div className="text-2xl">📄</div>
              <div className="mt-2 text-sm font-medium">Upload Statement</div>
            </button>
            <button className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400">
              <div className="text-2xl">💰</div>
              <div className="mt-2 text-sm font-medium">Create Budget</div>
            </button>
            <button className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400">
              <div className="text-2xl">🤖</div>
              <div className="mt-2 text-sm font-medium">Ask AI</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

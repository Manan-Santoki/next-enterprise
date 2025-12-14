"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

interface OverviewData {
  income: number;
  expenses: number;
  netCashFlow: number;
  totalBalance: number;
  transactionCount: number;
}

interface OverviewCardsProps {
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
}

export function OverviewCards({ fromDate, toDate, accountIds }: OverviewCardsProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (accountIds) params.append("accountIds", accountIds.join(","));

        const response = await fetch(`/api/analytics/overview?${params}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, accountIds]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardDescription className="h-4 w-24 bg-gray-200 rounded" />
              <CardTitle className="h-8 w-32 bg-gray-200 rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(data.totalBalance)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Across all accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Income</CardDescription>
          <CardTitle className="text-2xl text-green-600">
            {formatCurrency(data.income)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">{data.transactionCount} transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Expenses</CardDescription>
          <CardTitle className="text-2xl text-red-600">
            {formatCurrency(data.expenses)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            {((data.expenses / data.income) * 100).toFixed(1)}% of income
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Net Cash Flow</CardDescription>
          <CardTitle
            className={`text-2xl ${data.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(data.netCashFlow)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            {data.netCashFlow >= 0 ? "Positive" : "Negative"} cash flow
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

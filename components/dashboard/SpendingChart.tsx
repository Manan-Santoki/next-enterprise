"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  categoryId: string | null;
  categoryName: string;
  icon?: string;
  color?: string;
  amount: number;
  transactionCount: number;
}

interface SpendingChartProps {
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
}

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#a855f7", // purple
];

export function SpendingChart({ fromDate, toDate, accountIds }: SpendingChartProps) {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (accountIds) params.append("accountIds", accountIds.join(","));

        const response = await fetch(`/api/analytics/spending?${params}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.categories || []);
        }
      } catch (error) {
        console.error("Error fetching spending:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, accountIds]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Breakdown of your expenses</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Breakdown of your expenses</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No spending data available</p>
            <p className="text-sm mt-2">Upload statements to see your spending breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.amount,
    count: item.transactionCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of your expenses</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

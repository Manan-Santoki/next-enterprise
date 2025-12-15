"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TimeSeriesData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

interface TimeSeriesChartProps {
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
  groupBy?: "month" | "week";
}

export function TimeSeriesChart({
  fromDate,
  toDate,
  accountIds,
  groupBy = "month",
}: TimeSeriesChartProps) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (accountIds) params.append("accountIds", accountIds.join(","));
        params.append("groupBy", groupBy);

        const response = await fetch(`/api/analytics/time-series?${params}`);
        if (response.ok) {
          const result = (await response.json()) as { data: TimeSeriesData[] };
          setData(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching time series:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, accountIds, groupBy]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income & Expenses Trend</CardTitle>
          <CardDescription>Track your financial trends over time</CardDescription>
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
          <CardTitle>Income & Expenses Trend</CardTitle>
          <CardDescription>Track your financial trends over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No trend data available</p>
            <p className="text-sm mt-2">Upload statements to see your trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income & Expenses Trend</CardTitle>
        <CardDescription>Track your financial trends over time</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              name="Expenses"
            />
            <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

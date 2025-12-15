"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

interface MerchantData {
  merchant: string;
  amount: number;
  transactionCount: number;
}

interface TopMerchantsCardProps {
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
  limit?: number;
}

export function TopMerchantsCard({
  fromDate,
  toDate,
  accountIds,
  limit = 10,
}: TopMerchantsCardProps) {
  const [data, setData] = useState<MerchantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (accountIds) params.append("accountIds", accountIds.join(","));
        params.append("type", "merchant");
        params.append("limit", limit.toString());

        const response = await fetch(`/api/analytics/spending?${params}`);
        if (response.ok) {
          const result = (await response.json()) as { merchants: MerchantData[] };
          setData(result.merchants || []);
        }
      } catch (error) {
        console.error("Error fetching merchants:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, accountIds, limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
          <CardDescription>Where you spend the most</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
          <CardDescription>Where you spend the most</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>No merchant data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
        <CardDescription>Where you spend the most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((merchant, index) => (
            <div key={merchant.merchant} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{merchant.merchant}</p>
                  <p className="text-xs text-gray-500">
                    {merchant.transactionCount} transaction
                    {merchant.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{formatCurrency(merchant.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

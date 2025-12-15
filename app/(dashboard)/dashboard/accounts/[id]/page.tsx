"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

interface AccountDetail {
  id: string;
  name: string;
  displayName: string | null;
  type: string;
  currency: string;
  currentBalance: string;
  isPrimaryIncomeAccount: boolean;
  institution: {
    id: string;
    name: string;
    country: string;
  };
  statementFiles: Array<{
    id: string;
    originalFilename: string;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    postedAt: string;
    rawDescription: string;
    amount: string;
    currency: string;
    direction: string;
    category: {
      name: string;
      icon: string | null;
    } | null;
  }>;
  _count: {
    transactions: number;
    statementFiles: number;
  };
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAccount(params.id as string);
    }
  }, [params.id]);

  const fetchAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/accounts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch account");

      const data = (await response.json()) as { account: AccountDetail };
      setAccount(data.account);
    } catch (error) {
      console.error("Error fetching account:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading account...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-xl font-semibold mb-2">Account not found</p>
        <Link href="/dashboard/accounts">
          <Button>Back to Accounts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/accounts" className="hover:text-gray-700">
              Accounts
            </Link>
            <span>/</span>
            <span>{account.displayName || account.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{account.displayName || account.name}</h1>
          <p className="text-gray-500">{account.institution.name}</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/imports?account=${account.id}`}>
            <Button>Upload Statement</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(parseFloat(account.currentBalance), account.currency)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{account._count.transactions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Statements Uploaded</CardDescription>
            <CardTitle className="text-3xl">{account._count.statementFiles}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest 20 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {account.transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No transactions yet. Upload a statement to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {account.transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">
                        {txn.category?.icon || (txn.direction === "credit" ? "💰" : "💸")}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{txn.rawDescription}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(txn.postedAt, "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          txn.direction === "credit" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {txn.direction === "credit" ? "+" : "-"}
                        {formatCurrency(Math.abs(parseFloat(txn.amount)), txn.currency)}
                      </p>
                      {txn.category && (
                        <p className="text-xs text-gray-500">{txn.category.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statement Files</CardTitle>
            <CardDescription>Uploaded PDF statements</CardDescription>
          </CardHeader>
          <CardContent>
            {account.statementFiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No statements uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {account.statementFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{file.originalFilename}</p>
                      <p className="text-xs text-gray-500">
                        {file.periodStart && file.periodEnd
                          ? `${formatDate(file.periodStart, "MMM dd")} - ${formatDate(file.periodEnd, "MMM dd, yyyy")}`
                          : formatDate(file.createdAt, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          file.status === "parsed"
                            ? "bg-green-100 text-green-800"
                            : file.status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : file.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {file.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">{account.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Display Name</p>
              <p className="font-medium">{account.displayName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-medium capitalize">{account.type.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{account.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Institution</p>
              <p className="font-medium">{account.institution.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Primary Income Account</p>
              <p className="font-medium">{account.isPrimaryIncomeAccount ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { formatCurrency } from "@/lib/utils/currency";

interface Institution {
  id: string;
  name: string;
  country: string;
}

interface Account {
  id: string;
  name: string;
  displayName: string | null;
  type: string;
  currency: string;
  currentBalance: string;
  institution: Institution;
  isPrimaryIncomeAccount: boolean;
  _count: {
    transactions: number;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, institutionsRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/institutions"),
      ]);

      const accountsData = (await accountsRes.json()) as { accounts: Account[] };
      const institutionsData = (await institutionsRes.json()) as { institutions: Institution[] };

      setAccounts(accountsData.accounts || []);
      setInstitutions(institutionsData.institutions || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      checking: "💳",
      savings: "💰",
      credit_card: "💳",
      loan: "🏦",
      wallet: "👛",
    };
    return icons[type] || "🏦";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-gray-500">Manage your financial accounts</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          + Add Account
        </Button>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] overflow-y-auto">
            <CreateAccountDialog
              institutions={institutions}
              onClose={() => {
                setShowCreateDialog(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-xl font-semibold mb-2">No accounts yet</h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Get started by adding your first financial account. You can connect banks manually with PDF statements or sync live with Plaid.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getAccountTypeIcon(account.type)}</div>
                      <div>
                        <CardTitle className="text-lg">
                          {account.displayName || account.name}
                        </CardTitle>
                        <CardDescription>{account.institution.name}</CardDescription>
                      </div>
                    </div>
                    {account.isPrimaryIncomeAccount && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(parseFloat(account.currentBalance), account.currency)}
                      </p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium capitalize">
                        {account.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transactions</span>
                      <span className="font-medium">{account._count.transactions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">
                  {accounts.reduce((sum, acc) => sum + acc._count.transactions, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0),
                    "USD"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

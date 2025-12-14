"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

interface Transaction {
  id: string;
  postedAt: string;
  rawDescription: string;
  normalizedDescription: string | null;
  amount: string;
  currency: string;
  direction: string;
  isInternalTransfer: boolean;
  merchant: string | null;
  notes: string | null;
  account: {
    id: string;
    name: string;
    displayName: string | null;
    currency: string;
    institution: {
      name: string;
    };
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  subcategory: {
    id: string;
    name: string;
  } | null;
  counterparty: {
    id: string;
    name: string;
    displayName: string | null;
  } | null;
}

interface Account {
  id: string;
  name: string;
  displayName: string | null;
  institution: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    accountId: "",
    categoryId: "",
    fromDate: "",
    toDate: "",
    search: "",
    isInternalTransfer: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      setTransactions(data.transactions || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({
      accountId: "",
      categoryId: "",
      fromDate: "",
      toDate: "",
      search: "",
      isInternalTransfer: "",
    });
  };

  const updateTransactionCategory = async (transactionId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryId }),
      });

      if (response.ok) {
        fetchTransactions(); // Refresh list
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-500">View and manage all your transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <Select
                id="accountId"
                value={filters.accountId}
                onChange={(e) => handleFilterChange("accountId", e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName || account.name} ({account.institution.name})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                id="categoryId"
                value={filters.categoryId}
                onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isInternalTransfer">Transfer Type</Label>
              <Select
                id="isInternalTransfer"
                value={filters.isInternalTransfer}
                onChange={(e) => handleFilterChange("isInternalTransfer", e.target.value)}
              >
                <option value="">All Transactions</option>
                <option value="true">Internal Transfers Only</option>
                <option value="false">Exclude Internal Transfers</option>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button onClick={() => fetchTransactions()}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                Showing {transactions.length} of {pagination.total} transactions
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No transactions found. Try adjusting your filters or upload a statement.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(txn)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-2xl">
                      {txn.category?.icon || (txn.direction === "credit" ? "💰" : "💸")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {txn.normalizedDescription || txn.rawDescription}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatDate(txn.postedAt, "MMM dd, yyyy")}</span>
                        <span>•</span>
                        <span>{txn.account.displayName || txn.account.name}</span>
                        {txn.isInternalTransfer && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">Transfer</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          parseFloat(txn.amount) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {parseFloat(txn.amount) >= 0 ? "+" : ""}
                        {formatCurrency(parseFloat(txn.amount), txn.currency)}
                      </p>
                      {txn.category && (
                        <p className="text-xs text-gray-500">{txn.category.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTransaction(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {formatDate(selectedTransaction.postedAt, "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p
                    className={`font-semibold text-lg ${
                      parseFloat(selectedTransaction.amount) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      parseFloat(selectedTransaction.amount),
                      selectedTransaction.currency
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{selectedTransaction.rawDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account</p>
                  <p className="font-medium">
                    {selectedTransaction.account.displayName ||
                      selectedTransaction.account.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="font-medium">
                    {selectedTransaction.account.institution.name}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Select
                    id="editCategory"
                    value={selectedTransaction.category?.id || ""}
                    onChange={(e) => {
                      updateTransactionCategory(selectedTransaction.id, e.target.value);
                      setSelectedTransaction(null);
                    }}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

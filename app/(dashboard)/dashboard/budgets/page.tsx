"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  progress?: {
    spent: number;
    remaining: number;
    percentUsed: number;
    status: "on-track" | "warning" | "exceeded";
    periodStart: string;
    periodEnd: string;
  };
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    try {
      const response = await fetch("/api/budgets?includeProgress=true");
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBudget(id: string) {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBudgets();
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  }

  function getProgressColor(status: string) {
    switch (status) {
      case "exceeded":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "exceeded":
        return "Over Budget";
      case "warning":
        return "Warning";
      default:
        return "On Track";
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-gray-500">Manage your spending limits</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-gray-200" />
              <CardContent className="h-24 bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-gray-500">Manage your spending limits</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Create Budget</Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first budget to track spending limits
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>Create Budget</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{budget.name}</CardTitle>
                    <CardDescription>
                      {budget.category?.name || "All Categories"} • {budget.period}
                    </CardDescription>
                  </div>
                  {budget.category?.icon && (
                    <div className="text-2xl">{budget.category.icon}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {budget.progress ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">
                        {formatCurrency(budget.progress.spent)}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {formatCurrency(parseFloat(budget.amount.toString()))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(budget.progress.status)}`}
                        style={{
                          width: `${Math.min(100, budget.progress.percentUsed)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          budget.progress.status === "exceeded"
                            ? "text-red-600"
                            : budget.progress.status === "warning"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {getStatusText(budget.progress.status)}
                      </span>
                      <span className="text-gray-500">
                        {budget.progress.remaining >= 0
                          ? `${formatCurrency(budget.progress.remaining)} left`
                          : `${formatCurrency(Math.abs(budget.progress.remaining))} over`}
                      </span>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(budget.progress.periodStart).toLocaleDateString()} -{" "}
                        {new Date(budget.progress.periodEnd).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Loading progress...</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateBudgetDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchBudgets();
          }}
        />
      )}
    </div>
  );
}

function CreateBudgetDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    amount: "",
    period: "monthly",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId || null,
          amount: parseFloat(formData.amount),
          period: formData.period,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating budget:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Budget</CardTitle>
          <CardDescription>Set a spending limit for a category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Monthly Groceries"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category (Optional)</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories
                  .filter((c) => !c.parentId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="1000.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Budget"}
              </Button>
              <Button type="button" onClick={onClose} disabled={loading} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

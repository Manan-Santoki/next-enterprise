"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Institution {
  id: string;
  name: string;
  country: string;
}

interface CreateAccountDialogProps {
  institutions: Institution[];
  onClose?: () => void;
}

export function CreateAccountDialog({ institutions, onClose }: CreateAccountDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    institutionId: "",
    name: "",
    displayName: "",
    type: "checking" as const,
    currency: "USD",
    connectionType: "pdf_manual" as const,
    isPrimaryIncomeAccount: false,
    currentBalance: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create account");
      }

      router.refresh();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Account</CardTitle>
        <CardDescription>
          Connect a bank account to start tracking your finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="institutionId">Bank / Institution *</Label>
            <Select
              id="institutionId"
              value={formData.institutionId}
              onChange={(e) =>
                setFormData({ ...formData, institutionId: e.target.value })
              }
              required
            >
              <option value="">Select a bank...</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.country})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g., HDFC POR"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="e.g., Main Savings"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as any,
                  })
                }
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
                <option value="loan">Loan</option>
                <option value="wallet">Wallet</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                required
              >
                <option value="USD">USD - US Dollar</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type *</Label>
              <Select
                id="connectionType"
                value={formData.connectionType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    connectionType: e.target.value as any,
                  })
                }
                required
              >
                <option value="pdf_manual">Manual (PDF Statements)</option>
                <option value="plaid">Plaid (Live Sync)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentBalance">Current Balance</Label>
              <Input
                id="currentBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.currentBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentBalance: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimaryIncomeAccount"
              checked={formData.isPrimaryIncomeAccount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isPrimaryIncomeAccount: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPrimaryIncomeAccount" className="font-normal">
              This is my primary income account
            </Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

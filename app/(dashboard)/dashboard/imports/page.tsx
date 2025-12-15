"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils/date";

interface Account {
  id: string;
  name: string;
  displayName: string | null;
  institution: {
    name: string;
  };
}

interface Statement {
  id: string;
  originalFilename: string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  errorMessage: string | null;
  account: {
    name: string;
    displayName: string | null;
    institution: {
      name: string;
    };
  };
}

export default function ImportsPage() {
  const searchParams = useSearchParams();
  const preselectedAccountId = searchParams?.get("account");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    preselectedAccountId || ""
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchStatements();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = (await response.json()) as { accounts: Account[] };
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchStatements = async () => {
    try {
      const response = await fetch("/api/statements");
      const data = (await response.json()) as { statements: Statement[] };
      setStatements(data.statements || []);
    } catch (error) {
      console.error("Error fetching statements:", error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/statements", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; transactionsCreated?: number; statement: { originalFilename: string } };

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadSuccess(
        `Successfully parsed ${data.transactionsCreated || 0} transactions from ${data.statement.originalFilename}`
      );

      // Reset form and refresh data
      e.currentTarget.reset();
      fetchStatements();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload statement"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Statements</h1>
        <p className="text-gray-500">
          Upload PDF bank statements to automatically extract transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>
            Select an account and upload a PDF statement file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            {uploadError && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                {uploadSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountId">Account *</Label>
              <Select
                id="accountId"
                name="accountId"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
              >
                <option value="">Select an account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName || account.name} ({account.institution.name})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">PDF Statement File *</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,application/pdf"
                required
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
              <p className="text-xs text-gray-500">
                Supported banks: Chase, HDFC, DCB, Zolve (more coming soon)
              </p>
            </div>

            <Button type="submit" disabled={uploading || !selectedAccountId}>
              {uploading ? "Uploading & Parsing..." : "Upload Statement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Statements</CardTitle>
          <CardDescription>
            History of all uploaded statement files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No statements uploaded yet. Upload your first statement above!
            </p>
          ) : (
            <div className="space-y-3">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{statement.originalFilename}</p>
                    <p className="text-sm text-gray-500">
                      {statement.account.displayName || statement.account.name} •{" "}
                      {statement.account.institution.name}
                    </p>
                    {statement.periodStart && statement.periodEnd && (
                      <p className="text-xs text-gray-500">
                        Period: {formatDate(statement.periodStart, "MMM dd")} -{" "}
                        {formatDate(statement.periodEnd, "MMM dd, yyyy")}
                      </p>
                    )}
                    {statement.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {statement.errorMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        statement.status === "parsed"
                          ? "bg-green-100 text-green-800"
                          : statement.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : statement.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statement.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(statement.createdAt, "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

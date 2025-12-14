/**
 * Common validation utilities
 */

import { z } from "zod";

// Currency validation
export const currencySchema = z.enum(["USD", "INR", "EUR", "GBP"]);

// Account type validation
export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "credit_card",
  "loan",
  "wallet",
]);

// Connection type validation
export const connectionTypeSchema = z.enum(["pdf_manual", "plaid"]);

// Transaction direction validation
export const transactionDirectionSchema = z.enum(["credit", "debit"]);

// Budget period validation
export const budgetPeriodSchema = z.enum(["monthly", "weekly", "custom_range"]);

// Flow rule handling validation
export const flowRuleHandlingSchema = z.enum([
  "internal_transfer",
  "income",
  "expense",
  "ignore",
]);

// Common filters schema
export const transactionFiltersSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  accountIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  textSearch: z.string().optional(),
  isInternalTransfer: z.boolean().optional(),
  isIncome: z.boolean().optional(),
  isExpense: z.boolean().optional(),
});

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Amount validation
export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(num) && isFinite(num);
}

// Sanitize description
export function sanitizeDescription(description: string): string {
  return description
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\x20-\x7E]/g, ""); // Remove non-printable characters
}

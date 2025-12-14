import { Prisma } from "@prisma/client";

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    account: true;
    category: true;
    subcategory: true;
    statementFile: true;
    counterparty: true;
  };
}>;

export type TransactionListItem = Prisma.TransactionGetPayload<{
  include: {
    account: {
      select: {
        id: true;
        name: true;
        displayName: true;
        currency: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        icon: true;
        color: true;
      };
    };
    subcategory: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// ============================================================================
// Account Types
// ============================================================================

export type FinanceAccountWithRelations = Prisma.FinanceAccountGetPayload<{
  include: {
    institution: true;
    bankParsingTemplate: true;
  };
}>;

// ============================================================================
// Category Types
// ============================================================================

export type CategoryWithHierarchy = Prisma.CategoryGetPayload<{
  include: {
    children: true;
    parent: true;
  };
}>;

// ============================================================================
// Budget Types
// ============================================================================

export type BudgetWithRelations = Prisma.BudgetGetPayload<{
  include: {
    category: true;
    account: true;
  };
}>;

// ============================================================================
// Statement File Types
// ============================================================================

export type StatementFileWithAccount = Prisma.StatementFileGetPayload<{
  include: {
    account: {
      include: {
        institution: true;
      };
    };
  };
}>;

// ============================================================================
// Filter & Query Types
// ============================================================================

export interface TransactionFilters {
  fromDate?: Date | string;
  toDate?: Date | string;
  accountIds?: string[];
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  textSearch?: string;
  isInternalTransfer?: boolean;
  isIncome?: boolean;
  isExpense?: boolean;
}

export interface AnalyticsParams {
  userId: string;
  fromDate?: Date | string;
  toDate?: Date | string;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: "category" | "month" | "merchant" | "account";
}

// ============================================================================
// PDF Parsing Types
// ============================================================================

export interface BankParsingConfig {
  bankName: string;
  accountType: string;
  dateFormat: string;
  debitColumn: string;
  creditColumn: string;
  balanceColumn: string;
  descriptionColumn: string;
  dateColumn: string;
  tableStartMarker: string | RegExp;
  tableEndMarker?: string | RegExp;
  columnMapping: {
    [key: string]: number | string;
  };
  signConvention: "credit_positive" | "debit_negative";
  currencySymbol?: string;
  skipRows?: number;
  headerRow?: number;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  balance?: number;
  rawData?: Record<string, unknown>;
}

export interface ParsedStatementResult {
  transactions: ParsedTransaction[];
  periodStart?: Date;
  periodEnd?: Date;
  accountNumber?: string;
  openingBalance?: number;
  closingBalance?: number;
  errors: string[];
}

// ============================================================================
// Flow Rule Types
// ============================================================================

export interface FlowRuleMatch {
  ruleId: string;
  confidence: number;
  matched: {
    description?: boolean;
    amount?: boolean;
    accounts?: boolean;
  };
}

// ============================================================================
// AI & Chat Types
// ============================================================================

export interface ChatToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ChatToolCall[];
}

export interface AnalyticsToolParams {
  userId: string;
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: string;
  limit?: number;
}

// ============================================================================
// Sankey Chart Types
// ============================================================================

export interface SankeyNode {
  id: string;
  name: string;
  level: number; // 0 = income, 1 = accounts, 2 = categories
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  currency?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportParams {
  userId: string;
  type: "csv" | "pdf" | "xlsx";
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: "category" | "month" | "merchant";
  includeCharts?: boolean;
}

// ============================================================================
// Plaid Types
// ============================================================================

export interface PlaidLinkMetadata {
  institutionName: string;
  institutionId: string;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    subtype: string;
  }>;
}

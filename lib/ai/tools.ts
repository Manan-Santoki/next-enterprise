import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/currency";

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>, userId: string) => Promise<unknown>;
}

// Tool 1: Get Account Balance
export const getAccountBalance: Tool = {
  name: "get_account_balance",
  description: "Get the current balance of a specific account or all accounts",
  parameters: {
    type: "object",
    properties: {
      accountId: {
        type: "string",
        description: "The ID of the account. If not provided, returns all accounts.",
      },
    },
  },
  execute: async (args, userId) => {
    if (args.accountId) {
      const account = await prisma.financeAccount.findFirst({
        where: { id: args.accountId as string, userId },
      });
      return account ? { name: account.name, balance: account.balance.toString() } : null;
    }

    const accounts = await prisma.financeAccount.findMany({
      where: { userId },
      select: { id: true, name: true, balance: true, currency: true },
    });

    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      balance: formatCurrency(parseFloat(acc.balance.toString()), acc.currency),
    }));
  },
};

// Tool 2: Search Transactions
export const searchTransactions: Tool = {
  name: "search_transactions",
  description: "Search for transactions by date range, category, merchant, or amount",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in ISO format (e.g., 2024-01-01)",
      },
      endDate: {
        type: "string",
        description: "End date in ISO format",
      },
      category: {
        type: "string",
        description: "Category name to filter by",
      },
      merchant: {
        type: "string",
        description: "Merchant name to search for",
      },
      minAmount: {
        type: "string",
        description: "Minimum transaction amount",
      },
      maxAmount: {
        type: "string",
        description: "Maximum transaction amount",
      },
      limit: {
        type: "string",
        description: "Maximum number of results (default 10)",
      },
    },
  },
  execute: async (args, userId) => {
    const where: Record<string, unknown> = { userId };

    if (args.startDate || args.endDate) {
      where.postedAt = {};
      if (args.startDate) (where.postedAt as Record<string, unknown>).gte = new Date(args.startDate as string);
      if (args.endDate) (where.postedAt as Record<string, unknown>).lte = new Date(args.endDate as string);
    }

    if (args.merchant) {
      where.merchant = { contains: args.merchant as string, mode: "insensitive" };
    }

    if (args.minAmount || args.maxAmount) {
      where.amount = {};
      if (args.minAmount) (where.amount as Record<string, unknown>).gte = parseFloat(args.minAmount as string);
      if (args.maxAmount) (where.amount as Record<string, unknown>).lte = parseFloat(args.maxAmount as string);
    }

    const transactions = await prisma.transaction.findMany({
      where: where as never,
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
      },
      orderBy: { postedAt: "desc" },
      take: args.limit ? parseInt(args.limit as string) : 10,
    });

    return transactions.map((t) => ({
      id: t.id,
      date: t.postedAt.toISOString().split("T")[0],
      description: t.rawDescription,
      merchant: t.merchant,
      amount: formatCurrency(parseFloat(t.amount.toString()), t.currency),
      category: t.category?.name || "Uncategorized",
      account: t.account.name,
    }));
  },
};

// Tool 3: Get Spending by Category
export const getSpendingByCategory: Tool = {
  name: "get_spending_by_category",
  description: "Get total spending grouped by category for a date range",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in ISO format",
      },
      endDate: {
        type: "string",
        description: "End date in ISO format",
      },
    },
    required: ["startDate", "endDate"],
  },
  execute: async (args, userId) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        postedAt: {
          gte: new Date(args.startDate as string),
          lte: new Date(args.endDate as string),
        },
        amount: { lt: 0 }, // Only expenses
        isInternalTransfer: false,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    const categoryTotals = new Map<string, number>();

    for (const t of transactions) {
      const category = t.category?.name || "Uncategorized";
      const amount = Math.abs(parseFloat(t.amount.toString()));
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    }

    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount: formatCurrency(amount, "USD"),
        percentage: 0, // Calculate if needed
      }))
      .sort((a, b) => parseFloat(b.amount.replace(/[^0-9.-]+/g, "")) - parseFloat(a.amount.replace(/[^0-9.-]+/g, "")));
  },
};

// Tool 4: Get Monthly Summary
export const getMonthlySummary: Tool = {
  name: "get_monthly_summary",
  description: "Get income, expenses, and net for a specific month",
  parameters: {
    type: "object",
    properties: {
      month: {
        type: "string",
        description: "Month in YYYY-MM format (e.g., 2024-01)",
      },
    },
    required: ["month"],
  },
  execute: async (args, userId) => {
    const [year, month] = (args.month as string).split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const income = await prisma.transaction.aggregate({
      where: {
        userId,
        postedAt: { gte: startDate, lte: endDate },
        amount: { gt: 0 },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    });

    const expenses = await prisma.transaction.aggregate({
      where: {
        userId,
        postedAt: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    });

    const incomeTotal = parseFloat(income._sum.amount?.toString() || "0");
    const expensesTotal = Math.abs(parseFloat(expenses._sum.amount?.toString() || "0"));

    return {
      month: args.month,
      income: formatCurrency(incomeTotal, "USD"),
      expenses: formatCurrency(expensesTotal, "USD"),
      net: formatCurrency(incomeTotal - expensesTotal, "USD"),
    };
  },
};

// Tool 5: List Accounts
export const listAccounts: Tool = {
  name: "list_accounts",
  description: "Get a list of all user accounts",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (_args, userId) => {
    const accounts = await prisma.financeAccount.findMany({
      where: { userId },
      include: {
        institution: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      institution: acc.institution.name,
      type: acc.accountType,
      balance: formatCurrency(parseFloat(acc.balance.toString()), acc.currency),
      lastFour: acc.lastFour,
    }));
  },
};

// Tool 6: Get Budget Status
export const getBudgetStatus: Tool = {
  name: "get_budget_status",
  description: "Get current status of all budgets",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (_args, userId) => {
    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: { select: { name: true } } },
    });

    const now = new Date();
    const results = [];

    for (const budget of budgets) {
      let startDate: Date;
      let endDate: Date;

      if (budget.period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        startDate = budget.startDate || now;
        endDate = budget.endDate || now;
      }

      const spent = await prisma.transaction.aggregate({
        where: {
          userId,
          postedAt: { gte: startDate, lte: endDate },
          amount: { lt: 0 },
          isInternalTransfer: false,
          ...(budget.categoryId && { categoryId: budget.categoryId }),
        },
        _sum: { amount: true },
      });

      const spentAmount = Math.abs(parseFloat(spent._sum.amount?.toString() || "0"));
      const limit = parseFloat(budget.limitAmount.toString());
      const remaining = limit - spentAmount;
      const percentUsed = (spentAmount / limit) * 100;

      results.push({
        name: budget.name,
        category: budget.category?.name || "All Categories",
        limit: formatCurrency(limit, budget.currency),
        spent: formatCurrency(spentAmount, budget.currency),
        remaining: formatCurrency(remaining, budget.currency),
        percentUsed: Math.round(percentUsed),
        status: percentUsed >= 100 ? "exceeded" : percentUsed >= 80 ? "warning" : "on-track",
      });
    }

    return results;
  },
};

// Tool 7: Find Top Merchants
export const findTopMerchants: Tool = {
  name: "find_top_merchants",
  description: "Find top merchants by spending in a date range",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in ISO format",
      },
      endDate: {
        type: "string",
        description: "End date in ISO format",
      },
      limit: {
        type: "string",
        description: "Number of top merchants to return (default 5)",
      },
    },
    required: ["startDate", "endDate"],
  },
  execute: async (args, userId) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        postedAt: {
          gte: new Date(args.startDate as string),
          lte: new Date(args.endDate as string),
        },
        amount: { lt: 0 },
        merchant: { not: null },
        isInternalTransfer: false,
      },
      select: {
        merchant: true,
        amount: true,
        currency: true,
      },
    });

    const merchantTotals = new Map<string, number>();

    for (const t of transactions) {
      if (t.merchant) {
        const amount = Math.abs(parseFloat(t.amount.toString()));
        merchantTotals.set(t.merchant, (merchantTotals.get(t.merchant) || 0) + amount);
      }
    }

    const limit = args.limit ? parseInt(args.limit as string) : 5;

    return Array.from(merchantTotals.entries())
      .map(([merchant, amount]) => ({
        merchant,
        amount: formatCurrency(amount, "USD"),
      }))
      .sort((a, b) => parseFloat(b.amount.replace(/[^0-9.-]+/g, "")) - parseFloat(a.amount.replace(/[^0-9.-]+/g, "")))
      .slice(0, limit);
  },
};

// Tool 8: Create Budget
export const createBudget: Tool = {
  name: "create_budget",
  description: "Create a new budget for a category or overall spending",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Budget name",
      },
      amount: {
        type: "string",
        description: "Budget limit amount",
      },
      period: {
        type: "string",
        description: "Budget period",
        enum: ["monthly", "weekly", "yearly"],
      },
      category: {
        type: "string",
        description: "Category name (optional)",
      },
    },
    required: ["name", "amount", "period"],
  },
  execute: async (args, userId) => {
    let categoryId = null;

    if (args.category) {
      const category = await prisma.category.findFirst({
        where: {
          userId,
          name: { equals: args.category as string, mode: "insensitive" },
        },
      });
      categoryId = category?.id || null;
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        name: args.name as string,
        limitAmount: parseFloat(args.amount as string),
        period: args.period as string,
        currency: "USD",
        categoryId,
      },
    });

    return {
      id: budget.id,
      name: budget.name,
      limit: formatCurrency(parseFloat(budget.limitAmount.toString()), budget.currency),
      period: budget.period,
    };
  },
};

// Tool 9: Get Recent Transactions
export const getRecentTransactions: Tool = {
  name: "get_recent_transactions",
  description: "Get the most recent transactions",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "string",
        description: "Number of transactions to return (default 10)",
      },
    },
  },
  execute: async (args, userId) => {
    const limit = args.limit ? parseInt(args.limit as string) : 10;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
      },
      orderBy: { postedAt: "desc" },
      take: limit,
    });

    return transactions.map((t) => ({
      date: t.postedAt.toISOString().split("T")[0],
      description: t.rawDescription,
      merchant: t.merchant || "Unknown",
      amount: formatCurrency(parseFloat(t.amount.toString()), t.currency),
      category: t.category?.name || "Uncategorized",
      account: t.account.name,
    }));
  },
};

// Tool 10: Compare Time Periods
export const compareTimePeriods: Tool = {
  name: "compare_time_periods",
  description: "Compare spending between two time periods",
  parameters: {
    type: "object",
    properties: {
      period1Start: {
        type: "string",
        description: "Period 1 start date in ISO format",
      },
      period1End: {
        type: "string",
        description: "Period 1 end date in ISO format",
      },
      period2Start: {
        type: "string",
        description: "Period 2 start date in ISO format",
      },
      period2End: {
        type: "string",
        description: "Period 2 end date in ISO format",
      },
    },
    required: ["period1Start", "period1End", "period2Start", "period2End"],
  },
  execute: async (args, userId) => {
    const period1 = await prisma.transaction.aggregate({
      where: {
        userId,
        postedAt: {
          gte: new Date(args.period1Start as string),
          lte: new Date(args.period1End as string),
        },
        amount: { lt: 0 },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    });

    const period2 = await prisma.transaction.aggregate({
      where: {
        userId,
        postedAt: {
          gte: new Date(args.period2Start as string),
          lte: new Date(args.period2End as string),
        },
        amount: { lt: 0 },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    });

    const period1Total = Math.abs(parseFloat(period1._sum.amount?.toString() || "0"));
    const period2Total = Math.abs(parseFloat(period2._sum.amount?.toString() || "0"));
    const difference = period2Total - period1Total;
    const percentChange = period1Total > 0 ? ((difference / period1Total) * 100) : 0;

    return {
      period1: {
        start: args.period1Start,
        end: args.period1End,
        spending: formatCurrency(period1Total, "USD"),
      },
      period2: {
        start: args.period2Start,
        end: args.period2End,
        spending: formatCurrency(period2Total, "USD"),
      },
      difference: formatCurrency(Math.abs(difference), "USD"),
      percentChange: Math.round(percentChange),
      trend: difference > 0 ? "increased" : "decreased",
    };
  },
};

// Export all tools
export const tools: Tool[] = [
  getAccountBalance,
  searchTransactions,
  getSpendingByCategory,
  getMonthlySummary,
  listAccounts,
  getBudgetStatus,
  findTopMerchants,
  createBudget,
  getRecentTransactions,
  compareTimePeriods,
];

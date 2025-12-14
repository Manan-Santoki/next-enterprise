import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface AnalyticsFilter {
  userId: string;
  fromDate?: Date;
  toDate?: Date;
  accountIds?: string[];
  categoryIds?: string[];
}

/**
 * Get financial overview (income, expenses, net cash flow)
 */
export async function getOverview(filter: AnalyticsFilter) {
  const where: Prisma.TransactionWhereInput = {
    userId: filter.userId,
    isInternalTransfer: false, // Exclude internal transfers
  };

  if (filter.fromDate) {
    where.postedAt = { ...where.postedAt, gte: filter.fromDate };
  }

  if (filter.toDate) {
    where.postedAt = { ...where.postedAt, lte: filter.toDate };
  }

  if (filter.accountIds && filter.accountIds.length > 0) {
    where.accountId = { in: filter.accountIds };
  }

  // Get total income
  const income = await prisma.transaction.aggregate({
    where: {
      ...where,
      amount: { gt: 0 },
    },
    _sum: {
      amount: true,
    },
  });

  // Get total expenses
  const expenses = await prisma.transaction.aggregate({
    where: {
      ...where,
      amount: { lt: 0 },
    },
    _sum: {
      amount: true,
    },
  });

  // Get transaction count
  const count = await prisma.transaction.count({ where });

  // Get account balances
  const accounts = await prisma.financeAccount.findMany({
    where: {
      userId: filter.userId,
      isActive: true,
      ...(filter.accountIds && filter.accountIds.length > 0
        ? { id: { in: filter.accountIds } }
        : {}),
    },
    select: {
      currentBalance: true,
      currency: true,
    },
  });

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.currentBalance.toString()),
    0
  );

  return {
    income: parseFloat(income._sum.amount?.toString() || "0"),
    expenses: Math.abs(parseFloat(expenses._sum.amount?.toString() || "0")),
    netCashFlow:
      parseFloat(income._sum.amount?.toString() || "0") +
      parseFloat(expenses._sum.amount?.toString() || "0"),
    totalBalance,
    transactionCount: count,
  };
}

/**
 * Get spending by category
 */
export async function getSpendingByCategory(filter: AnalyticsFilter) {
  const where: Prisma.TransactionWhereInput = {
    userId: filter.userId,
    isInternalTransfer: false,
    amount: { lt: 0 }, // Only expenses
  };

  if (filter.fromDate) {
    where.postedAt = { ...where.postedAt, gte: filter.fromDate };
  }

  if (filter.toDate) {
    where.postedAt = { ...where.postedAt, lte: filter.toDate };
  }

  if (filter.accountIds && filter.accountIds.length > 0) {
    where.accountId = { in: filter.accountIds };
  }

  if (filter.categoryIds && filter.categoryIds.length > 0) {
    where.categoryId = { in: filter.categoryIds };
  }

  const transactions = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get category details
  const categoryIds = transactions
    .map((t) => t.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return transactions.map((t) => {
    const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
    return {
      categoryId: t.categoryId,
      categoryName: category?.name || "Uncategorized",
      icon: category?.icon,
      color: category?.color,
      amount: Math.abs(parseFloat(t._sum.amount?.toString() || "0")),
      transactionCount: t._count.id,
    };
  }).sort((a, b) => b.amount - a.amount);
}

/**
 * Get spending time series (by month or week)
 */
export async function getSpendingTimeSeries(
  filter: AnalyticsFilter,
  groupBy: "month" | "week" = "month"
) {
  const where: Prisma.TransactionWhereInput = {
    userId: filter.userId,
    isInternalTransfer: false,
  };

  if (filter.fromDate) {
    where.postedAt = { ...where.postedAt, gte: filter.fromDate };
  }

  if (filter.toDate) {
    where.postedAt = { ...where.postedAt, lte: filter.toDate };
  }

  if (filter.accountIds && filter.accountIds.length > 0) {
    where.accountId = { in: filter.accountIds };
  }

  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      postedAt: true,
      amount: true,
    },
    orderBy: {
      postedAt: "asc",
    },
  });

  // Group by month
  const grouped = new Map<
    string,
    { income: number; expenses: number; net: number }
  >();

  for (const txn of transactions) {
    const date = new Date(txn.postedAt);
    const key =
      groupBy === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}-W${getWeekNumber(date)}`;

    if (!grouped.has(key)) {
      grouped.set(key, { income: 0, expenses: 0, net: 0 });
    }

    const entry = grouped.get(key)!;
    const amount = parseFloat(txn.amount.toString());

    if (amount > 0) {
      entry.income += amount;
    } else {
      entry.expenses += Math.abs(amount);
    }
    entry.net += amount;
  }

  return Array.from(grouped.entries())
    .map(([period, data]) => ({
      period,
      ...data,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get top merchants by spending
 */
export async function getTopMerchants(
  filter: AnalyticsFilter,
  limit: number = 10
) {
  const where: Prisma.TransactionWhereInput = {
    userId: filter.userId,
    isInternalTransfer: false,
    amount: { lt: 0 },
    merchant: { not: null },
  };

  if (filter.fromDate) {
    where.postedAt = { ...where.postedAt, gte: filter.fromDate };
  }

  if (filter.toDate) {
    where.postedAt = { ...where.postedAt, lte: filter.toDate };
  }

  if (filter.accountIds && filter.accountIds.length > 0) {
    where.accountId = { in: filter.accountIds };
  }

  const merchants = await prisma.transaction.groupBy({
    by: ["merchant"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  return merchants
    .map((m) => ({
      merchant: m.merchant || "Unknown",
      amount: Math.abs(parseFloat(m._sum.amount?.toString() || "0")),
      transactionCount: m._count.id,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Get income breakdown by source
 */
export async function getIncomeBreakdown(filter: AnalyticsFilter) {
  const where: Prisma.TransactionWhereInput = {
    userId: filter.userId,
    isInternalTransfer: false,
    amount: { gt: 0 },
  };

  if (filter.fromDate) {
    where.postedAt = { ...where.postedAt, gte: filter.fromDate };
  }

  if (filter.toDate) {
    where.postedAt = { ...where.postedAt, lte: filter.toDate };
  }

  if (filter.accountIds && filter.accountIds.length > 0) {
    where.accountId = { in: filter.accountIds };
  }

  const transactions = await prisma.transaction.groupBy({
    by: ["subcategoryId"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get subcategory details
  const subcategoryIds = transactions
    .map((t) => t.subcategoryId)
    .filter((id): id is string => id !== null);

  const subcategories = await prisma.category.findMany({
    where: {
      id: { in: subcategoryIds },
    },
  });

  const subcategoryMap = new Map(subcategories.map((c) => [c.id, c]));

  return transactions.map((t) => {
    const subcategory = t.subcategoryId
      ? subcategoryMap.get(t.subcategoryId)
      : null;
    return {
      source: subcategory?.name || "Other Income",
      amount: parseFloat(t._sum.amount?.toString() || "0"),
      transactionCount: t._count.id,
    };
  }).sort((a, b) => b.amount - a.amount);
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

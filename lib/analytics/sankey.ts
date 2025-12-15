// @ts-nocheck
import { prisma } from "@/lib/db";
import { AnalyticsFilter } from "./queries";

export interface SankeyNode {
  id: string;
  name: string;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Get Sankey diagram data showing money flow
 * Shows: Accounts → Categories → Subcategories
 */
export async function getSankeyData(filter: AnalyticsFilter): Promise<SankeyData> {
  const where: any = {
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

  // Get all transactions with account and category info
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const nodeIds = new Set<string>();

  // Helper to add node if not exists
  const addNode = (id: string, name: string, color?: string) => {
    if (!nodeIds.has(id)) {
      nodes.push({ id, name, color });
      nodeIds.add(id);
    }
  };

  // Build flow map: Account → Category → Subcategory
  const flowMap = new Map<string, number>();

  for (const txn of transactions) {
    const amount = Math.abs(parseFloat(txn.amount.toString()));
    const accountId = `account:${txn.account.id}`;
    const accountName = txn.account.name;

    // Add account node
    addNode(accountId, accountName);

    if (txn.category) {
      const categoryId = `category:${txn.category.id}`;
      const categoryName = txn.category.name;

      // Add category node
      addNode(categoryId, categoryName, txn.category.color || undefined);

      // Account → Category flow
      const accountToCategoryKey = `${accountId}→${categoryId}`;
      flowMap.set(accountToCategoryKey, (flowMap.get(accountToCategoryKey) || 0) + amount);

      // If there's a subcategory, add Category → Subcategory flow
      if (txn.subcategory) {
        const subcategoryId = `subcategory:${txn.subcategory.id}`;
        const subcategoryName = txn.subcategory.name;

        // Add subcategory node
        addNode(subcategoryId, subcategoryName, txn.subcategory.color || undefined);

        // Category → Subcategory flow
        const categoryToSubcategoryKey = `${categoryId}→${subcategoryId}`;
        flowMap.set(
          categoryToSubcategoryKey,
          (flowMap.get(categoryToSubcategoryKey) || 0) + amount
        );
      }
    } else {
      // Uncategorized transactions
      const uncategorizedId = "category:uncategorized";
      addNode(uncategorizedId, "Uncategorized", "#9ca3af");

      const accountToUncategorizedKey = `${accountId}→${uncategorizedId}`;
      flowMap.set(
        accountToUncategorizedKey,
        (flowMap.get(accountToUncategorizedKey) || 0) + amount
      );
    }
  }

  // Convert flow map to links
  for (const [key, value] of flowMap) {
    const [source, target] = key.split("→");
    links.push({ source, target, value });
  }

  // Sort links by value (largest first)
  links.sort((a, b) => b.value - a.value);

  return { nodes, links };
}

/**
 * Get simplified income/expense flow
 * Shows: Income Sources → Accounts → Expense Categories
 */
export async function getIncomeExpenseFlow(filter: AnalyticsFilter): Promise<SankeyData> {
  const where: any = {
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

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const nodeIds = new Set<string>();

  const addNode = (id: string, name: string, color?: string) => {
    if (!nodeIds.has(id)) {
      nodes.push({ id, name, color });
      nodeIds.add(id);
    }
  };

  const flowMap = new Map<string, number>();

  for (const txn of transactions) {
    const amount = Math.abs(parseFloat(txn.amount.toString()));
    const isIncome = parseFloat(txn.amount.toString()) > 0;
    const accountId = `account:${txn.account.id}`;
    const accountName = txn.account.name;

    addNode(accountId, accountName);

    if (isIncome) {
      // Income: Source → Account
      const sourceId = txn.category
        ? `income:${txn.category.id}`
        : "income:other";
      const sourceName = txn.category?.name || "Other Income";

      addNode(sourceId, sourceName, "#10b981");

      const sourceToAccountKey = `${sourceId}→${accountId}`;
      flowMap.set(sourceToAccountKey, (flowMap.get(sourceToAccountKey) || 0) + amount);
    } else {
      // Expense: Account → Category
      const categoryId = txn.category
        ? `expense:${txn.category.id}`
        : "expense:uncategorized";
      const categoryName = txn.category?.name || "Uncategorized";

      addNode(categoryId, categoryName, txn.category?.color || "#ef4444");

      const accountToCategoryKey = `${accountId}→${categoryId}`;
      flowMap.set(accountToCategoryKey, (flowMap.get(accountToCategoryKey) || 0) + amount);
    }
  }

  for (const [key, value] of flowMap) {
    const [source, target] = key.split("→");
    links.push({ source, target, value });
  }

  links.sort((a, b) => b.value - a.value);

  return { nodes, links };
}

import { prisma } from "@/lib/db";
import { findMerchantMatch } from "./merchants";

/**
 * Categorize a single transaction using rules
 */
export async function categorizeTransaction(transactionId: string): Promise<boolean> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return false;
  }

  // Skip if already categorized manually
  if (transaction.aiCategorizationSource === "manual") {
    return false;
  }

  // Check user-defined rules first
  const userRules = await prisma.userCategoryRule.findMany({
    where: {
      userId: transaction.userId,
      OR: [
        { accountId: null },
        { accountId: transaction.accountId },
      ],
    },
    orderBy: {
      priority: "desc",
    },
  });

  // Try user rules
  for (const rule of userRules) {
    const description = transaction.rawDescription.toLowerCase();
    let matches = false;

    // Check if any of the keywords match
    for (const keyword of rule.descriptionIncludes) {
      if (description.includes(keyword.toLowerCase())) {
        matches = true;
        break;
      }
    }

    // Check merchant if specified
    if (rule.merchant && transaction.merchant) {
      if (transaction.merchant.toLowerCase().includes(rule.merchant.toLowerCase())) {
        matches = true;
      }
    }

    if (matches) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: rule.categoryId,
          aiCategorizationSource: "rules",
        },
      });
      return true;
    }
  }

  // Try merchant database
  const merchantMatch = findMerchantMatch(transaction.rawDescription);

  if (merchantMatch) {
    // Find category by name
    const category = await prisma.category.findFirst({
      where: {
        name: merchantMatch.categoryName,
        isSystem: true,
      },
    });

    if (category) {
      let subcategoryId = null;

      if (merchantMatch.subcategoryName) {
        const subcategory = await prisma.category.findFirst({
          where: {
            name: merchantMatch.subcategoryName,
            parentId: category.id,
          },
        });
        subcategoryId = subcategory?.id || null;
      }

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: category.id,
          subcategoryId,
          merchant: merchantMatch.merchant,
          aiCategorizationSource: "rules",
        },
      });
      return true;
    }
  }

  // Default categorization based on direction for internal transfers
  if (transaction.isInternalTransfer) {
    const transferCategory = await prisma.category.findFirst({
      where: {
        name: "Transfers",
        isSystem: true,
      },
    });

    if (transferCategory) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: transferCategory.id,
          aiCategorizationSource: "rules",
        },
      });
      return true;
    }
  }

  // Default categorization for income/expense
  if (transaction.isIncome) {
    const incomeCategory = await prisma.category.findFirst({
      where: {
        name: "Income",
        isSystem: true,
      },
    });

    if (incomeCategory) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: incomeCategory.id,
          aiCategorizationSource: "rules",
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Categorize all uncategorized transactions for a user
 */
export async function categorizeAllTransactions(userId: string): Promise<{
  total: number;
  categorized: number;
}> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      categoryId: null,
    },
    select: {
      id: true,
    },
  });

  let categorized = 0;

  for (const txn of transactions) {
    const success = await categorizeTransaction(txn.id);
    if (success) categorized++;
  }

  return {
    total: transactions.length,
    categorized,
  };
}

/**
 * Learn from user corrections and create rules
 */
export async function learnFromCorrections(userId: string): Promise<number> {
  // Get recent corrections
  const corrections = await prisma.transactionCorrection.findMany({
    where: {
      userId,
      field: "category",
    },
    include: {
      transaction: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Last 100 corrections
  });

  let rulesCreated = 0;

  // Group corrections by category
  const correctionsByCategory = new Map<string, typeof corrections>();

  for (const correction of corrections) {
    if (!correction.newValue) continue;

    if (!correctionsByCategory.has(correction.newValue)) {
      correctionsByCategory.set(correction.newValue, []);
    }
    correctionsByCategory.get(correction.newValue)!.push(correction);
  }

  // Create rules from patterns
  for (const [categoryId, categoryCorrections] of correctionsByCategory) {
    if (categoryCorrections.length < 2) continue; // Need at least 2 examples

    // Find common keywords
    const descriptions = categoryCorrections.map((c) => c.transaction.rawDescription.toLowerCase());
    const words = new Set<string>();

    for (const desc of descriptions) {
      const descWords = desc.split(/\s+/).filter((w) => w.length > 3);
      descWords.forEach((w) => words.add(w));
    }

    // Find words that appear in at least 50% of descriptions
    const commonWords: string[] = [];
    for (const word of words) {
      let count = 0;
      for (const desc of descriptions) {
        if (desc.includes(word)) count++;
      }
      if (count / descriptions.length >= 0.5) {
        commonWords.push(word);
      }
    }

    if (commonWords.length > 0) {
      // Check if rule already exists
      const existingRule = await prisma.userCategoryRule.findFirst({
        where: {
          userId,
          categoryId,
          descriptionIncludes: {
            hasSome: commonWords,
          },
        },
      });

      if (!existingRule) {
        await prisma.userCategoryRule.create({
          data: {
            userId,
            categoryId,
            descriptionIncludes: commonWords,
            priority: 50,
          },
        });
        rulesCreated++;
      }
    }
  }

  return rulesCreated;
}

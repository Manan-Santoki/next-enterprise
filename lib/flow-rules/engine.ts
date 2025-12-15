// @ts-nocheck
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface FlowRuleMatch {
  ruleId: string;
  confidence: number;
  matchedFields: string[];
}

/**
 * Evaluate all flow rules for a single transaction
 */
export async function evaluateFlowRules(
  transactionId: string
): Promise<FlowRuleMatch[]> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    return [];
  }

  // Get all active flow rules for this user
  const flowRules = await prisma.flowRule.findMany({
    where: {
      userId: transaction.userId,
      isActive: true,
    },
    orderBy: {
      priority: "desc", // Higher priority first
    },
  });

  const matches: FlowRuleMatch[] = [];

  for (const rule of flowRules) {
    const match = matchesRule(transaction, rule);
    if (match.matches) {
      matches.push({
        ruleId: rule.id,
        confidence: match.confidence,
        matchedFields: match.matchedFields,
      });
    }
  }

  return matches;
}

interface MatchResult {
  matches: boolean;
  confidence: number;
  matchedFields: string[];
}

/**
 * Check if a transaction matches a flow rule
 */
function matchesRule(
  transaction: any,
  rule: any
): MatchResult {
  const matchedFields: string[] = [];
  let confidence = 0;
  const maxConfidence = 100;

  // Check direction
  const directionMatches =
    rule.matchDirection === "both" ||
    (rule.matchDirection === "in" && transaction.direction === "credit") ||
    (rule.matchDirection === "out" && transaction.direction === "debit");

  if (!directionMatches) {
    return { matches: false, confidence: 0, matchedFields: [] };
  }

  // Check source account
  if (rule.sourceAccountId) {
    if (transaction.accountId === rule.sourceAccountId) {
      matchedFields.push("sourceAccount");
      confidence += 30;
    } else {
      // Source account specified but doesn't match
      return { matches: false, confidence: 0, matchedFields: [] };
    }
  }

  // Check description includes
  if (rule.descriptionIncludes && rule.descriptionIncludes.length > 0) {
    const description = transaction.rawDescription.toLowerCase();
    let includesMatches = 0;

    for (const substring of rule.descriptionIncludes) {
      if (description.includes(substring.toLowerCase())) {
        includesMatches++;
      }
    }

    if (includesMatches > 0) {
      matchedFields.push("description");
      confidence += (includesMatches / rule.descriptionIncludes.length) * 40;
    } else if (rule.descriptionIncludes.length > 0) {
      // Description patterns specified but none match
      return { matches: false, confidence: 0, matchedFields: [] };
    }
  }

  // Check description regex
  if (rule.descriptionRegex) {
    try {
      const regex = new RegExp(rule.descriptionRegex, "i");
      if (regex.test(transaction.rawDescription)) {
        matchedFields.push("regex");
        confidence += 40;
      } else {
        // Regex specified but doesn't match
        return { matches: false, confidence: 0, matchedFields: [] };
      }
    } catch (error) {
      console.error("Invalid regex in flow rule:", rule.id, error);
    }
  }

  // Check amount range
  if (rule.minAmount !== null || rule.maxAmount !== null) {
    const amount = Math.abs(parseFloat(transaction.amount.toString()));

    if (rule.minAmount !== null && amount < parseFloat(rule.minAmount.toString())) {
      return { matches: false, confidence: 0, matchedFields: [] };
    }

    if (rule.maxAmount !== null && amount > parseFloat(rule.maxAmount.toString())) {
      return { matches: false, confidence: 0, matchedFields: [] };
    }

    matchedFields.push("amount");
    confidence += 15;
  }

  // Must have at least one matched field
  if (matchedFields.length === 0) {
    return { matches: false, confidence: 0, matchedFields: [] };
  }

  return {
    matches: true,
    confidence: Math.min(confidence, maxConfidence),
    matchedFields,
  };
}

/**
 * Apply flow rule to a transaction
 */
export async function applyFlowRule(
  transactionId: string,
  ruleId: string
): Promise<void> {
  const rule = await prisma.flowRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule || !rule.isActive) {
    return;
  }

  const updates: Prisma.TransactionUpdateInput = {};

  switch (rule.handling) {
    case "internal_transfer":
      updates.isInternalTransfer = true;
      updates.isIncome = false;
      updates.isExpense = false;
      if (rule.destinationAccountId) {
        updates.counterpartyAccountId = rule.destinationAccountId;
      }
      break;

    case "income":
      updates.isIncome = true;
      updates.isExpense = false;
      updates.isInternalTransfer = false;
      break;

    case "expense":
      updates.isExpense = true;
      updates.isIncome = false;
      updates.isInternalTransfer = false;
      break;

    case "ignore":
      updates.isIncome = false;
      updates.isExpense = false;
      updates.isInternalTransfer = false;
      break;
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: updates,
  });
}

/**
 * Find matching transaction pairs for internal transfers
 * This looks for the counterpart transaction in another account
 */
export async function findTransferPairs(
  userId: string,
  timeWindowHours: number = 48
): Promise<void> {
  // Get all potential transfer transactions (marked as isInternalTransfer but no transferGroupId)
  const pendingTransfers = await prisma.transaction.findMany({
    where: {
      userId,
      isInternalTransfer: true,
      transferGroupId: null,
    },
    include: {
      account: true,
    },
    orderBy: {
      postedAt: "desc",
    },
  });

  for (const txn of pendingTransfers) {
    // Look for matching transaction in other accounts
    const timeWindow = new Date(txn.postedAt);
    const startTime = new Date(timeWindow.getTime() - timeWindowHours * 60 * 60 * 1000);
    const endTime = new Date(timeWindow.getTime() + timeWindowHours * 60 * 60 * 1000);

    const amount = Math.abs(parseFloat(txn.amount.toString()));

    // Find potential matches
    const matches = await prisma.transaction.findMany({
      where: {
        userId,
        accountId: { not: txn.accountId }, // Different account
        postedAt: {
          gte: startTime,
          lte: endTime,
        },
        transferGroupId: null, // Not already paired
      },
    });

    // Find best match by amount
    let bestMatch = null;
    let smallestDiff = Infinity;

    for (const match of matches) {
      const matchAmount = Math.abs(parseFloat(match.amount.toString()));
      const diff = Math.abs(amount - matchAmount);

      // Must be opposite direction and similar amount
      if (
        match.direction !== txn.direction &&
        diff < amount * 0.01 && // Within 1% tolerance
        diff < smallestDiff
      ) {
        smallestDiff = diff;
        bestMatch = match;
      }
    }

    // If we found a match, pair them
    if (bestMatch) {
      const groupId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await prisma.transaction.updateMany({
        where: {
          id: { in: [txn.id, bestMatch.id] },
        },
        data: {
          transferGroupId: groupId,
          isInternalTransfer: true,
          isIncome: false,
          isExpense: false,
        },
      });

      // Update each transaction to point to its counterparty
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { counterpartyAccountId: bestMatch.accountId },
      });

      await prisma.transaction.update({
        where: { id: bestMatch.id },
        data: { counterpartyAccountId: txn.accountId },
      });
    }
  }
}

/**
 * Process all transactions for flow rules
 */
export async function processTransactionsWithFlowRules(
  userId: string
): Promise<{ processed: number; transfers: number }> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  let processed = 0;

  for (const txn of transactions) {
    const matches = await evaluateFlowRules(txn.id);

    if (matches.length > 0) {
      // Apply highest confidence match
      const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
      await applyFlowRule(txn.id, bestMatch.ruleId);
      processed++;
    }
  }

  // Find transfer pairs
  await findTransferPairs(userId);

  // Count transfers
  const transfers = await prisma.transaction.count({
    where: {
      userId,
      isInternalTransfer: true,
    },
  });

  return { processed, transfers };
}

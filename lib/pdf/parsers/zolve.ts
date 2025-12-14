import { ParsedTransaction, ParsedStatementResult } from "@/lib/types";
import { extractTextFromPDF, cleanOCRText } from "../ocr";

/**
 * Parse Zolve credit card statement
 * Zolve statements have a "TRANSACTIONS" section with:
 * Date | Description | Amount
 */
export async function parseZolveStatement(
  buffer: Buffer
): Promise<ParsedStatementResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  try {
    // Extract text (with OCR fallback)
    let text = await extractTextFromPDF(buffer);
    text = cleanOCRText(text);

    // Find card number (last 4 digits)
    const cardMatch = text.match(/Card ending in\s+(\d{4})/i);
    const accountNumber = cardMatch ? `****${cardMatch[1]}` : undefined;

    // Find statement period
    const periodMatch = text.match(
      /Statement Period[:\s]+(\w+ \d{1,2}, \d{4})\s*-\s*(\w+ \d{1,2}, \d{4})/i
    );

    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (periodMatch) {
      periodStart = new Date(periodMatch[1]);
      periodEnd = new Date(periodMatch[2]);
    }

    // Find credit limit and balance
    const limitMatch = text.match(/Credit Limit[:\s]+\$\s*([\d,]+\.\d{2})/i);
    const balanceMatch = text.match(/Current Balance[:\s]+\$\s*([\d,]+\.\d{2})/i);

    const closingBalance = balanceMatch
      ? parseFloat(balanceMatch[1].replace(/,/g, ""))
      : undefined;

    // Find transaction section
    const transactionSectionMatch = text.match(
      /TRANSACTIONS([\s\S]*?)(?:FEES AND INTEREST|PAYMENT INFORMATION|$)/i
    );

    if (!transactionSectionMatch) {
      errors.push("Could not find TRANSACTIONS section");
      return { transactions, errors, closingBalance };
    }

    const transactionText = transactionSectionMatch[1];

    // Parse transaction lines
    // Format: MM/DD Description $Amount
    const lines = transactionText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 10) continue;

      // Match date at start: MM/DD
      const dateMatch = trimmed.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const rest = dateMatch[2];

      // Extract amount (last number with $ sign)
      const amountMatch = rest.match(/\$\s*([\d,]+\.\d{2})$/);
      if (!amountMatch) continue;

      const amountStr = amountMatch[1];
      const amount = parseFloat(amountStr.replace(/,/g, ""));

      // Description is everything before the amount
      const description = rest.substring(0, rest.lastIndexOf(amountMatch[0])).trim();

      if (!description) continue;

      // Construct full date using statement end year
      const year = periodEnd?.getFullYear() || new Date().getFullYear();
      const [month, day] = dateStr.split("/").map((n) => parseInt(n));
      const fullDate = new Date(year, month - 1, day);

      // Zolve is a credit card, so all transactions are debits (charges)
      // except payments and credits
      const isCredit = description.match(/payment|credit|refund/i);

      transactions.push({
        date: fullDate.toISOString(),
        description,
        amount,
        type: isCredit ? "credit" : "debit",
        rawData: {
          dateStr,
          amountStr,
        },
      });
    }

    return {
      transactions,
      periodStart,
      periodEnd,
      accountNumber,
      closingBalance,
      errors,
    };
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Unknown parsing error"
    );
    return { transactions, errors };
  }
}

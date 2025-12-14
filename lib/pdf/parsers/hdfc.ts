import { ParsedTransaction, ParsedStatementResult } from "@/lib/types";
import { extractTextFromPDF, cleanOCRText } from "../ocr";

/**
 * Parse HDFC Bank statement
 * HDFC statements have a "Statement of account" section with columns:
 * Date | Narration | Withdrawal Amt. | Deposit Amt. | Closing Balance
 */
export async function parseHDFCStatement(
  buffer: Buffer
): Promise<ParsedStatementResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  try {
    // Extract text (with OCR fallback)
    let text = await extractTextFromPDF(buffer);
    text = cleanOCRText(text);

    // Find account number
    const accountMatch = text.match(/Account Number[:\s]+(\d+)/i);
    const accountNumber = accountMatch ? accountMatch[1] : undefined;

    // Find statement period
    const periodMatch = text.match(
      /Statement of Account from\s+(\d{2}[/-]\d{2}[/-]\d{4})\s+to\s+(\d{2}[/-]\d{2}[/-]\d{4})/i
    );

    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (periodMatch) {
      periodStart = parseDateString(periodMatch[1]);
      periodEnd = parseDateString(periodMatch[2]);
    }

    // Find opening and closing balance
    const openingMatch = text.match(/Opening Balance[:\s]+(?:Rs\.?|INR)?\s*([\d,]+\.\d{2})/i);
    const closingMatch = text.match(/Closing Balance[:\s]+(?:Rs\.?|INR)?\s*([\d,]+\.\d{2})/i);

    const openingBalance = openingMatch
      ? parseFloat(openingMatch[1].replace(/,/g, ""))
      : undefined;
    const closingBalance = closingMatch
      ? parseFloat(closingMatch[1].replace(/,/g, ""))
      : undefined;

    // Find transaction section
    const transactionSectionMatch = text.match(
      /Statement of account([\s\S]*?)(?:Closing Balance|$)/i
    );

    if (!transactionSectionMatch) {
      errors.push("Could not find Statement of account section");
      return { transactions, errors, openingBalance, closingBalance };
    }

    const transactionText = transactionSectionMatch[1];

    // Parse transaction lines
    // Format: DD/MM/YYYY Description WithdrawalAmt DepositAmt ClosingBalance
    const lines = transactionText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 15) continue;

      // Match date at start of line: DD/MM/YYYY or DD-MM-YYYY
      const dateMatch = trimmed.match(/^(\d{2}[/-]\d{2}[/-]\d{4})\s+(.+)$/);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const rest = dateMatch[2];

      // Extract amounts (last 2-3 numbers)
      const amountMatches = rest.match(/([\d,]+\.\d{2})/g);
      if (!amountMatches || amountMatches.length < 2) continue;

      // Last number is closing balance
      const balanceStr = amountMatches[amountMatches.length - 1];
      const balance = parseFloat(balanceStr.replace(/,/g, ""));

      // Second to last is withdrawal or deposit
      const amountStr = amountMatches[amountMatches.length - 2];
      const amount = parseFloat(amountStr.replace(/,/g, ""));

      // Third from last (if exists) might be the other amount
      const otherAmountStr = amountMatches.length >= 3 ? amountMatches[amountMatches.length - 3] : null;

      // Description is everything before the amounts
      const lastAmountIndex = rest.lastIndexOf(amountMatches[0]);
      const description = rest.substring(0, lastAmountIndex).trim();

      if (!description) continue;

      // Determine if it's credit or debit based on description keywords
      const isDeposit = description.match(/deposit|credit|salary|transfer in|upi cr/i);
      const isWithdrawal = description.match(/withdrawal|debit|payment|transfer out|upi dr/i);

      const type = isDeposit ? "credit" : "debit";

      transactions.push({
        date: parseDateString(dateStr).toISOString(),
        description,
        amount,
        type,
        balance,
        rawData: {
          dateStr,
          amountStr,
          balanceStr,
          otherAmountStr,
        },
      });
    }

    return {
      transactions,
      periodStart,
      periodEnd,
      accountNumber,
      openingBalance,
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

function parseDateString(dateStr: string): Date {
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[/-]/);
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
}

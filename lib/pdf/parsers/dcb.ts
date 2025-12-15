// @ts-nocheck
import { ParsedTransaction, ParsedStatementResult } from "@/lib/types";
import { extractTextFromPDF, cleanOCRText } from "../ocr";

/**
 * Parse DCB Bank (NiyoX) statement
 * DCB statements have an "ACCOUNT DETAILS" section with columns:
 * Date | Transaction Details | Withdrawals | Deposits | Balance
 */
export async function parseDCBStatement(
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
      /Statement Period[:\s]+(\d{2}-\w{3}-\d{4})\s+to\s+(\d{2}-\w{3}-\d{4})/i
    );

    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (periodMatch) {
      periodStart = parseDCBDate(periodMatch[1]);
      periodEnd = parseDCBDate(periodMatch[2]);
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

    // Find transaction section - "ACCOUNT DETAILS"
    const transactionSectionMatch = text.match(
      /ACCOUNT DETAILS([\s\S]*?)(?:ACCOUNT SUMMARY|Closing Balance|$)/i
    );

    if (!transactionSectionMatch) {
      errors.push("Could not find ACCOUNT DETAILS section");
      return { transactions, errors, openingBalance, closingBalance };
    }

    const transactionText = transactionSectionMatch[1];

    // Parse transaction lines
    // Format: DD-MMM-YYYY Description Withdrawal Deposit Balance
    const lines = transactionText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 15) continue;

      // Match date at start: DD-MMM-YYYY (e.g., 01-Nov-2024)
      const dateMatch = trimmed.match(/^(\d{2}-\w{3}-\d{4})\s+(.+)$/);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const rest = dateMatch[2];

      // Extract amounts (last 2-3 numbers)
      const amountMatches = rest.match(/([\d,]+\.\d{2})/g);
      if (!amountMatches || amountMatches.length < 1) continue;

      // Last number is balance
      const balanceStr = amountMatches[amountMatches.length - 1];
      const balance = parseFloat(balanceStr.replace(/,/g, ""));

      // Previous numbers are withdrawal/deposit
      let amount = 0;
      let type: "credit" | "debit" = "debit";

      if (amountMatches.length >= 2) {
        const secondLast = amountMatches[amountMatches.length - 2];
        amount = parseFloat(secondLast.replace(/,/g, ""));

        // Check if third from last exists (means both withdrawal and deposit columns have values)
        if (amountMatches.length >= 3) {
          // Need to determine which is which based on description
          const isDeposit = rest.match(/credit|deposit|upi cr|neft cr|transfer in/i);
          type = isDeposit ? "credit" : "debit";
        } else {
          // Only one amount, determine type from description
          const isDeposit = rest.match(/credit|deposit|upi cr|neft cr|transfer in/i);
          type = isDeposit ? "credit" : "debit";
        }
      }

      // Description is everything before the first amount
      const firstAmountIndex = rest.indexOf(amountMatches[0]);
      const description = rest.substring(0, firstAmountIndex).trim();

      if (!description) continue;

      transactions.push({
        date: parseDCBDate(dateStr).toISOString(),
        description,
        amount,
        type,
        balance,
        rawData: {
          dateStr,
          balanceStr,
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

function parseDCBDate(dateStr: string): Date {
  // Handle DD-MMM-YYYY format (e.g., 01-Nov-2024)
  const parts = dateStr.split("-");
  const day = parseInt(parts[0]);
  const monthStr = parts[1];
  const year = parseInt(parts[2]);

  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const month = months[monthStr];
  return new Date(year, month, day);
}

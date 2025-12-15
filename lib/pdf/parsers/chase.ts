import * as pdfParse from "pdf-parse";
import { ParsedTransaction, ParsedStatementResult } from "@/lib/types";

const PDFParser = (pdfParse as any).default || pdfParse;

/**
 * Parse Chase College Checking statement
 * Chase statements have a "TRANSACTION DETAIL" section with columns:
 * Date | Description | Amount | Balance
 */
export async function parseChaseStatement(
  buffer: Buffer
): Promise<ParsedStatementResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  try {
    // Extract text from PDF
    const data = await PDFParser(buffer);
    const text = data.text;

    // Find account number
    const accountMatch = text.match(/Account Number[:\s]+(\d+)/i);
    const accountNumber = accountMatch ? accountMatch[1] : undefined;

    // Find statement period
    const periodMatch = text.match(
      /Statement Period[:\s]+([A-Z][a-z]+\s+\d{1,2})\s*-\s*([A-Z][a-z]+\s+\d{1,2},\s*\d{4})/i
    );

    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (periodMatch) {
      const year = periodMatch[2].match(/\d{4}/)?.[0];
      const startStr = `${periodMatch[1]}, ${year}`;
      const endStr = periodMatch[2];

      periodStart = new Date(startStr);
      periodEnd = new Date(endStr);
    }

    // Find opening and closing balance
    const openingMatch = text.match(/Beginning Balance[:\s]+\$?([\d,]+\.\d{2})/i);
    const closingMatch = text.match(/Ending Balance[:\s]+\$?([\d,]+\.\d{2})/i);

    const openingBalance = openingMatch
      ? parseFloat(openingMatch[1].replace(/,/g, ""))
      : undefined;
    const closingBalance = closingMatch
      ? parseFloat(closingMatch[1].replace(/,/g, ""))
      : undefined;

    // Find transaction section
    const transactionSectionMatch = text.match(
      /TRANSACTION DETAIL([\s\S]*?)(?:TOTAL DEPOSITS|TOTAL WITHDRAWALS|Ending Balance|$)/i
    );

    if (!transactionSectionMatch) {
      errors.push("Could not find TRANSACTION DETAIL section");
      return { transactions, errors, openingBalance, closingBalance };
    }

    const transactionText = transactionSectionMatch[1];

    // Parse transaction lines
    // Format: MM/DD Description Amount Balance
    const lines = transactionText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 10) continue;

      // Match date at start of line: MM/DD
      const dateMatch = trimmed.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const rest = dateMatch[2];

      // Extract amount (last occurrence of number with optional -/$ prefix)
      const amountMatch = rest.match(/([-+]?\$?\s*[\d,]+\.\d{2})\s*([-+]?\$?\s*[\d,]+\.\d{2})?$/);
      if (!amountMatch) continue;

      const amountStr = amountMatch[1].replace(/[\$,\s]/g, "");
      const balanceStr = amountMatch[2]
        ? amountMatch[2].replace(/[\$,\s]/g, "")
        : undefined;

      const amount = parseFloat(amountStr);
      const balance = balanceStr ? parseFloat(balanceStr) : undefined;

      // Description is everything between date and amount
      const description = rest
        .substring(0, rest.lastIndexOf(amountMatch[0]))
        .trim();

      if (!description) continue;

      // Construct full date (use statement end year)
      const year = periodEnd?.getFullYear() || new Date().getFullYear();
      const [month, day] = dateStr.split("/").map((n) => parseInt(n));
      const fullDate = new Date(year, month - 1, day);

      transactions.push({
        date: fullDate.toISOString(),
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? "debit" : "credit",
        balance,
        rawData: {
          dateStr,
          amountStr,
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

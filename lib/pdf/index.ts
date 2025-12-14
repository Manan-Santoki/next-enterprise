import { ParsedStatementResult } from "@/lib/types";
import { parseChaseStatement } from "./parsers/chase";
import { parseHDFCStatement } from "./parsers/hdfc";
import { parseDCBStatement } from "./parsers/dcb";
import { parseZolveStatement } from "./parsers/zolve";

export type PDFParser = (buffer: Buffer) => Promise<ParsedStatementResult>;

// Registry of parsers by institution name
const parsers: Record<string, PDFParser> = {
  Chase: parseChaseStatement,
  "HDFC Bank": parseHDFCStatement,
  "DCB Bank": parseDCBStatement,
  Zolve: parseZolveStatement,
};

export async function parseStatement(
  buffer: Buffer,
  institutionName: string
): Promise<ParsedStatementResult> {
  const parser = parsers[institutionName];

  if (!parser) {
    return {
      transactions: [],
      errors: [`No parser available for institution: ${institutionName}`],
    };
  }

  return parser(buffer);
}

export function hasParser(institutionName: string): boolean {
  return institutionName in parsers;
}

export function getAvailableParsers(): string[] {
  return Object.keys(parsers);
}

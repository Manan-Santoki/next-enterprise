import { ParsedStatementResult } from "@/lib/types";
import { parseChaseStatement } from "./parsers/chase";

export type PDFParser = (buffer: Buffer) => Promise<ParsedStatementResult>;

// Registry of parsers by institution name
const parsers: Record<string, PDFParser> = {
  Chase: parseChaseStatement,
  // Will add more parsers: HDFC, DCB, Zolve
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

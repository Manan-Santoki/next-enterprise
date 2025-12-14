/**
 * Date utilities
 */

import { format, parse, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function parseDate(dateStr: string, formatStr: string): Date {
  return parse(dateStr, formatStr, new Date());
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getPreviousMonthRange(monthsAgo: number = 1): { start: Date; end: Date } {
  const targetMonth = subMonths(new Date(), monthsAgo);
  return getMonthRange(targetMonth);
}

export function formatMonthYear(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMMM yyyy");
}

export function isValidDate(date: unknown): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

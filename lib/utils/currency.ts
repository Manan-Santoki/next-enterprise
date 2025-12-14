/**
 * Currency utilities for formatting and conversion
 */

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  EUR: { symbol: "€", name: "Euro", locale: "en-EU" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  const currencyInfo = SUPPORTED_CURRENCIES[currency as SupportedCurrency] || SUPPORTED_CURRENCIES.USD;

  return new Intl.NumberFormat(currencyInfo.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numAmount);
}

export function getCurrencySymbol(currency: string): string {
  return SUPPORTED_CURRENCIES[currency as SupportedCurrency]?.symbol || currency;
}

export function parseCurrencyAmount(amount: string): number {
  // Remove currency symbols, commas, and whitespace
  const cleaned = amount.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

// @ts-nocheck
/**
 * Merchant database with common patterns and their category mappings
 */

export interface MerchantPattern {
  patterns: string[]; // Keywords or regex patterns
  categoryName: string;
  subcategoryName?: string;
  confidence: number; // 0-1
}

/**
 * Comprehensive merchant database
 * Organized by category for better maintenance
 */
export const merchantDatabase: MerchantPattern[] = [
  // Food & Dining
  { patterns: ["AMAZON MKTPL", "AMAZON.COM", "AMAZON PRIME"], categoryName: "Shopping", confidence: 0.9 },
  { patterns: ["UBER EATS", "UBEREATS", "DOORDASH", "GRUBHUB", "POSTMATES"], categoryName: "Food & Dining", subcategoryName: "Restaurants", confidence: 0.95 },
  { patterns: ["CHIPOTLE", "MCDONALDS", "SUBWAY", "STARBUCKS", "DUNKIN"], categoryName: "Food & Dining", subcategoryName: "Fast Food", confidence: 0.95 },
  { patterns: ["RESTAURANT", "CAFE", "BISTRO", "DINER", "PIZZ"], categoryName: "Food & Dining", subcategoryName: "Restaurants", confidence: 0.8 },
  { patterns: ["WHOLE FOODS", "TRADER JOE", "SAFEWAY", "WALMART", "TARGET", "COSTCO"], categoryName: "Food & Dining", subcategoryName: "Groceries", confidence: 0.9 },
  { patterns: ["GROCERY", "MARKET", "SUPERMARKET"], categoryName: "Food & Dining", subcategoryName: "Groceries", confidence: 0.8 },

  // Transportation
  { patterns: ["UBER", "LYFT", "RIDESHARE"], categoryName: "Transportation", subcategoryName: "Uber/Lyft", confidence: 0.95 },
  { patterns: ["SHELL", "CHEVRON", "EXXON", "BP ", "MOBIL", "ARCO"], categoryName: "Transportation", subcategoryName: "Gas", confidence: 0.9 },
  { patterns: ["PARKING", "PARK METER"], categoryName: "Transportation", subcategoryName: "Parking", confidence: 0.9 },
  { patterns: ["METRO", "BART", "MUNI", "TRANSIT"], categoryName: "Transportation", subcategoryName: "Public Transit", confidence: 0.85 },

  // Shopping
  { patterns: ["AMAZON", "AMZN"], categoryName: "Shopping", subcategoryName: "Electronics", confidence: 0.8 },
  { patterns: ["BEST BUY", "APPLE STORE", "MICRO CENTER"], categoryName: "Shopping", subcategoryName: "Electronics", confidence: 0.9 },
  { patterns: ["ZARA", "H&M", "GAP", "OLD NAVY", "NORDSTROM", "MACY"], categoryName: "Shopping", subcategoryName: "Clothing", confidence: 0.9 },
  { patterns: ["TARGET", "WALMART", "COSTCO"], categoryName: "Shopping", confidence: 0.85 },

  // Housing
  { patterns: ["RENT", "REDPOINT", "PROPERTY MANAGEMENT", "HOUSING"], categoryName: "Housing", subcategoryName: "Rent", confidence: 0.9 },
  { patterns: ["PG&E", "ELECTRIC", "UTILITY", "WATER BILL", "GAS BILL"], categoryName: "Housing", subcategoryName: "Utilities", confidence: 0.9 },
  { patterns: ["INTERNET", "COMCAST", "XFINITY", "AT&T", "VERIZON FIO"], categoryName: "Housing", subcategoryName: "Internet", confidence: 0.9 },

  // Healthcare
  { patterns: ["PHARMACY", "CVS", "WALGREENS", "RITE AID"], categoryName: "Healthcare", subcategoryName: "Pharmacy", confidence: 0.9 },
  { patterns: ["DOCTOR", "MEDICAL", "CLINIC", "HOSPITAL"], categoryName: "Healthcare", subcategoryName: "Doctor Visits", confidence: 0.85 },
  { patterns: ["DENTAL", "DENTIST"], categoryName: "Healthcare", subcategoryName: "Dental", confidence: 0.9 },

  // Entertainment
  { patterns: ["NETFLIX", "SPOTIFY", "HULU", "DISNEY+", "HBO"], categoryName: "Entertainment", subcategoryName: "Streaming Services", confidence: 0.95 },
  { patterns: ["MOVIE", "CINEMA", "AMC THEATR", "REGAL"], categoryName: "Entertainment", subcategoryName: "Movies", confidence: 0.9 },
  { patterns: ["STEAM", "PLAYSTATION", "XBOX", "NINTENDO"], categoryName: "Entertainment", subcategoryName: "Games", confidence: 0.9 },

  // Subscriptions
  { patterns: ["GITHUB", "ADOBE", "MICROSOFT 365", "GOOGLE ONE"], categoryName: "Subscriptions", subcategoryName: "Software", confidence: 0.95 },
  { patterns: ["GYM", "FITNESS", "PLANET FITNESS", "24 HOUR"], categoryName: "Subscriptions", subcategoryName: "Memberships", confidence: 0.9 },

  // Travel
  { patterns: ["AIRLINE", "UNITED AIR", "DELTA", "AMERICAN AIR", "SOUTHWEST"], categoryName: "Travel", subcategoryName: "Flights", confidence: 0.95 },
  { patterns: ["HOTEL", "MARRIOTT", "HILTON", "HYATT", "AIRBNB"], categoryName: "Travel", subcategoryName: "Hotels", confidence: 0.9 },

  // Fees
  { patterns: ["FEE", "CHARGE", "ATM WITHDRAW"], categoryName: "Fees & Charges", subcategoryName: "Bank Fees", confidence: 0.85 },
  { patterns: ["LATE FEE", "OVERDRAFT"], categoryName: "Fees & Charges", subcategoryName: "Late Fees", confidence: 0.95 },

  // Income
  { patterns: ["SALARY", "PAYROLL", "DIRECT DEP"], categoryName: "Income", subcategoryName: "Salary", confidence: 0.9 },
  { patterns: ["ZELLE", "VENMO", "PAYPAL"], categoryName: "Income", subcategoryName: "Family Support", confidence: 0.7 },
  { patterns: ["REFUND", "REIMBURSEMENT"], categoryName: "Income", subcategoryName: "Refunds", confidence: 0.85 },
  { patterns: ["INTEREST EARNED", "INTEREST PAID"], categoryName: "Income", subcategoryName: "Interest", confidence: 0.95 },

  // Indian specific patterns
  { patterns: ["SWIGGY", "ZOMATO", "DUNZO"], categoryName: "Food & Dining", subcategoryName: "Restaurants", confidence: 0.95 },
  { patterns: ["OLA", "OLA CABS", "RAPIDO"], categoryName: "Transportation", subcategoryName: "Uber/Lyft", confidence: 0.95 },
  { patterns: ["BIGBASKET", "GROFERS", "BLINKIT"], categoryName: "Food & Dining", subcategoryName: "Groceries", confidence: 0.9 },
  { patterns: ["RELIANCE DIGITAL", "CROMA"], categoryName: "Shopping", subcategoryName: "Electronics", confidence: 0.9 },
  { patterns: ["FLIPKART", "MYNTRA", "AJIO"], categoryName: "Shopping", confidence: 0.85 },
  { patterns: ["CANTEEN", "MESS"], categoryName: "Food & Dining", confidence: 0.8 },
];

/**
 * Normalize merchant name
 */
export function normalizeMerchant(description: string): string {
  let normalized = description.toUpperCase().trim();

  // Remove common prefixes
  normalized = normalized.replace(/^(POS|DEBIT|CREDIT|PURCHASE|PAYMENT)\s+/i, "");

  // Remove transaction IDs and numbers at the end
  normalized = normalized.replace(/\s+\d{4,}$/, "");

  // Remove dates
  normalized = normalized.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, "");

  // Extract merchant name (usually the first part before special chars)
  const parts = normalized.split(/[\*#\-]/);
  if (parts.length > 0) {
    normalized = parts[0].trim();
  }

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Find matching merchant pattern
 */
export function findMerchantMatch(
  description: string
): { categoryName: string; subcategoryName?: string; confidence: number; merchant: string } | null {
  const normalizedDesc = description.toUpperCase();
  const merchant = normalizeMerchant(description);

  let bestMatch: MerchantPattern | null = null;
  let bestConfidence = 0;

  for (const pattern of merchantDatabase) {
    for (const keyword of pattern.patterns) {
      if (normalizedDesc.includes(keyword.toUpperCase())) {
        if (pattern.confidence > bestConfidence) {
          bestMatch = pattern;
          bestConfidence = pattern.confidence;
        }
      }
    }
  }

  if (bestMatch) {
    return {
      categoryName: bestMatch.categoryName,
      subcategoryName: bestMatch.subcategoryName,
      confidence: bestConfidence,
      merchant,
    };
  }

  return null;
}

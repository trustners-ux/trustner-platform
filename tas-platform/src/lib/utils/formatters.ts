/**
 * Format number as Indian currency (INR)
 */
export function formatINR(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format number in Indian notation (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format percentage with + or - sign
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date in Indian format (DD MMM YYYY)
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format NAV value
 */
export function formatNAV(nav: number): string {
  return `₹${nav.toFixed(4)}`;
}

/**
 * Format number in Lakhs and Crores with INR symbol
 */
export function formatLakhsCrores(amount: number): string {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(crores >= 100 ? 0 : crores >= 10 ? 1 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs >= 100 ? 0 : lakhs >= 10 ? 1 : 2)} L`;
  }
  return formatINR(amount);
}

/**
 * Format percentage change with color hint
 */
export function formatPercentChange(value: number): {
  text: string;
  isPositive: boolean;
} {
  const sign = value >= 0 ? "+" : "";
  return {
    text: `${sign}${value.toFixed(1)}%`,
    isPositive: value >= 0,
  };
}

/**
 * Format months into years and months
 */
export function formatTenure(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} months`;
  if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${remainingMonths}m`;
}

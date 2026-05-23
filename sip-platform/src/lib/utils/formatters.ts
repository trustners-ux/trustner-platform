export function formatINR(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatINRFull(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatYears(years: number): string {
  if (years === 1) return '1 Year';
  return `${years} Years`;
}

// ─── Trustner Fund Selection Formatters ───

export function formatTER(ter: number): string {
  return `${(ter * 100).toFixed(2)}%`;
}

export function formatReturnPercent(val: number): string {
  const pct = val * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function formatStdDev(sd: number): string {
  return `${(sd * 100).toFixed(2)}%`;
}

export function formatSharpe(sr: number): string {
  return sr.toFixed(2);
}

export function formatAUMShort(aumCr: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(aumCr))} Cr`;
}

export function formatSkinPercent(val: number): string {
  return `${(val * 100).toFixed(4)}%`;
}

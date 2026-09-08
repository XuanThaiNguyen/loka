type CurrencyMetadata = {
  currency: string;
  divisor: number;
};

const currencyMetadata = new Map<string, CurrencyMetadata>();

function getCurrencyMetadata(currency: string): CurrencyMetadata {
  const normalized = currency.toUpperCase();
  const cached = currencyMetadata.get(normalized);
  if (cached) return cached;

  let resolvedCurrency = normalized;
  let fractionDigits = 2;
  try {
    const resolved = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
    }).resolvedOptions();
    resolvedCurrency = resolved.currency ?? normalized;
    fractionDigits = resolved.maximumFractionDigits ?? 2;
  } catch {
    resolvedCurrency = "USD";
  }

  const metadata = {
    currency: resolvedCurrency,
    divisor: 10 ** fractionDigits,
  };
  currencyMetadata.set(normalized, metadata);
  return metadata;
}

export function minorToMajor(amountMinor: number, currency: string): number {
  return amountMinor / getCurrencyMetadata(currency).divisor;
}

export function majorToMinor(amount: number, currency: string): number {
  return Math.round(amount * getCurrencyMetadata(currency).divisor);
}

export function formatMoneyMinor(amountMinor: number, currency: string): string {
  const metadata = getCurrencyMetadata(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: metadata.currency,
  }).format(amountMinor / metadata.divisor);
}

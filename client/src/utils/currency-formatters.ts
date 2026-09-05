export const formatCurrency = (
  value: number,
  currencyCode = "INR",
  locale = "en-IN"
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNumber = (value: number, locale = "en-IN") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value || 0
  );

export const compactCurrency = (
  value: number,
  currencyCode = "INR",
  locale = "en-IN"
) =>
  new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: currencyCode,
  }).format(value || 0);

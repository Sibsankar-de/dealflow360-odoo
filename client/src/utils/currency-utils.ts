export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string | null;
}

const ISO_CURRENCY_CODES = [
  "INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "BRL",
  "RUB", "ZAR", "MXN", "SGD", "HKD", "NZD", "SEK", "NOK", "KRW", "TRY",
  "AED", "SAR", "THB", "IDR", "MYR", "PHP", "VND", "EGP", "PLN", "DKK",
  "HUF", "CZK", "ILS", "CLP", "COP", "PEN", "PKR", "BDT", "NGN", "KES",
];

export const getCurrencySymbol = (currencyCode: string): string | null => {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
    }).formatToParts(0);
    const symbolPart = parts.find((p) => p.type === "currency");
    return symbolPart ? symbolPart.value : null;
  } catch {
    return null;
  }
};

export const getCurrencyName = (currencyCode: string): string => {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
    return displayNames.of(currencyCode) || currencyCode;
  } catch {
    return currencyCode;
  }
};

export const currencies: CurrencyInfo[] = ISO_CURRENCY_CODES.map((code) => ({
  code,
  name: getCurrencyName(code),
  symbol: getCurrencySymbol(code),
})).filter((c) => c.code && c.name);

export default currencies;

import React from "react";
import { Select, SelectProps } from "./Select";

export interface CurrencyItem {
  code: string;
  name: string;
  symbol?: string;
}

export const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
];

export interface CurrencySelectorProps extends Omit<SelectProps, "options"> {
  currencies?: CurrencyItem[];
  value?: string;
  defaultValue?: string;
}

export const CurrencySelector = React.forwardRef<
  HTMLSelectElement,
  CurrencySelectorProps
>(
  (
    {
      currencies = DEFAULT_CURRENCIES,
      value = "INR",
      placeholder = "Select currency",
      label = "Currency",
      id = "currency-selector",
      ...props
    },
    ref
  ) => {
    const selectOptions = currencies.map((c) => ({
      value: c.code,
      label: `${c.code}${c.symbol ? ` (${c.symbol})` : ""} - ${c.name}`,
    }));

    return (
      <Select
        ref={ref}
        id={id}
        label={label}
        value={value}
        options={selectOptions}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

CurrencySelector.displayName = "CurrencySelector";

export default CurrencySelector;

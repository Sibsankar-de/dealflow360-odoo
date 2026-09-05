import React from "react";
import { Select, SelectProps } from "./Select";
import currencies from "@/utils/currency-utils";

export interface CurrencySelectorProps extends Omit<SelectProps, "options"> {
  value?: string;
  dropdownClass?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  dropdownClass,
  id = "currency-selector",
  ...props
}) => {
  const options = currencies.map((e) => ({
    value: e.code,
    label: `${e.code}${e.symbol ? ` (${e.symbol})` : ""} - ${e.name}`,
  }));
  const selectedValue = value || "INR";

  return (
    <Select
      {...props}
      value={selectedValue}
      options={options}
      id={id}
      className={dropdownClass}
    />
  );
};

export default CurrencySelector;

"use client";

import React from "react";
import { Select } from "./Select";
import currencies from "@/utils/currency-utils";
import { SelectType } from "@/types/SelectType";

export const CurrencySelector: React.FC<SelectType> = ({
  value = "USD",
  placeholder = "Select currency",
  ...props
}) => {
  const options = currencies.map((c) => ({
    key: c.code,
    value: c.symbol && c.symbol !== c.code 
      ? `${c.code} (${c.symbol}) - ${c.name}` 
      : `${c.code} - ${c.name}`,
  }));

  return (
    <Select
      {...props}
      value={value}
      placeholder={placeholder}
      options={options}
      id="currency-selector"
      dropdownClass="max-h-60"
    />
  );
};

export default CurrencySelector;
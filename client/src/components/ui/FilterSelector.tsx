"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";

export interface FilterOption {
  key: string;
  value: string;
}

export interface FilterSelectorProps {
  id?: string;
  value?: string;
  options?: (FilterOption | string)[];
  onChange?: (val: string) => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  label?: string;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  value,
  options = [],
  onChange,
  disabled = false,
  tooltip = "Filter options",
  className,
  label,
}) => {
  const [open, setOpen] = useState(false);

  const normalizedOptions: FilterOption[] = options.map((opt) =>
    typeof opt === "string" ? { key: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.key === value);

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div className={clsx("relative inline-block", className)}>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        tooltip={tooltip}
        leftIcon={
          <svg
            className="w-4 h-4 text-brand-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        }
      >
        {label || selectedOption?.value || "Filter"}
      </Button>

      <Dropdown open={open} onClose={() => setOpen(false)} className="w-48 right-0 left-auto mt-2">
        <div className="py-1" role="listbox">
          {normalizedOptions.map((opt) => {
            const isSelected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.key)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between cursor-pointer",
                  isSelected
                    ? "bg-brand-50 font-semibold text-brand-600"
                    : "text-text-primary hover:bg-surface"
                )}
              >
                <span>{opt.value}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </Dropdown>
    </div>
  );
};

export default FilterSelector;

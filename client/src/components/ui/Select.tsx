import React, { useId } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      disabled,
      required,
      id,
      className,
      value,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const hasError = Boolean(error);
    const isPlaceholderSelected = placeholder && (value === "" || value === undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-primary flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-danger font-semibold">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            value={value}
            aria-invalid={hasError}
            aria-describedby={
              clsx(hasError && errorId, helperText && helperId) || undefined
            }
            className={clsx(
              "w-full appearance-none rounded-lg border bg-card px-3 py-2 pr-10 text-sm transition-colors duration-150 shadow-xs cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:opacity-75",
              isPlaceholderSelected
                ? "text-text-muted"
                : "text-text-primary",
              hasError
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-text-muted">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {hasError ? (
          <p id={errorId} className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;

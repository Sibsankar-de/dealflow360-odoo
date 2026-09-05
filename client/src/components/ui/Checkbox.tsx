import React, { useId, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      disabled,
      required,
      id,
      className,
      checked,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const innerRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={clsx(
            "inline-flex items-center gap-2 select-none text-sm text-text-primary",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          )}
        >
          <div className="relative flex items-center justify-center">
            <input
              ref={innerRef}
              id={checkboxId}
              type="checkbox"
              disabled={disabled}
              required={required}
              checked={checked}
              onChange={onChange}
              aria-invalid={hasError}
              className={clsx(
                "peer h-4 w-4 rounded border transition-colors duration-150 appearance-none bg-card cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed",
                hasError
                  ? "border-danger focus:ring-danger/20"
                  : "border-border hover:border-text-secondary checked:bg-brand-600 checked:border-brand-600 focus:ring-brand-600/20",
                className
              )}
              {...props}
            />
            <Check className="absolute h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
            {indeterminate && (
              <Minus className="absolute h-3 w-3 text-brand-600 pointer-events-none stroke-[3]" />
            )}
          </div>
          {label && (
            <span>
              {label}
              {required && <span className="text-danger font-semibold ml-0.5">*</span>}
            </span>
          )}
        </label>
        {error ? (
          <p className="text-xs font-medium text-danger ml-6">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-text-secondary ml-6">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;

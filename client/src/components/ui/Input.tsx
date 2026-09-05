import React, { useId } from "react";
import { clsx } from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      error,
      helperText,
      disabled,
      required,
      id,
      className,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-danger font-semibold">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              clsx(hasError && errorId, helperText && helperId) || undefined
            }
            className={clsx(
              "w-full rounded-lg border bg-card px-3 py-2 text-sm text-text-primary transition-colors duration-150 shadow-xs",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:opacity-75",
              hasError
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-text-muted">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";

export default Input;

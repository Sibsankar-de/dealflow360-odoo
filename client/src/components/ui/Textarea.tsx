import React, { useId } from "react";
import { clsx } from "clsx";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      disabled,
      required,
      id,
      className,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-primary flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-danger font-semibold">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            clsx(hasError && errorId, helperText && helperId) || undefined
          }
          className={clsx(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-text-primary transition-colors duration-150 shadow-xs resize-y",
            "placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:opacity-75",
            hasError
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
            className
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";

export default Textarea;

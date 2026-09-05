import React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500/40 border border-transparent shadow-xs",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-500/40 border border-transparent",
  outline:
    "bg-transparent border border-border text-text-primary hover:bg-surface active:bg-border focus-visible:ring-2 focus-visible:ring-brand-500/40",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface hover:text-text-primary active:bg-border focus-visible:ring-2 focus-visible:ring-brand-500/40 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-md gap-1.5 font-medium",
  md: "px-4 py-2 text-sm rounded-lg gap-2 font-medium",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2.5 font-semibold",
};

const tooltipPositionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loading = false,
      loadingText,
      tooltip,
      tooltipPosition = "top",
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isButtonLoading = isLoading || loading;
    const isButtonDisabled = disabled || isButtonLoading;

    const buttonElement = (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        title={tooltip}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 select-none focus:outline-none cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isButtonLoading ? (
          <>
            <Loader2 className="animate-spin -ml-0.5 h-4 w-4 text-current" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );

    if (tooltip) {
      return (
        <div className="group relative inline-flex">
          {buttonElement}
          <div
            role="tooltip"
            className={clsx(
              "absolute z-50 pointer-events-none hidden group-hover:flex group-focus-within:flex items-center justify-center",
              "px-2.5 py-1 text-xs font-normal text-white bg-navy-900 rounded-md shadow-md",
              "whitespace-nowrap transition-opacity duration-150 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              tooltipPositionClasses[tooltipPosition]
            )}
          >
            {tooltip}
          </div>
        </div>
      );
    }

    return buttonElement;
  }
);

Button.displayName = "Button";

export default Button;

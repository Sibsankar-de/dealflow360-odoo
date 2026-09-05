import React from "react";
import { clsx } from "clsx";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "info"
  | "purple";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-brand-50 text-brand-700 border-brand-100",
  secondary: "bg-surface text-text-primary border-border",
  success: "bg-emerald-50 text-success border-emerald-200",
  warning: "bg-amber-50 text-warning border-amber-200",
  danger: "bg-red-50 text-danger border-red-200",
  outline: "bg-transparent text-text-primary border-border",
  info: "bg-sky-50 text-info border-sky-200",
  purple: "bg-purple-50 text-purple border-purple/30",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "secondary",
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors select-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

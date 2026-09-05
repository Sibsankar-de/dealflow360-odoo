import React from "react";
import { clsx } from "clsx";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "outlined" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx(
      "flex flex-col space-y-1.5 p-6 border-b border-border",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx(
      "text-lg font-semibold leading-none tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("p-6 text-text-primary", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx(
      "flex items-center p-6 border-t border-border bg-surface/50 mt-auto",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const variantClasses = {
  default:
    "bg-card text-text-primary shadow-xs border border-border",
  outlined:
    "bg-transparent text-text-primary border border-border",
  flat: "bg-surface text-text-primary border border-border/50",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      description,
      header,
      footer,
      children,
      variant = "default",
      padding,
      className,
      ...props
    },
    ref
  ) => {
    const hasHeaderProp = Boolean(header || title || description);
    const contentPadding = padding
      ? paddingClasses[padding]
      : hasHeaderProp || footer
      ? ""
      : "p-6";

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-xl transition-all duration-150 overflow-hidden flex flex-col",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {header ? (
          header
        ) : title || description ? (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        ) : null}

        {children && (
          <div className={clsx(contentPadding || (hasHeaderProp ? "p-6" : "p-6"))}>
            {children}
          </div>
        )}

        {footer && (
          <div className="border-t border-border p-6 bg-surface/50 mt-auto">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;

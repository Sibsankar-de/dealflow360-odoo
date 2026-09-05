import React from "react";
import { Activity } from "lucide-react";
import { clsx } from "clsx";

export type AppLogoSize = "sm" | "md" | "lg" | number;
export type AppLogoTextColor = "white" | "black";

export interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  subtitle?: string;
  size?: AppLogoSize;
  textColor?: AppLogoTextColor;
  showText?: boolean;
  className?: string;
}

const PRESET_SIZE_STYLES: Record<
  "sm" | "md" | "lg",
  { dimension: number; iconSize: number; title: string; subtitle: string }
> = {
  sm: {
    dimension: 28,
    iconSize: 15,
    title: "text-sm",
    subtitle: "text-[10px]",
  },
  md: {
    dimension: 36,
    iconSize: 20,
    title: "text-base",
    subtitle: "text-xs",
  },
  lg: {
    dimension: 44,
    iconSize: 24,
    title: "text-lg",
    subtitle: "text-xs",
  },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  name = "DealFlow360",
  subtitle,
  size = "md",
  textColor = "black",
  showText = true,
  className,
  style,
  ...rest
}) => {
  const isNumeric = typeof size === "number";
  const preset = !isNumeric
    ? PRESET_SIZE_STYLES[size as "sm" | "md" | "lg"] || PRESET_SIZE_STYLES.md
    : null;

  const numericDimension = isNumeric ? (size as number) : preset?.dimension || 36;
  const iconSize = isNumeric
    ? Math.round((size as number) * 0.55)
    : preset?.iconSize || 20;

  const titleColorClass =
    textColor === "white" ? "text-white" : "text-text-primary";
  const subtitleColorClass =
    textColor === "white" ? "text-text-muted" : "text-text-secondary";

  return (
    <div
      className={clsx("inline-flex items-center gap-2.5 select-none", className)}
      style={style}
      {...rest}
    >
      <div
        className="bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0 rounded-xl"
        style={{ width: `${numericDimension}px`, height: `${numericDimension}px` }}
      >
        <Activity size={iconSize} strokeWidth={2.5} />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={clsx(
              "font-bold tracking-tight truncate",
              preset?.title || "text-base",
              titleColorClass
            )}
          >
            {name}
          </span>
          {subtitle && (
            <span
              className={clsx(
                "font-medium truncate mt-0.5",
                preset?.subtitle || "text-xs",
                subtitleColorClass
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const AppLogoFull: React.FC<AppLogoProps> = (props) => (
  <AppLogo {...props} showText={true} />
);

export const CompanyLogo = AppLogo;

export default AppLogo;

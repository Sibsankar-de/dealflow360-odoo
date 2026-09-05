import React from "react";
import { Activity } from "lucide-react";
import { clsx } from "clsx";

export interface AppLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 40,
  className,
  showText = true,
  subtitle = "Sales Operations Platform",
}) => {
  return (
    <div className={clsx("flex items-center gap-3 select-none", className)}>
      <div
        className="rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30 shrink-0 text-white"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <Activity size={Math.round(size * 0.6)} strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-white leading-tight">
            DealFlow360
          </span>
          {subtitle && (
            <span className="text-xs text-text-muted font-medium">
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

export default AppLogo;

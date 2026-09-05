import React from "react";
import { Layers } from "lucide-react";

export type CompanyLogoSize = "sm" | "md" | "lg";

export interface CompanyLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  size?: CompanyLogoSize;
  showText?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<
  CompanyLogoSize,
  { iconBox: string; icon: string; text: string }
> = {
  sm: {
    iconBox: "w-7 h-7 rounded-md",
    icon: "w-3.5 h-3.5",
    text: "text-sm",
  },
  md: {
    iconBox: "w-8 h-8 rounded-lg",
    icon: "w-4 h-4",
    text: "text-base",
  },
  lg: {
    iconBox: "w-10 h-10 rounded-xl",
    icon: "w-5 h-5",
    text: "text-lg",
  },
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name = "DealFlow360",
  size = "md",
  showText = true,
  className = "",
  ...rest
}) => {
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={`inline-flex items-center gap-2.5 font-bold text-text-primary tracking-tight select-none ${className}`}
      {...rest}
    >
      <div
        className={`flex items-center justify-center bg-brand-600 text-white shadow-xs shrink-0 ${sizeStyle.iconBox}`}
      >
        <Layers className={sizeStyle.icon} />
      </div>
      {showText && <span className={sizeStyle.text}>{name}</span>}
    </div>
  );
};

export default CompanyLogo;

import React from "react";
import { getInitials, getAvatarColor } from "@/utils/avatar";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_STYLES: Record<AvatarSize, { container: string; text: string }> = {
  xs: {
    container: "w-6 h-6 text-xs",
    text: "text-[10px] font-medium leading-none",
  },
  sm: {
    container: "w-8 h-8 text-xs",
    text: "text-xs font-medium leading-none",
  },
  md: {
    container: "w-10 h-10 text-sm",
    text: "text-sm font-semibold leading-none",
  },
  lg: {
    container: "w-12 h-12 text-base",
    text: "text-base font-semibold leading-none",
  },
  xl: {
    container: "w-16 h-16 text-xl",
    text: "text-xl font-bold leading-none",
  },
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = "md",
  className = "",
  style,
  ...rest
}) => {
  const initials = getInitials(name);
  const { bg, text } = getAvatarColor(name);
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      role="img"
      aria-label={name}
      className={`inline-flex items-center justify-center rounded-full select-none flex-shrink-0 ${sizeStyle.container} ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        ...style,
      }}
      {...rest}
    >
      <span className={sizeStyle.text}>{initials}</span>
    </div>
  );
};

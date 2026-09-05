"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { Button, ButtonProps } from "./Button";
import { Dropdown } from "./Dropdown";

export interface DropdownMenuItem {
  key?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
}

export interface DropdownButtonProps extends ButtonProps {
  items: DropdownMenuItem[];
  secondaryVariant?: ButtonProps["variant"];
  dropdownClassName?: string;
  placement?: "top" | "bottom";
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  children,
  onClick,
  items,
  variant = "primary",
  secondaryVariant,
  disabled = false,
  isLoading = false,
  loading = false,
  loadingText,
  className,
  dropdownClassName,
  placement = "bottom",
  tooltip,
  ...props
}) => {
  const [open, setOpen] = useState(false);

  const resolvedSecondaryVariant = secondaryVariant || variant;
  const isButtonDisabled = disabled || isLoading || loading;

  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else {
      setOpen((prev) => !prev);
    }
  };

  const handleItemClick = (e: React.MouseEvent, item: DropdownMenuItem) => {
    if (item.disabled) return;
    setOpen(false);
    item.onClick?.(e);
  };

  const dividerClass =
    resolvedSecondaryVariant === "primary"
      ? "border-l border-white/20"
      : "border-l border-border";

  return (
    <div className={clsx("relative inline-flex items-stretch", className)}>
      <Button
        variant={variant}
        disabled={isButtonDisabled}
        isLoading={isLoading}
        loading={loading}
        loadingText={loadingText}
        onClick={handleMainClick}
        tooltip={tooltip}
        className="rounded-r-none border-r-0 self-stretch flex-1 justify-center"
        {...props}
      >
        {children}
      </Button>

      <Button
        variant={resolvedSecondaryVariant}
        disabled={isButtonDisabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={clsx(
          "px-2 rounded-l-none self-stretch flex items-center justify-center",
          dividerClass
        )}
        aria-label="More options"
      >
        <ChevronDown
          className={clsx(
            "w-4 h-4 transition-transform duration-200 shrink-0",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </Button>

      <Dropdown
        open={open}
        onClose={() => setOpen(false)}
        placement={placement}
        className={clsx("right-0 left-auto w-52 p-1", dropdownClassName)}
      >
        <div className="flex flex-col gap-0.5">
          {items.map((item, idx) => (
            <button
              key={item.key || idx}
              type="button"
              disabled={item.disabled}
              onClick={(e) => handleItemClick(e, item)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left cursor-pointer",
                "hover:bg-surface text-text-primary",
                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {item.icon && (
                <span className="w-4 h-4 flex items-center justify-center shrink-0 text-text-muted">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </Dropdown>
    </div>
  );
};

export default DropdownButton;

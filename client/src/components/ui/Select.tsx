"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { clsx } from "clsx";
import { ChevronDown, Check } from "lucide-react";
import { SelectType, SelectOptionType } from "@/types/SelectType";

export type { SelectOptionType, SelectType };

export const Select: React.FC<SelectType> = ({
  id,
  name,
  placeholder = "Select an option",
  value,
  options = [],
  onChange,
  required = false,
  disabled = false,
  placeholderClass,
  className,
  dropdownClass,
  errorMessage,
  icon,
  label,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const hasError = Boolean(errorMessage);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.key === value);
  }, [options, value]);

  const selectedDisplay = selectedOption ? selectedOption.value : "";
  const isPlaceholder = !selectedOption;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.children;
      if (children[focusedIndex]) {
        (children[focusedIndex] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = (key: string) => {
    if (disabled) return;
    onChange?.(key);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.key === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      } else {
        setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.key === value);
        setFocusedIndex(idx >= 0 ? idx : options.length - 1);
      } else {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && options[focusedIndex]) {
        handleSelect(options[focusedIndex].key);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx("flex flex-col gap-1.5 w-full relative", className)}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-primary flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-danger font-semibold">*</span>}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          required={required}
        />
      )}

      <div className="relative w-full">
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              if (!isOpen) {
                const idx = options.findIndex((opt) => opt.key === value);
                setFocusedIndex(idx >= 0 ? idx : 0);
              }
            }
          }}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm transition-colors duration-150 shadow-xs cursor-pointer select-none text-left",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:opacity-75",
            hasError
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
            isOpen && !hasError && "border-brand-600 ring-2 ring-brand-600/20"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {icon && (
              <span className="shrink-0 text-text-muted flex items-center justify-center">
                {icon}
              </span>
            )}
            <span
              className={clsx(
                "truncate",
                isPlaceholder
                  ? clsx("text-text-muted", placeholderClass)
                  : "text-text-primary"
              )}
            >
              {isPlaceholder ? placeholder : selectedDisplay}
            </span>
          </div>

          <ChevronDown
            className={clsx(
              "h-4 w-4 shrink-0 text-text-muted transition-transform duration-150 ml-2",
              isOpen && "rotate-180 text-brand-600"
            )}
          />
        </button>

        {isOpen && !disabled && (
          <div
            className={clsx(
              "absolute z-50 left-0 right-0 top-full mt-1.5 rounded-lg bg-card p-1 text-sm shadow-xl border border-border text-text-primary overflow-y-auto",
              dropdownClass || "max-h-60"
            )}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted text-center">
                No options available
              </div>
            ) : (
              <ul
                ref={listRef}
                role="listbox"
                className="flex flex-col gap-0.5 m-0 p-0 list-none"
              >
                {options.map((opt, idx) => {
                  const isSelected = opt.key === value;
                  const isFocused = idx === focusedIndex;

                  return (
                    <li
                      key={opt.key}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.key)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "bg-brand-50 font-semibold text-brand-600"
                          : isFocused
                          ? "bg-surface text-text-primary"
                          : "text-text-primary hover:bg-surface"
                      )}
                    >
                      <span className="truncate">{opt.value}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-brand-600 ml-2" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {hasError && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Select;

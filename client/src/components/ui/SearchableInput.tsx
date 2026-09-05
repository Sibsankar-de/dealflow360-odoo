"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { clsx } from "clsx";
import { Search, Loader2 } from "lucide-react";
import { Input, InputProps } from "./Input";
import { Dropdown } from "./Dropdown";

export interface SearchableItem {
  id?: string | number;
  label: string;
  value: string | number;
  description?: string;
}

export interface SearchableInputProps<T extends SearchableItem = SearchableItem>
  extends Omit<InputProps, "onChange" | "onSelect"> {
  items: T[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  getLabel?: (item: T) => string;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
}

export function SearchableInput<T extends SearchableItem = SearchableItem>({
  items,
  value = "",
  placeholder = "Type to search...",
  onChange,
  onSelect,
  isLoading = false,
  emptyMessage = "No results found",
  getLabel = (item) => item.label,
  renderItem,
  label,
  error,
  helperText,
  disabled,
  required,
  leftIcon,
  className,
  ...props
}: SearchableInputProps<T>) {
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.children;
      if (children[focusedIndex]) {
        (children[focusedIndex] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);
    setOpen(true);
    setFocusedIndex(0);
  };

  const handleSelectItem = (item: T) => {
    const itemLabel = getLabel(item);
    setInputValue(itemLabel);
    onSelect?.(item);
    setOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setFocusedIndex(0);
      } else {
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setFocusedIndex(items.length - 1);
      } else {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === "Enter") {
      if (open && focusedIndex >= 0 && items[focusedIndex]) {
        e.preventDefault();
        handleSelectItem(items[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        label={label}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.trim().length > 0 || items.length > 0) {
            setOpen(true);
          }
        }}
        leftIcon={
          leftIcon || <Search className="w-4 h-4 text-text-muted" />
        }
        className={className}
        {...props}
      />

      <Dropdown
        open={open && !disabled}
        onClose={() => setOpen(false)}
        className="w-full mt-1 max-h-60 overflow-y-auto p-1"
      >
        {isLoading ? (
          <div className="p-4 text-center text-sm text-text-secondary flex items-center justify-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-brand-600" />
            Loading suggestions...
          </div>
        ) : items.length === 0 ? (
          <div className="p-3 text-center text-xs text-text-muted">
            {emptyMessage}
          </div>
        ) : (
          <ul ref={listRef} className="flex flex-col gap-0.5" role="listbox">
            {items.map((item, idx) => {
              const isFocused = idx === focusedIndex;
              return (
                <li
                  key={item.id || item.value || idx}
                  role="option"
                  aria-selected={isFocused}
                  onClick={() => handleSelectItem(item)}
                  className={clsx(
                    "px-3 py-2 text-sm rounded-md cursor-pointer transition-colors flex flex-col",
                    isFocused
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-text-primary hover:bg-surface"
                  )}
                >
                  {renderItem ? (
                    renderItem(item, isFocused)
                  ) : (
                    <>
                      <span>{getLabel(item)}</span>
                      {item.description && (
                        <span className="text-xs text-text-secondary font-normal">
                          {item.description}
                        </span>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Dropdown>
    </div>
  );
}

export default SearchableInput;

"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export interface DropdownProps {
  children?: React.ReactNode;
  openState?: boolean;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  placement?: "top" | "bottom" | "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  openState,
  open,
  onClose,
  className,
  style,
  placement = "bottom",
}) => {
  const isVisible = open ?? openState ?? false;
  const [mounted, setMounted] = useState(isVisible);
  const [isClosing, setIsClosing] = useState(false);
  const [prevIsVisible, setPrevIsVisible] = useState(isVisible);
  const boxRef = useRef<HTMLDivElement>(null);

  if (isVisible !== prevIsVisible) {
    setPrevIsVisible(isVisible);
    if (isVisible) {
      setMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
    }
  }

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mounted &&
        !isClosing &&
        boxRef.current &&
        document.body.contains(target) &&
        !boxRef.current.contains(target) &&
        onClose
      ) {
        onClose();
      }
    };

    if (mounted && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mounted, isClosing, onClose]);

  if (!mounted) return null;

  const placementClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2 top-0",
    right: "left-full ml-2 top-0",
  };

  return (
    <div
      ref={boxRef}
      className={clsx(
        "absolute z-50 min-w-48 rounded-lg bg-card p-1 text-sm shadow-xl border border-border text-text-primary transition-all duration-150",
        isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100",
        placementClasses[placement],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default Dropdown;

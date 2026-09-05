"use client";

import React, { useEffect, useCallback, useId } from "react";
import { clsx } from "clsx";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  size?: ModalSize;
  className?: string;
  overlayClassName?: string;
}

export const ModalHeader: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  titleId?: string;
  descriptionId?: string;
}> = ({
  title,
  description,
  onClose,
  showCloseButton = true,
  className,
  titleId,
  descriptionId,
}) => {
  if (!title && !description && !showCloseButton) return null;

  return (
    <div
      className={clsx(
        "flex items-start justify-between p-6 border-b border-border",
        className
      )}
    >
      <div className="space-y-1 pr-4">
        {title && (
          <h2
            id={titleId}
            className="text-lg font-semibold text-text-primary leading-6"
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-text-secondary"
          >
            {description}
          </p>
        )}
      </div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-border cursor-pointer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const ModalBody: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={clsx("p-6 text-text-primary", className)}>
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-end gap-3 p-4 px-6 border-t border-border bg-surface/50 rounded-b-xl",
        className
      )}
    >
      {children}
    </div>
  );
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] min-h-[90vh]",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = "md",
  className,
  overlayClassName,
}) => {
  const isVisible = open ?? isOpen ?? false;
  const titleId = useId();
  const descriptionId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isVisible, handleKeyDown]);

  if (!isVisible) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs overflow-y-auto",
        overlayClassName
      )}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div
        className={clsx(
          "relative w-full rounded-xl bg-card shadow-2xl transition-all border border-border my-8 overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        {(title || description || showCloseButton) && (
          <ModalHeader
            title={title}
            description={description}
            onClose={onClose}
            showCloseButton={showCloseButton}
            titleId={titleId}
            descriptionId={descriptionId}
          />
        )}

        {children && <ModalBody>{children}</ModalBody>}

        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>
  );
};

export default Modal;

"use client";

import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  totalPage: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const SHOW_LIMIT = 4;

export const Pagination: React.FC<PaginationProps> = ({
  totalPage,
  currentPage,
  onPageChange,
  className = "",
}) => {
  if (totalPage <= 1) return null;

  const clamp = (page: number) => Math.min(Math.max(page, 1), totalPage);

  const goTo = (page: number) => {
    onPageChange?.(clamp(page));
  };

  const pages: number[] = [];

  const half = Math.floor(SHOW_LIMIT / 2);
  let start = Math.max(2, currentPage - half);
  let end = Math.min(totalPage - 1, currentPage + half);

  if (currentPage <= half) {
    end = Math.min(totalPage - 1, SHOW_LIMIT);
  }

  if (currentPage > totalPage - half) {
    start = Math.max(2, totalPage - SHOW_LIMIT + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        className="px-2 py-1.5 h-8 w-8 p-0 flex items-center justify-center"
        disabled={currentPage === 1}
        onClick={() => goTo(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* First page */}
      <Button
        variant={currentPage === 1 ? "primary" : "outline"}
        size="sm"
        onClick={() => goTo(1)}
        aria-current={currentPage === 1 ? "page" : undefined}
        className="h-8 min-w-8 px-2.5 text-xs font-semibold"
      >
        1
      </Button>

      {/* Left ellipsis */}
      {start > 2 && <span className="text-text-muted px-1">...</span>}

      {/* Middle pages */}
      {pages.map((p) => (
        <Button
          key={p}
          variant={currentPage === p ? "primary" : "outline"}
          size="sm"
          onClick={() => goTo(p)}
          aria-current={currentPage === p ? "page" : undefined}
          className="h-8 min-w-8 px-2.5 text-xs font-semibold"
        >
          {p}
        </Button>
      ))}

      {/* Right ellipsis */}
      {end < totalPage - 1 && <span className="text-text-muted px-1">...</span>}

      {/* Last page */}
      {totalPage > 1 && (
        <Button
          variant={currentPage === totalPage ? "primary" : "outline"}
          size="sm"
          onClick={() => goTo(totalPage)}
          aria-current={currentPage === totalPage ? "page" : undefined}
          className="h-8 min-w-8 px-2.5 text-xs font-semibold"
        >
          {totalPage}
        </Button>
      )}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        className="px-2 py-1.5 h-8 w-8 p-0 flex items-center justify-center"
        disabled={currentPage === totalPage}
        onClick={() => goTo(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Pagination;

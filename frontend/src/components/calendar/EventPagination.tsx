import React from 'react';
import { Button } from '@/components/ui/button';
// Simple select implementation
const SimpleSelect = ({ value, onValueChange, disabled, children, className }: any) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    disabled={disabled}
    className={`flex h-8 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm ${className}`}
  >
    {children}
  </select>
);
const SimpleSelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import type { PaginationState } from '@/hooks/useEventPagination';

interface EventPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export const EventPagination: React.FC<EventPaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}) => {
  const { page, pageSize, totalItems, totalPages, hasNext, hasPrev } = pagination;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > delta + 2) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - delta);
      const end = Math.min(totalPages - 1, page + delta);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - delta - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  if (totalItems === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        No events found
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div>
          Showing {startItem}-{endItem} of {totalItems} events
        </div>

        <div className="flex items-center gap-2">
          <span>Show:</span>
          <SimpleSelect
            value={pageSize.toString()}
            onValueChange={(value: string) => onPageSizeChange(parseInt(value))}
            disabled={isLoading}
            className="w-20 h-8"
          >
            <SimpleSelectItem value="10">10</SimpleSelectItem>
            <SimpleSelectItem value="20">20</SimpleSelectItem>
            <SimpleSelectItem value="50">50</SimpleSelectItem>
            <SimpleSelectItem value="100">100</SimpleSelectItem>
          </SimpleSelect>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrev || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {pageNumbers.map((pageNum, index) =>
            pageNum === 'ellipsis' ? (
              <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            )
          )}

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

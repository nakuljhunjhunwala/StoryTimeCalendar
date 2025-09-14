import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Note: Using simple select for now, can replace with proper select component later
const SimpleSelect = ({ value, onValueChange, children, disabled }: any) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    disabled={disabled}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
  >
    {children}
  </select>
);
const SimpleSelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Clock, SortAsc, SortDesc, Calendar as CalendarIcon } from 'lucide-react';
import type { EventFilters } from '@/hooks/useEventPagination';

interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: Partial<EventFilters>) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const EventFiltersComponent: React.FC<EventFiltersProps> = ({
  filters,
  onFiltersChange,
  isLoading = false,
  onRefresh,
}) => {
  const handleDateRangeChange = (value: string) => {
    onFiltersChange({
      dateRange: value as EventFilters['dateRange'],
      // Reset custom dates when switching away from custom
      ...(value !== 'custom' && { customFrom: undefined, customTo: undefined }),
    });
  };

  const handleCustomDateChange = (field: 'customFrom' | 'customTo', value: string) => {
    onFiltersChange({
      dateRange: 'custom',
      [field]: value || undefined,
    });
  };

  const handleSortChange = (field: 'sortBy' | 'sortOrder', value: string) => {
    onFiltersChange({ [field]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: 'week',
      status: 'all',
      search: '',
      customFrom: undefined,
      customTo: undefined,
      sortBy: 'startTime',
      sortOrder: 'asc',
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Event Filters
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters} disabled={isLoading}>
              Clear Filters
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search Events
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by title, description..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Date Range
            </Label>
            <SimpleSelect value={filters.dateRange} onValueChange={handleDateRangeChange}>
              <SimpleSelectItem value="all">All Time</SimpleSelectItem>
              <SimpleSelectItem value="today">Today</SimpleSelectItem>
              <SimpleSelectItem value="week">This Week</SimpleSelectItem>
              <SimpleSelectItem value="month">This Month</SimpleSelectItem>
              <SimpleSelectItem value="custom">Custom Range</SimpleSelectItem>
            </SimpleSelect>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Event Status
            </Label>
            <SimpleSelect
              value={filters.status}
              onValueChange={(value: string) =>
                onFiltersChange({ status: value as EventFilters['status'] })
              }
            >
              <SimpleSelectItem value="all">All Events</SimpleSelectItem>
              <SimpleSelectItem value="upcoming">Upcoming</SimpleSelectItem>
              <SimpleSelectItem value="live">Live Now</SimpleSelectItem>
              <SimpleSelectItem value="past">Past Events</SimpleSelectItem>
            </SimpleSelect>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {filters.sortOrder === 'asc' ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              )}
              Sort By
            </Label>
            <div className="flex gap-1">
              <SimpleSelect
                value={filters.sortBy}
                onValueChange={(value: string) => handleSortChange('sortBy', value)}
              >
                <SimpleSelectItem value="startTime">Date</SimpleSelectItem>
                <SimpleSelectItem value="title">Title</SimpleSelectItem>
              </SimpleSelect>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSortChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="px-2"
              >
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={filters.customFrom ? filters.customFrom.split('T')[0] : ''}
                onChange={(e) =>
                  handleCustomDateChange(
                    'customFrom',
                    e.target.value ? `${e.target.value}T00:00:00.000Z` : ''
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={filters.customTo ? filters.customTo.split('T')[0] : ''}
                onChange={(e) =>
                  handleCustomDateChange(
                    'customTo',
                    e.target.value ? `${e.target.value}T23:59:59.999Z` : ''
                  )
                }
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Search: "{filters.search}"
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Status: {filters.status}
            </span>
          )}
          {filters.dateRange !== 'all' && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Range: {filters.dateRange}
            </span>
          )}
          {filters.sortBy !== 'startTime' && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Sort: {filters.sortBy} ({filters.sortOrder})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { useState, useCallback, useEffect } from 'react';
import { calendarService } from '@/services';
import type { CalendarEvent } from '@/types';
import { getErrorMessage } from '@/lib/error-utils';

export interface EventFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customFrom?: string;
  customTo?: string;
  status: 'all' | 'past' | 'upcoming' | 'live';
  search?: string;
  calendarIds?: string[];
  sortBy: 'startTime' | 'title' | 'created';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseEventPaginationReturn {
  events: CalendarEvent[];
  pagination: PaginationState;
  filters: EventFilters;
  isLoading: boolean;
  error: string;
  setFilters: (filters: Partial<EventFilters>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  loadMore: () => void;
}

const DEFAULT_FILTERS: EventFilters = {
  dateRange: 'week',
  status: 'all',
  search: '',
  sortBy: 'startTime',
  sortOrder: 'asc',
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export function useEventPagination(): UseEventPaginationReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [filters, setFiltersState] = useState<EventFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate date range based on filter
  const getDateRange = useCallback((filters: EventFilters): { from?: string; to?: string } => {
    const now = new Date();

    switch (filters.dateRange) {
      case 'today': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          from: today.toISOString(),
          to: tomorrow.toISOString(),
        };
      }
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        return {
          from: weekStart.toISOString(),
          to: weekEnd.toISOString(),
        };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        return {
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
        };
      }
      case 'custom': {
        return {
          from: filters.customFrom,
          to: filters.customTo,
        };
      }
      default:
        return {}; // 'all' - no date filtering
    }
  }, []);

  // Filter events by status (client-side for better UX)
  const filterEventsByStatus = useCallback(
    (events: CalendarEvent[], status: string): CalendarEvent[] => {
      if (status === 'all') return events;

      const now = new Date();

      return events.filter((event) => {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        switch (status) {
          case 'past':
            return endTime < now;
          case 'upcoming':
            return startTime > now;
          case 'live':
            return startTime <= now && endTime >= now;
          default:
            return true;
        }
      });
    },
    []
  );

  // Search events (client-side)
  const searchEvents = useCallback(
    (events: CalendarEvent[], searchTerm: string): CalendarEvent[] => {
      if (!searchTerm.trim()) return events;

      const term = searchTerm.toLowerCase();
      return events.filter(
        (event) =>
          event.title.toLowerCase().includes(term) ||
          (event.description && event.description.toLowerCase().includes(term)) ||
          (event.location && event.location.toLowerCase().includes(term))
      );
    },
    []
  );

  // Sort events
  const sortEvents = useCallback(
    (events: CalendarEvent[], sortBy: string, sortOrder: string): CalendarEvent[] => {
      const sorted = [...events].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'startTime':
          default:
            aValue = new Date(a.startTime).getTime();
            bValue = new Date(b.startTime).getTime();
            break;
        }

        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      return sorted;
    },
    []
  );

  // Apply pagination
  const paginateEvents = useCallback((events: CalendarEvent[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEvents = events.slice(startIndex, endIndex);

    const totalPages = Math.ceil(events.length / pageSize);

    return {
      events: paginatedEvents,
      pagination: {
        page,
        pageSize,
        totalItems: events.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, []);

  // Load events from API
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const dateRange = getDateRange(filters);

      // Fetch with generous limit to handle client-side filtering
      const response = await calendarService.getEvents({
        limit: 1000, // High limit to get comprehensive data
        from: dateRange.from,
        to: dateRange.to,
      });

      let allEvents = Array.isArray(response.data)
        ? response.data
        : (response.data as { events?: CalendarEvent[] })?.events || [];

      // Apply client-side filters
      allEvents = filterEventsByStatus(allEvents, filters.status);
      allEvents = searchEvents(allEvents, filters.search || '');
      allEvents = sortEvents(allEvents, filters.sortBy, filters.sortOrder);

      // Apply pagination
      const result = paginateEvents(allEvents, pagination.page, pagination.pageSize);

      setEvents(result.events);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load events'));
    } finally {
      setIsLoading(false);
    }
  }, [
    filters,
    pagination.page,
    pagination.pageSize,
    getDateRange,
    filterEventsByStatus,
    searchEvents,
    sortEvents,
    paginateEvents,
  ]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<EventFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  // Update page
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // Update page size
  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 })); // Reset to first page on page size change
  }, []);

  // Load more (for infinite scroll)
  const loadMore = useCallback(() => {
    if (pagination.hasNext) {
      setPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, setPage]);

  // Refresh
  const refresh = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  // Load events when dependencies change
  useEffect(() => {
    loadEvents();
  }, [filters, pagination.page, pagination.pageSize]);

  return {
    events,
    pagination,
    filters,
    isLoading,
    error,
    setFilters,
    setPage,
    setPageSize,
    refresh,
    loadMore,
  };
}

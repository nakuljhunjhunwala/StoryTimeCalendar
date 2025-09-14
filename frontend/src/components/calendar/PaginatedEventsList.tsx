import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEventPagination } from '@/hooks/useEventPagination';
import { EventFiltersComponent } from './EventFilters';
import { EventPagination } from './EventPagination';
// import { GroupedEvents } from './GroupedEvents'; // Not used in this component
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';

interface PaginatedEventsListProps {
  title?: string;
  description?: string;
  showFilters?: boolean;
  defaultPageSize?: number;
}

export const PaginatedEventsList: React.FC<PaginatedEventsListProps> = ({
  title = 'Calendar Events',
  description = 'Browse and manage your calendar events',
  showFilters = true,
  defaultPageSize = 20,
}) => {
  const {
    events,
    pagination,
    filters,
    isLoading,
    error,
    setFilters,
    setPage,
    setPageSize,
    refresh,
  } = useEventPagination();

  // Set default page size on mount
  React.useEffect(() => {
    if (pagination.pageSize !== defaultPageSize) {
      setPageSize(defaultPageSize);
    }
  }, [defaultPageSize, pagination.pageSize, setPageSize]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={AlertCircle}
            title="Failed to load events"
            description={error}
            action={{
              label: 'Try Again',
              onClick: refresh,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <EventFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={isLoading}
          onRefresh={refresh}
        />
      )}

      {/* Loading state */}
      {isLoading && events.length === 0 && <PageLoader text="Loading events..." />}

      {/* Events list */}
      {!isLoading && events.length === 0 && !error ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Calendar}
              title="No events found"
              description="Try adjusting your filters or check back later for new events."
              action={{
                label: 'Clear Filters',
                onClick: () =>
                  setFilters({
                    dateRange: 'week',
                    status: 'all',
                    search: '',
                    customFrom: undefined,
                    customTo: undefined,
                  }),
              }}
            />
          </CardContent>
        </Card>
      ) : events.length > 0 ? (
        <>
          {/* Events Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Events ({pagination.totalItems})
                  </CardTitle>
                  <CardDescription>
                    Page {pagination.page} of {pagination.totalPages}
                    {filters.search && ` • Filtered by "${filters.search}"`}
                    {filters.status !== 'all' && ` • ${filters.status} events`}
                    {filters.dateRange !== 'all' && ` • ${filters.dateRange}`}
                  </CardDescription>
                </div>
                {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
              </div>
            </CardHeader>
            <CardContent>
              {/* Use the existing GroupedEvents component but without its own grouping */}
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{event.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(event.startTime).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span>
                              {event.isAllDay
                                ? 'All day'
                                : `${new Date(event.startTime).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })} - ${new Date(event.endTime).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1">
                              📍 <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {event.attendeeCount && event.attendeeCount > 0 && (
                            <div className="flex items-center gap-1">
                              👥{' '}
                              <span>
                                {event.attendeeCount} attendee{event.attendeeCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {event.description.replace(/<[^>]*>/g, '').substring(0, 150)}
                            {event.description.length > 150 ? '...' : ''}
                          </p>
                        )}

                        {event.meetingLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(event.meetingLink || '', '_blank')}
                            className="mt-2"
                          >
                            Join Meeting
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <EventPagination
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </>
      ) : null}
    </div>
  );
};

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { EventCard } from './EventCard';
import { groupEventsByDate } from '@/utils/event-utils';
import type { CalendarEvent } from '@/types';

interface GroupedEventsProps {
  events: CalendarEvent[];
  title?: string;
  description?: string;
  maxEventsPerGroup?: number;
}

export const GroupedEvents: React.FC<GroupedEventsProps> = ({
  events,
  title = 'Recent Events',
  description = 'Latest synchronized events from your calendars',
  maxEventsPerGroup = 5,
}) => {
  const groupedEvents = groupEventsByDate(events);

  // Smart sorting: Today first, then future events, then past events (recent first)
  const dateKeys = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isAToday = dateA.toDateString() === today.toDateString();
    const isBToday = dateB.toDateString() === today.toDateString();

    // Today always comes first
    if (isAToday && !isBToday) return -1;
    if (!isAToday && isBToday) return 1;
    if (isAToday && isBToday) return 0;

    const aIsFuture = dateA > today;
    const bIsFuture = dateB > today;

    // Future events: chronological order (soonest first)
    if (aIsFuture && bIsFuture) {
      return dateA.getTime() - dateB.getTime();
    }

    // Past events: reverse chronological (most recent first)
    if (!aIsFuture && !bIsFuture) {
      return dateB.getTime() - dateA.getTime();
    }

    // Future events come before past events
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;

    return 0;
  });

  if (events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {dateKeys.map((dateKey) => {
            const group = groupedEvents[dateKey];
            const displayEvents = group.events.slice(0, maxEventsPerGroup);
            const remainingCount = group.events.length - maxEventsPerGroup;

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      group.isPast ? 'bg-gray-300' : 'bg-blue-500'
                    }`}
                  />
                  <h4
                    className={`font-semibold text-lg ${
                      group.isPast ? 'text-gray-600' : 'text-gray-900'
                    }`}
                  >
                    {group.label}
                  </h4>
                  <div
                    className={`text-sm px-2 py-1 rounded-full ${
                      group.isPast ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Events for this date */}
                <div className="space-y-3 ml-6">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} showDate={false} />
                  ))}

                  {/* Show remaining count if there are more events */}
                  {remainingCount > 0 && (
                    <div className="text-center py-2">
                      <span className="text-xs border border-gray-200 bg-white text-gray-600 px-2 py-1 rounded-full">
                        +{remainingCount} more event{remainingCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

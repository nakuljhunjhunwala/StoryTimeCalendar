import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, ExternalLink, Calendar } from 'lucide-react';
import { formatEventTime, parseEventDescription, getEventStatus } from '@/utils/event-utils';
import type { CalendarEvent } from '@/types';

interface EventCardProps {
  event: CalendarEvent;
  showDate?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, showDate = false }) => {
  const status = getEventStatus(event.startTime, event.endTime);
  const timeStr = formatEventTime(event.startTime, event.endTime, event.isAllDay);
  const cleanDescription = parseEventDescription(event.description || '');

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        status.status === 'happening'
          ? 'ring-2 ring-red-200 bg-red-50'
          : status.status === 'past'
            ? 'opacity-75'
            : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Event Title with Status */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{status.indicator}</span>
              <h3 className={`font-semibold truncate ${status.color}`}>
                {event.title || 'Untitled Event'}
              </h3>
              {status.status === 'happening' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  Live Now
                </span>
              )}
            </div>

            {/* Date and Time */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeStr}</span>
              </div>

              {showDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(event.startTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate" title={event.location}>
                    {event.location}
                  </span>
                </div>
              )}

              {event.attendeeCount && event.attendeeCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {event.attendeeCount} attendee{event.attendeeCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {cleanDescription && (
              <div className="text-sm text-gray-600 mb-3">
                <div className="line-clamp-3 whitespace-pre-line">{cleanDescription}</div>
              </div>
            )}

            {/* Meeting Link */}
            {event.meetingLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => window.open(event.meetingLink || '', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Join Meeting
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

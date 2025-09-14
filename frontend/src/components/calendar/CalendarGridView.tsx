import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/types';
import { formatEventTime } from '@/utils/event-utils';
import { ExternalLink, MapPin, Users } from 'lucide-react';

interface CalendarGridViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarGridView: React.FC<CalendarGridViewProps> = ({
  events,
  currentDate,
  onEventClick,
}) => {
  // Get calendar data for the current month
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // First day of the calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Last day of the calendar (might be from next month)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const weeks = [];
    const currentWeekDate = new Date(startDate);

    while (currentWeekDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekDate);
        const dayEvents = events.filter((event) => {
          const eventDate = new Date(event.startTime);
          return (
            eventDate.getDate() === date.getDate() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getFullYear() === date.getFullYear()
          );
        });

        week.push({
          date: new Date(date),
          isCurrentMonth: date.getMonth() === month,
          isToday: isToday(date),
          events: dayEvents,
        });

        currentWeekDate.setDate(currentWeekDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = getCalendarData();

  return (
    <div className="bg-white">
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b">
        {/* Week day headers */}
        {weekdays.map((day) => (
          <div
            key={day}
            className="p-4 text-sm font-medium text-gray-500 text-center border-r last:border-r-0 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`
                min-h-[120px] border-r border-b last:border-r-0 p-2 relative
                ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                ${day.isToday ? 'bg-blue-50' : ''}
              `}
            >
              {/* Date number */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                  `}
                >
                  {day.date.getDate()}
                </span>

                {day.events.length > 3 && (
                  <span className="text-xs text-gray-500">+{day.events.length - 3}</span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="group cursor-pointer"
                  >
                    <div
                      className={`
                        text-xs p-1 rounded truncate
                        ${
                          event.isAllDay
                            ? 'bg-blue-100 text-blue-800 border-l-2 border-blue-500'
                            : 'bg-green-100 text-green-800 border-l-2 border-green-500'
                        }
                        group-hover:bg-opacity-80 transition-colors
                      `}
                      title={`${event.title}${event.isAllDay ? ' (All day)' : ` at ${formatEventTime(event.startTime, event.endTime, event.isAllDay)}`}`}
                    >
                      <div className="font-medium truncate">
                        {event.isAllDay
                          ? event.title
                          : `${new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} ${event.title}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Event Detail Modal/Popover component
interface EventDetailProps {
  event: CalendarEvent;
  onClose: () => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ event, onClose }) => {
  return (
    <Card className="absolute z-50 w-80 p-4 shadow-lg border">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div>📅 {formatEventTime(event.startTime, event.endTime, event.isAllDay)}</div>

          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </div>
          )}

          {event.attendeeCount && event.attendeeCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.attendeeCount} attendee{event.attendeeCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {event.description && (
          <div className="text-sm">
            <p className="text-gray-700">
              {event.description.replace(/<[^>]*>/g, '').substring(0, 150)}
              {event.description.length > 150 ? '...' : ''}
            </p>
          </div>
        )}

        {event.meetingLink && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(event.meetingLink || '', '_blank')}
            className="w-full gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Join Meeting
          </Button>
        )}
      </div>
    </Card>
  );
};

/**
 * Event utility functions for better display and formatting
 */

export interface GroupedEvents {
  [dateKey: string]: {
    date: Date;
    label: string;
    events: any[];
    isPast: boolean;
  };
}

/**
 * Parse HTML content safely and convert to plain text with basic formatting
 */
export function parseEventDescription(html: string): string {
  if (!html) return '';

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Replace common HTML elements with text equivalents
  tempDiv.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  tempDiv.querySelectorAll('li').forEach((li) => {
    li.insertAdjacentText('afterbegin', '• ');
    li.insertAdjacentText('beforeend', '\n');
  });
  tempDiv.querySelectorAll('ol li').forEach((li, index) => {
    li.insertAdjacentText('afterbegin', `${index + 1}. `);
  });
  tempDiv.querySelectorAll('p').forEach((p) => p.insertAdjacentText('beforeend', '\n'));

  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Format time range for events
 */
export function formatEventTime(
  startTime: string,
  endTime: string,
  isAllDay: boolean = false
): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isAllDay) {
    return 'All day';
  }

  const startStr = start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endStr = end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Get relative time description (Today, Tomorrow, Yesterday, etc.)
 */
export function getRelativeDate(date: Date): { label: string; isPast: boolean; isToday: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Today', isPast: false, isToday: true };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', isPast: false, isToday: false };
  } else if (diffDays === -1) {
    return { label: 'Yesterday', isPast: true, isToday: false };
  } else if (diffDays > 1 && diffDays <= 7) {
    return {
      label: `${date.toLocaleDateString([], { weekday: 'long' })} (${diffDays} days)`,
      isPast: false,
      isToday: false,
    };
  } else if (diffDays < -1 && diffDays >= -7) {
    return {
      label: `${date.toLocaleDateString([], { weekday: 'long' })} (${Math.abs(diffDays)} days ago)`,
      isPast: true,
      isToday: false,
    };
  } else if (diffDays > 7) {
    return {
      label: date.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      isPast: false,
      isToday: false,
    };
  } else {
    return {
      label:
        date.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }) + ' (past)',
      isPast: true,
      isToday: false,
    };
  }
}

/**
 * Group events by date for better organization
 */
export function groupEventsByDate(events: any[]): GroupedEvents {
  const grouped: GroupedEvents = {};

  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sortedEvents.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dateKey = eventDate.toDateString();

    if (!grouped[dateKey]) {
      const relativeDate = getRelativeDate(eventDate);
      grouped[dateKey] = {
        date: eventDate,
        label: relativeDate.label,
        events: [],
        isPast: relativeDate.isPast,
      };
    }

    grouped[dateKey].events.push(event);
  });

  return grouped;
}

/**
 * Check if an event is currently happening
 */
export function isEventHappening(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  return now >= start && now <= end;
}

/**
 * Get event status with visual indicators
 */
export function getEventStatus(
  startTime: string,
  endTime: string
): {
  status: 'past' | 'happening' | 'upcoming';
  indicator: string;
  color: string;
} {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now > end) {
    return { status: 'past', indicator: '📅', color: 'text-gray-500' };
  } else if (now >= start && now <= end) {
    return { status: 'happening', indicator: '🔴', color: 'text-red-500' };
  } else {
    return { status: 'upcoming', indicator: '⏰', color: 'text-blue-500' };
  }
}

import React from 'react';
import { PaginatedEventsList } from './PaginatedEventsList';

interface CalendarListViewProps {
  // All props are handled by PaginatedEventsList internally
}

export const CalendarListView: React.FC<CalendarListViewProps> = () => {
  return (
    <div className="bg-white">
      <PaginatedEventsList title="" description="" showFilters={true} defaultPageSize={20} />
    </div>
  );
};

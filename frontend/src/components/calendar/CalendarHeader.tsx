import React from 'react';
import { Button } from '@/components/ui/button';
// Simple badge component for now
const Badge = ({ variant, className, children }: any) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      variant === 'secondary' ? 'bg-gray-100 text-gray-800' : 'bg-gray-200 text-gray-700'
    } ${className}`}
  >
    {children}
  </span>
);
import {
  Calendar,
  List,
  Settings,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

export type CalendarView = 'list' | 'calendar';

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onRefresh: () => void;
  onConnect: () => void;
  isLoading?: boolean;
  integrationCount: number;
  eventCount: number;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  onViewChange,
  onRefresh,
  onConnect,
  isLoading = false,
  integrationCount,
  eventCount,
  currentDate,
  onDateChange,
}) => {
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatCurrentPeriod = () => {
    if (view === 'calendar') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
    return 'All Events';
  };

  return (
    <div className="border-b bg-white px-6 py-4">
      {/* Top Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-gray-700">
              <CalendarIcon className="h-3 w-3" />
              {integrationCount} connected
            </Badge>
            <Badge variant="outline" className="gap-1 text-gray-600 border-gray-300">
              {eventCount} events
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={onConnect} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex items-center justify-between">
        {/* View Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('list')}
            className={`gap-2 ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('calendar')}
            className={`gap-2 ${view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} disabled={isLoading}>
            Today
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[140px] text-center">
              <span className="text-lg font-medium text-gray-900">{formatCurrentPeriod()}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

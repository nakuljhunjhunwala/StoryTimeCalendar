import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { calendarService } from '@/services';
import { getErrorMessage } from '@/lib/error-utils';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/loading-spinner';
import { CalendarHeader, type CalendarView } from '@/components/calendar/CalendarHeader';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { CalendarGridView, EventDetail } from '@/components/calendar/CalendarGridView';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Plus } from 'lucide-react';
import type { CalendarIntegration, Calendar as CalendarType, CalendarEvent } from '@/types';

export const CalendarPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [, setCalendars] = useState<CalendarType[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [view, setView] = useState<CalendarView>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const navigate = useNavigate();

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError('');

    try {
      // Try to load integrations first - if this fails, user likely has no calendar setup
      const integrationsRes = await calendarService.getIntegrations();
      const integrationsData = Array.isArray(integrationsRes.data)
        ? integrationsRes.data
        : (integrationsRes.data as { integrations?: CalendarIntegration[] })?.integrations || [];
      setIntegrations(integrationsData as CalendarIntegration[]);

      // If no integrations, don't try to load calendars/events
      if (integrationsData.length === 0) {
        setCalendars([]);
        setEvents([]);
        return;
      }

      // Load calendars and events only if we have integrations
      const [calendarsRes, eventsRes] = await Promise.all([
        calendarService.getCalendars().catch(() => ({ data: [] })),
        calendarService.getEvents({ limit: 100 }).catch(() => ({ data: [] })), // Load more events for calendar view
      ]);

      const calendarsData = Array.isArray(calendarsRes.data)
        ? calendarsRes.data
        : (calendarsRes.data as { calendars?: CalendarType[] })?.calendars || [];
      const eventsData = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : (eventsRes.data as { events?: CalendarEvent[] })?.events || [];

      setCalendars(calendarsData as CalendarType[]);
      setEvents(eventsData as CalendarEvent[]);
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Failed to load calendar data');
      setError(errorMsg);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const handleSync = async () => {
    if (integrations.length === 0) {
      setError('No calendar integrations found. Please connect a calendar first.');
      return;
    }

    setSyncLoading(true);
    setError('');

    try {
      await calendarService.syncEvents({ force: true });
      await loadData(false); // Reload data after sync without showing loading
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to sync calendars. Please try again.'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    navigate('/calendar/connect');
  };

  // Get filtered events based on current view and date
  const getFilteredEvents = useCallback(() => {
    if (view === 'calendar') {
      // For calendar view, show events for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      return events.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });
    }
    return events; // For list view, show all events (pagination handles filtering)
  }, [events, view, currentDate]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <PageLoader text="Loading calendar data..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={CalendarIcon}
                title="Failed to load calendar"
                description={error}
                action={{
                  label: 'Try Again',
                  onClick: () => loadData(),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No integrations - show connection screen
  if (integrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <EmptyState
                icon={CalendarIcon}
                title="Welcome to Your Calendar"
                description="Connect your Google Calendar to start viewing and managing your events in a beautiful interface."
                action={{
                  label: 'Connect Google Calendar',
                  onClick: handleConnectGoogle,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google Calendar-style Header */}
      <CalendarHeader
        view={view}
        onViewChange={setView}
        onRefresh={handleSync}
        onConnect={handleConnectGoogle}
        isLoading={syncLoading}
        integrationCount={integrations.length}
        eventCount={events.length}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      {/* Main Calendar Content */}
      <div className="flex-1">
        {view === 'list' ? (
          <CalendarListView />
        ) : (
          <div className="relative">
            <CalendarGridView
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={setSelectedEvent}
            />

            {/* Event Detail Popup */}
            {selectedEvent && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-20 z-40"
                  onClick={() => setSelectedEvent(null)}
                />
                {/* Event Detail */}
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Connect Button for when no events */}
      {events.length === 0 && (
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleConnectGoogle} size="lg" className="gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            Connect Calendar
          </Button>
        </div>
      )}
    </div>
  );
};

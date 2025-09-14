import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calendarService, aiService } from '@/services';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/auth';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import type { CalendarEvent } from '@/types';

interface Storyline {
  id: string;
  userId: string;
  eventId: string;
  theme: string;
  storyText: string;
  plainText: string;
  emoji: string;
  aiProvider: string;
  tokensUsed: number;
  isActive: boolean;
  hasStoryline: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface StoryEvent extends CalendarEvent {
  hasStory?: boolean;
  storyPreview?: string;
  storyline?: Storyline;
  fullStory?: string;
}

export const StoriesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const loadEvents = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setError('');

      try {
        // Check if user has calendar integrations first
        const [eventsRes, integrationsRes] = await Promise.all([
          calendarService.getEvents({ limit: 20 }).catch(() => ({ data: { events: [] } })),
          calendarService.getIntegrations().catch(() => ({ data: { integrations: [] } })),
        ]);

        // 🔧 BACKEND INTEGRATION: Extract events from correct response structure
        console.log('🔍 Raw events response:', eventsRes);
        console.log('🔍 Raw integrations response:', integrationsRes);

        const events = (eventsRes.data as any)?.events || [];
        const integrations =
          (integrationsRes.data as any)?.integrations || (integrationsRes.data as any) || [];

        console.log('📊 Extracted events:', events);
        console.log('📊 Extracted integrations:', integrations);

        if (integrations.length === 0) {
          setEvents([]);
          setError(
            'No calendar integrations found. Please connect a calendar to start generating stories.'
          );
          return;
        }

        // 🔧 STORYLINE INTEGRATION: Map events with their storyline data
        setEvents(
          events.map((event: any) => ({
            ...event,
            hasStory: !!event.storyline, // ✅ Cleaner: storyline is null if no story exists
            storyline: event.storyline,
            storyPreview: event.storyline?.storyText || undefined, // 🎭 SHOW THE AMAZING THEMED STORY!
            fullStory: event.storyline?.storyText || undefined,
          }))
        );
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load events'));
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [user?.selectedTheme, user?.hasApiKey]
  );

  const handleGenerateStory = async (event: StoryEvent) => {
    if (!user?.hasApiKey) {
      setError('AI provider not configured. Please set up your AI settings first.');
      return;
    }

    setIsGenerating(event.id);
    setError('');

    try {
      console.log(`🎭 Generating story for event: ${event.title}`);

      const response = await aiService.generateStoryline(event.id, {
        theme: user?.selectedTheme || 'FANTASY',
        includeContext: true,
        forceRegenerate: false,
      });

      console.log('✅ Story generation response:', response);

      // 🔧 BACKEND INTEGRATION: Handle new API response structure
      const storylineData = response.data?.data?.storyline || response.data?.storyline;

      if (storylineData) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? {
                  ...e,
                  hasStory: true,
                  storyline: { ...storylineData, hasStoryline: true },
                  storyPreview: storylineData.storyText, // 🎭 SHOW THE AMAZING THEMED STORY!
                  fullStory: storylineData.storyText,
                }
              : e
          )
        );
      }
    } catch (err) {
      console.error('❌ Story generation failed:', err);
      setError(getErrorMessage(err, 'Failed to generate story'));
    } finally {
      setIsGenerating(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (!user?.hasApiKey) {
      setError('AI provider not configured. Please set up your AI settings first.');
      return;
    }

    if (selectedEvents.length === 0) {
      setError('Please select at least one event to generate stories for.');
      return;
    }

    setIsBulkGenerating(true);
    setError('');

    try {
      console.log(`🎭 Generating stories for ${selectedEvents.length} events...`);

      const response = await aiService.generateMultiple(selectedEvents, {
        theme: user?.selectedTheme || 'FANTASY',
        includeContext: true,
        forceRegenerate: false,
      });

      console.log('✅ Bulk story generation response:', response);

      const results = response.data.data.results;

      setEvents((prev) =>
        prev.map((e) => {
          const result = results.find((r: any) => r.eventId === e.id);
          if (result && result.success) {
            return {
              ...e,
              hasStory: true,
              storyline: result.storyline,
              storyPreview: result.storyline.plainText,
              fullStory: result.storyline.storyText,
            };
          }
          return e;
        })
      );

      setSelectedEvents([]);
    } catch (err) {
      console.error('❌ Bulk story generation failed:', err);
      setError(getErrorMessage(err, 'Failed to generate stories'));
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    const eventsWithoutStories = events.filter((e) => !e.hasStory).map((e) => e.id);
    setSelectedEvents(eventsWithoutStories);
  };

  const handleDeselectAll = () => {
    setSelectedEvents([]);
  };

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Show loading state
  if (isLoading) {
    return <PageLoader text="Loading your events..." />;
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'FANTASY':
        return '🏰';
      case 'GENZ':
        return '✨';
      case 'MEME':
        return '😂';
      default:
        return '📖';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
          <p className="text-muted-foreground">AI-generated stories from your calendar events</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Current theme: {getThemeIcon(user?.selectedTheme || 'FANTASY')}{' '}
            {user?.selectedTheme || 'FANTASY'}
          </span>
          {events.filter((e) => !e.hasStory).length > 0 && user?.hasApiKey && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkGenerate}
                disabled={selectedEvents.length === 0 || isBulkGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isBulkGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating ({selectedEvents.length})...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate {selectedEvents.length > 0 ? `${selectedEvents.length}` : 'Stories'}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔍 DEBUG: User state:', user);
              console.log('🔍 DEBUG: Events state:', events);
              loadEvents();
            }}
            className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
          >
            🐛 Debug Refresh
          </Button>
          <Button asChild variant="outline">
            <a href="/ai-settings">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Settings
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Story Generation Issue</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => loadEvents()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {error.includes('calendar') && (
                <Button asChild>
                  <Link to="/calendar/connect">Connect Calendar</Link>
                </Button>
              )}
              {error.includes('AI') && (
                <Button asChild>
                  <Link to="/ai-settings">Configure AI</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Generation Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Available for story generation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Created</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter((e) => e.hasStory).length}</div>
            <p className="text-xs text-muted-foreground">AI-generated stories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Theme</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getThemeIcon(user?.selectedTheme || 'FANTASY')}
            </div>
            <p className="text-xs text-muted-foreground">{user?.selectedTheme || 'FANTASY'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {events.length === 0 && !error ? (
        <EmptyState
          icon={Calendar}
          title="No calendar events found"
          description="Connect your calendar and sync events to start generating AI-powered stories from your schedule."
          action={{
            label: 'Connect Calendar',
            onClick: () => (window.location.href = '/calendar/connect'),
          }}
          secondaryAction={{
            label: 'Refresh Events',
            onClick: () => loadEvents(),
          }}
        />
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className={selectedEvents.includes(event.id) ? 'ring-2 ring-purple-500' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {!event.hasStory && user?.hasApiKey && (
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => handleSelectEvent(event.id)}
                        className="mt-1"
                        disabled={isBulkGenerating}
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {event.hasStory && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {event.title}
                        {event.storyline && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {event.storyline.aiProvider} • {event.storyline.tokensUsed} tokens
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.startTime).toLocaleString()}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        {event.attendeeCount && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendeeCount} attendees
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.hasStory ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Full Story
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateStory(event)}
                          disabled={isGenerating === event.id}
                        >
                          {isGenerating === event.id ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateStory(event)}
                        disabled={isGenerating === event.id || isBulkGenerating}
                      >
                        {isGenerating === event.id ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Story
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {(event.description || event.storyPreview || event.fullStory) && (
                <CardContent>
                  {event.description && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Event Description:</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  )}
                  {event.storyPreview && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        {event.storyline?.emoji && (
                          <span className="text-lg">{event.storyline.emoji}</span>
                        )}
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        AI Story ({user?.selectedTheme}):
                        {event.storyline && (
                          <span className="ml-auto text-xs text-purple-600">
                            Generated {new Date(event.storyline.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm italic text-purple-800 leading-relaxed">
                        {event.storyPreview}
                      </p>
                      {event.storyline && (
                        <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between text-xs text-purple-600">
                          <span>Provider: {event.storyline.aiProvider}</span>
                          <span>Tokens: {event.storyline.tokensUsed}</span>
                          <span>Theme: {event.storyline.theme}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {/* AI Configuration Warning */}
      {!user?.hasApiKey && events.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Configuration Required
            </CardTitle>
            <CardDescription className="text-amber-700">
              Set up your AI provider to start generating stories from your calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link to="/ai-settings">
                <Sparkles className="h-4 w-4 mr-2" />
                Configure AI Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

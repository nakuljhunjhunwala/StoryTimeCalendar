import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { calendarService, aiService } from '@/services';
import {
  Zap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Target,
  TrendingDown,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/auth';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import type { CalendarEvent, CalendarIntegration } from '@/types';

interface GenerationResult {
  eventId: string;
  success: boolean;
  storyline?: any;
  error?: string;
  tokensUsed?: number;
}

interface StoryEvent extends CalendarEvent {
  hasStory?: boolean;
  selected?: boolean;
}

export const StoryGenerationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [error, setError] = useState<string>('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [eventsRes, integrationsRes] = await Promise.all([
        calendarService.getEvents({ limit: 50 }).catch(() => ({ data: [] })),
        calendarService.getIntegrations().catch(() => ({ data: [] })),
      ]);

      const events = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : (eventsRes.data as { events?: CalendarEvent[] })?.events || [];
      const integrations = Array.isArray(integrationsRes.data)
        ? integrationsRes.data
        : (integrationsRes.data as { integrations?: CalendarIntegration[] })?.integrations || [];

      if (integrations.length === 0) {
        setEvents([]);
        setError('No calendar integrations found. Please connect a calendar first.');
        return;
      }

      // Filter events that are upcoming and don't have stories yet
      const now = new Date();
      const upcomingEvents = events.filter((event) => new Date(event.startTime) > now);

      setEvents(
        upcomingEvents.map((event: CalendarEvent) => ({
          ...event,
          hasStory: false, // TODO: Check backend for existing stories
          selected: true, // Select all by default for bulk generation
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load events'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectEvent = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, selected: !e.selected } : e)));
  };

  const handleSelectAll = () => {
    const allSelected = events.every((e) => e.selected);
    setEvents((prev) => prev.map((e) => ({ ...e, selected: !allSelected })));
  };

  const handleBulkGenerate = async () => {
    const selectedEvents = events.filter((e) => e.selected && !e.hasStory);

    if (selectedEvents.length === 0) {
      setError('Please select at least one event to generate stories for.');
      return;
    }

    if (!user?.hasApiKey) {
      setError('AI provider not configured. Please set up your AI settings first.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationResults([]);
    setTotalTokensUsed(0);
    setError('');

    try {
      console.log(`🎭 Starting bulk generation for ${selectedEvents.length} events...`);

      const response = await aiService.generateMultiple(
        selectedEvents.map((e) => e.id),
        {
          theme: user?.selectedTheme || 'FANTASY',
          includeContext: true,
          forceRegenerate: false,
        }
      );

      console.log('✅ Bulk generation response:', response);

      const results = response.data.data.results;
      setGenerationResults(results);

      // Calculate total tokens used
      const totalTokens = results.reduce(
        (sum: number, result: GenerationResult) => sum + (result.tokensUsed || 0),
        0
      );
      setTotalTokensUsed(totalTokens);

      // Update events with stories
      setEvents((prev) =>
        prev.map((e) => {
          const result = results.find((r: GenerationResult) => r.eventId === e.id);
          if (result?.success) {
            return { ...e, hasStory: true };
          }
          return e;
        })
      );

      setGenerationProgress(100);
    } catch (err) {
      console.error('❌ Bulk generation failed:', err);
      setError(getErrorMessage(err, 'Failed to generate stories'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!user?.hasApiKey) {
      setError('AI provider not configured. Please set up your AI settings first.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationResults([]);
    setTotalTokensUsed(0);
    setError('');

    try {
      console.log('🎭 Generating stories for ALL user events...');

      const response = await aiService.generateAll({
        forceRegenerate: false,
        includeContext: true,
      });

      console.log('✅ Generate all response:', response);

      const results = response.data.data.results;
      setGenerationResults(results);

      const totalTokens = results.reduce(
        (sum: number, result: GenerationResult) => sum + (result.tokensUsed || 0),
        0
      );
      setTotalTokensUsed(totalTokens);

      setGenerationProgress(100);

      // Reload events to show updated stories
      loadEvents();
    } catch (err) {
      console.error('❌ Generate all failed:', err);
      setError(getErrorMessage(err, 'Failed to generate all stories'));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (isLoading) {
    return <PageLoader text="Loading events for story generation..." />;
  }

  const selectedCount = events.filter((e) => e.selected && !e.hasStory).length;
  const successfulResults = generationResults.filter((r) => r.success).length;
  const failedResults = generationResults.filter((r) => !r.success).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-600" />
            Story Generator
          </h1>
          <p className="text-muted-foreground">
            Bulk generate AI stories for multiple calendar events efficiently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/stories">
              <Calendar className="h-4 w-4 mr-2" />
              View Stories
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ai-settings">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Settings
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Generation Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadEvents} variant="outline">
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

      {/* Generation Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming events ready for stories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{selectedCount}</div>
            <p className="text-xs text-muted-foreground">Events selected for generation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalTokensUsed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Tokens used in last generation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {generationResults.length > 0
                ? Math.round((successfulResults / generationResults.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {successfulResults}/{generationResults.length} successful
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-spin text-purple-600" />
              Generating Stories...
            </CardTitle>
            <CardDescription>
              Processing {selectedCount} events with AI story generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={generationProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">{generationProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {generationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
            <CardDescription>
              Summary of story generation for {generationResults.length} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Successful: {successfulResults}
                </span>
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Failed: {failedResults}
                </span>
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-purple-600" />
                  Total Tokens: {totalTokensUsed.toLocaleString()}
                </span>
              </div>
              {failedResults > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Failed Generations:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {generationResults
                      .filter((r) => !r.success)
                      .map((result) => (
                        <li key={result.eventId}>
                          Event {result.eventId}: {result.error}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Generation Controls */}
      {events.length > 0 && user?.hasApiKey && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Story Generation</CardTitle>
            <CardDescription>
              Generate stories for multiple events efficiently to minimize token usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                {events.every((e) => e.selected) ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">{selectedCount} events selected</span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBulkGenerate}
                disabled={selectedCount === 0 || isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Selected ({selectedCount})
                  </>
                )}
              </Button>

              <Button onClick={handleGenerateAll} disabled={isGenerating} variant="outline">
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating All...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate All Events
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {events.length === 0 && !error ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming events found"
          description="Connect your calendar and sync upcoming events to start generating AI-powered stories."
          action={{
            label: 'Connect Calendar',
            onClick: () => (window.location.href = '/calendar/connect'),
          }}
          secondaryAction={{
            label: 'Refresh Events',
            onClick: loadEvents,
          }}
        />
      ) : events.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Events for Story Generation</CardTitle>
            <CardDescription>
              Choose which events to generate stories for. Bulk generation is more token-efficient.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    event.selected ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={event.selected || false}
                    onChange={() => handleSelectEvent(event.id)}
                    disabled={event.hasStory || isGenerating}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {event.hasStory && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
                    </div>
                  </div>
                  {event.hasStory && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Story Generated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

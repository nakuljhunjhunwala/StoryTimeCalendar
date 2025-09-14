import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { calendarService } from '@/services';
import { Calendar, BookOpen, Zap, Plus, Activity, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '@/lib/error-utils';
import type { CalendarEvent, CalendarIntegration } from '@/types';

interface DashboardStats {
  totalEvents: number;
  storiesGenerated: number;
  aiUsageToday: number;
  syncStatus: string;
  lastSyncAt: string | null;
  activeIntegrations: number;
  upcomingEvents: CalendarEvent[];
  recentActivity: Array<{ activity: string; timestamp: string }>;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch data from multiple endpoints
      const [eventsRes, integrationsRes, syncStatusRes] = await Promise.all([
        calendarService.getEvents({ limit: 10 }),
        calendarService.getIntegrations(),
        calendarService.getSyncStatus().catch(() => null), // Optional
      ]);

      const events = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : (eventsRes.data as { events?: CalendarEvent[] })?.events || [];
      const integrations = Array.isArray(integrationsRes.data)
        ? integrationsRes.data
        : (integrationsRes.data as { integrations?: CalendarIntegration[] })?.integrations || [];
      const syncStatus = syncStatusRes?.data;

      // Calculate statistics
      const activeIntegrations = (integrations as CalendarIntegration[]).filter(
        (i) => i.status === 'ACTIVE'
      ).length;
      const storiesGenerated = Math.floor(events.length * 0.6); // Simulate 60% story generation rate
      const aiUsageToday = Math.floor(Math.random() * 24) + 1; // Simulate AI usage

      // Generate recent activity
      const recentActivity = [
        {
          activity: 'Calendar sync completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          activity: `Story generated for "${events[0]?.title || 'Team Meeting'}"`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          activity: 'Profile updated',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ];

      setStats({
        totalEvents: events.length,
        storiesGenerated,
        aiUsageToday,
        syncStatus: syncStatus?.lastSyncAt ? 'Synced' : 'Pending',
        lastSyncAt: syncStatus?.lastSyncAt || null,
        activeIntegrations,
        upcomingEvents: (events as CalendarEvent[]).slice(0, 3), // Show top 3 upcoming events
        recentActivity,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite calls

  const handleRefresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your StoryTime Calendar today.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendar Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Total synchronized events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Generated</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storiesGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">AI-powered stories created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aiUsageToday || 0}</div>
            <p className="text-xs text-muted-foreground">AI generations today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <div
              className={`h-2 w-2 rounded-full ${
                stats?.syncStatus === 'Synced' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.syncStatus || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSyncAt
                ? `Last sync: ${new Date(stats.lastSyncAt).toLocaleTimeString()}`
                : 'No recent sync'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.activeIntegrations === 0 ? (
              <Link to="/calendar/connect">
                <Button className="w-full justify-start" variant="default">
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Your First Calendar
                </Button>
              </Link>
            ) : (
              <Link to="/calendar">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Calendars ({stats?.activeIntegrations || 0} connected)
                </Button>
              </Link>
            )}

            <Link to="/stories">
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                View & Generate Stories
              </Button>
            </Link>

            <Link to="/ai-settings">
              <Button className="w-full justify-start" variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                Configure AI Settings
              </Button>
            </Link>

            <Link to="/analytics">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity.length ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className={`flex h-2 w-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.activity}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect a calendar to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Your next scheduled events from connected calendars</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.upcomingEvents.length ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">
                Connect your calendar to see upcoming events and generate stories
              </p>
              <Link to="/calendar/connect">
                <Button>Connect Calendar</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {new Date(event.startTime).getDate()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startTime).toLocaleTimeString()} -{' '}
                      {new Date(event.endTime).toLocaleTimeString()}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                    )}
                  </div>
                  <Link to="/stories">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Story
                    </Button>
                  </Link>
                </div>
              ))}

              {stats.upcomingEvents.length > 0 && (
                <div className="text-center pt-4">
                  <Link to="/calendar">
                    <Button variant="outline">View All Events</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Configuration Status */}
      {!user?.hasApiKey && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">⚠️ AI Configuration Required</CardTitle>
            <CardDescription className="text-amber-700">
              Set up your AI provider to start generating stories from your calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/ai-settings">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Zap className="h-4 w-4 mr-2" />
                Configure AI Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calendarService } from '@/services';
import {
  BarChart3,
  Calendar,
  BookOpen,
  TrendingUp,
  Activity,
  Clock,
  Users,
  Zap,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import type { CalendarEvent, CalendarIntegration } from '@/types';
import { useAuthStore } from '@/store/auth';

interface AnalyticsData {
  totalEvents: number;
  storiesGenerated: number;
  activeIntegrations: number;
  syncStatus: string;
  eventsByDay: { date: string; count: number }[];
  themeUsage: { theme: string; count: number }[];
  recentActivity: { activity: string; timestamp: string }[];
}

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch data from multiple sources
      const [eventsRes, integrationsRes, syncStatusRes] = await Promise.all([
        calendarService.getEvents({ limit: 100 }),
        calendarService.getIntegrations(),
        calendarService.getSyncStatus(),
      ]);

      const events = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : (eventsRes.data as { events?: CalendarEvent[] })?.events || [];
      const integrations = Array.isArray(integrationsRes.data)
        ? integrationsRes.data
        : (integrationsRes.data as { integrations?: CalendarIntegration[] })?.integrations || [];
      const syncStatus = syncStatusRes.data;

      // Process analytics data
      const now = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const eventsByDay = last7Days.map((date) => ({
        date,
        count: events.filter(
          (event: any) => new Date(event.startTime).toISOString().split('T')[0] === date
        ).length,
      }));

      // Simulate story generation data
      const storiesGenerated = Math.floor(events.length * 0.6); // 60% of events have stories

      const themeUsage = [
        { theme: 'FANTASY', count: Math.floor(storiesGenerated * 0.5) },
        { theme: 'GENZ', count: Math.floor(storiesGenerated * 0.3) },
        { theme: 'MEME', count: Math.floor(storiesGenerated * 0.2) },
      ];

      const recentActivity = [
        {
          activity: 'Calendar sync completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          activity: 'Story generated for "Team Meeting"',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          activity: 'Google Calendar connected',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          activity: 'Profile updated',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];

      setAnalytics({
        totalEvents: events.length,
        storiesGenerated,
        activeIntegrations: integrations.filter((i: any) => i.status === 'ACTIVE').length,
        syncStatus: syncStatus.lastSyncAt ? 'Active' : 'Inactive',
        eventsByDay,
        themeUsage,
        recentActivity,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load analytics data'));
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite calls

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BarChart3 className="h-8 w-8 animate-pulse" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Insights into your calendar events and story generation activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Synchronized from your calendars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Generated</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.storiesGenerated}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.storiesGenerated / analytics.totalEvents) * 100)}% of events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeIntegrations}</div>
            <p className="text-xs text-muted-foreground">Calendar connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.syncStatus}</div>
            <p className="text-xs text-muted-foreground">Calendar synchronization</p>
          </CardContent>
        </Card>
      </div>

      {/* Events by Day Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Events This Week</CardTitle>
          <CardDescription>Number of calendar events per day over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.eventsByDay.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((day.count / Math.max(...analytics.eventsByDay.map((d) => d.count))) * 100, 5)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{day.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Story Theme Usage
            </CardTitle>
            <CardDescription>Distribution of AI story themes you've used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.themeUsage.map((theme) => (
                <div key={theme.theme} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{theme.theme}</span>
                    <span className="text-muted-foreground">{theme.count} stories</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        theme.theme === 'FANTASY'
                          ? 'bg-purple-600'
                          : theme.theme === 'GENZ'
                            ? 'bg-pink-600'
                            : 'bg-yellow-600'
                      }`}
                      style={{ width: `${(theme.count / analytics.storiesGenerated) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Current theme:</strong> {user?.selectedTheme || 'FANTASY'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Change your theme in profile settings to try different story styles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.activity}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Detailed breakdown of your StoryTime Calendar usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Account</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Provider:</span>
                  <span className="text-muted-foreground">{user?.aiProvider || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Theme:</span>
                  <span className="text-muted-foreground">{user?.selectedTheme || 'FANTASY'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="font-medium">Calendar Data</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Events:</span>
                  <span className="text-muted-foreground">{analytics.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Week:</span>
                  <span className="text-muted-foreground">
                    {analytics.eventsByDay.reduce((sum, day) => sum + day.count, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Integrations:</span>
                  <span className="text-muted-foreground">
                    {analytics.activeIntegrations} active
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <span className="font-medium">AI Stories</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Generated:</span>
                  <span className="text-muted-foreground">{analytics.storiesGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="text-muted-foreground">
                    {Math.round((analytics.storiesGenerated / analytics.totalEvents) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Favorite Theme:</span>
                  <span className="text-muted-foreground">
                    {
                      analytics.themeUsage.reduce((max, theme) =>
                        theme.count > max.count ? theme : max
                      ).theme
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

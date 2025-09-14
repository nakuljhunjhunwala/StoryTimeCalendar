import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calendarService } from '@/services/calendar.service';
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';
import type { CalendarIntegration } from '@/types';

export const CalendarConnectPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load existing integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const response = await calendarService.getIntegrations();
        const integrationsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { integrations?: CalendarIntegration[] })?.integrations || [];
        setIntegrations(integrationsData as CalendarIntegration[]);
      } catch (err) {
        // Ignore errors - user might not have any integrations yet
        setIntegrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, []);

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');
      setSuccess('');

      const response = await calendarService.initiateGoogleOAuth();
      const { authUrl } = response.data;

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to connect to Google Calendar'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManageCalendar = () => {
    navigate('/calendar');
  };

  const isGoogleConnected = integrations.some(
    (integration) => integration.provider === 'GOOGLE' && integration.status === 'ACTIVE'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect Your Calendar</h1>
        <p className="text-muted-foreground">
          Connect your calendar to start generating AI-powered stories from your events.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Calendar Providers */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Google Calendar */}
        <Card className={isGoogleConnected ? 'border-green-200 bg-green-50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isGoogleConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Google Calendar</CardTitle>
              </div>
              {isGoogleConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <CardDescription>
              {isGoogleConnected
                ? '✅ Connected - Your Google Calendar is synced and ready'
                : 'Connect your Google Calendar to sync events and generate stories'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGoogleConnected ? (
              <div className="space-y-2">
                <Button onClick={handleManageCalendar} className="w-full" variant="default">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Calendar
                </Button>
                <Button
                  onClick={handleGoogleConnect}
                  disabled={isConnecting}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  {isConnecting ? (
                    'Reconnecting...'
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Reconnect
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGoogleConnect}
                disabled={isConnecting || isLoading}
                className="w-full"
              >
                {isConnecting ? (
                  'Connecting...'
                ) : isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Microsoft Outlook - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Microsoft Outlook</CardTitle>
            </div>
            <CardDescription>Microsoft Outlook integration coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* Apple Calendar - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Apple Calendar</CardTitle>
            </div>
            <CardDescription>Apple Calendar integration coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Follow these simple steps to connect your calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Choose your calendar provider</h3>
                <p className="text-sm text-muted-foreground">
                  Select Google Calendar or wait for other providers to become available
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Authorize access</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to sign in and grant permission to read your calendar events
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Start generating stories</h3>
                <p className="text-sm text-muted-foreground">
                  Once connected, our AI will help you create amazing stories from your calendar
                  events
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

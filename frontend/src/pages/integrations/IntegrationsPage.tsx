import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slack, MessageSquare, CheckCircle, AlertCircle, Loader2, TestTube } from 'lucide-react';
import { slackService } from '@/services/slack.service';
import { notificationService } from '@/services/notification.service';

interface SlackIntegration {
  connected: boolean;
  integration?: {
    teamName: string;
    userId: string;
    connectedAt: string;
  };
}

export const IntegrationsPage: React.FC = () => {
  const [slackIntegration, setSlackIntegration] = useState<SlackIntegration>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [notifications, setNotifications] = useState({
    enabled: false,
    reminderMinutes: 15,
  });

  useEffect(() => {
    loadIntegrations();
    loadNotificationPreferences();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const slackData = await slackService.getIntegration();
      setSlackIntegration(slackData);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setNotifications({
        enabled: prefs.enableNotifications,
        reminderMinutes: prefs.reminderMinutes,
      });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handleSlackConnect = async () => {
    try {
      setConnecting(true);
      const { authUrl } = await slackService.initiateOAuth();

      // Open Slack OAuth in new window
      const popup = window.open(
        authUrl,
        'slack-oauth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnecting(false);
          // Reload integrations after OAuth
          setTimeout(() => {
            loadIntegrations();
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to initiate Slack OAuth:', error);
      setConnecting(false);
    }
  };

  const handleSlackDisconnect = async () => {
    try {
      await slackService.disconnect();
      setSlackIntegration({ connected: false });
      setNotifications({ ...notifications, enabled: false });
    } catch (error) {
      console.error('Failed to disconnect Slack:', error);
    }
  };

  const handleTestMessage = async () => {
    try {
      await slackService.sendTestMessage();
      alert('Test message sent successfully! Check your Slack DMs.');
    } catch (error) {
      console.error('Failed to send test message:', error);
      alert('Failed to send test message. Please check your integration.');
    }
  };

  const handleNotificationToggle = async () => {
    try {
      const newEnabled = !notifications.enabled;
      await notificationService.updatePreferences({
        enableNotifications: newEnabled,
        reminderMinutes: notifications.reminderMinutes,
      });
      setNotifications({ ...notifications, enabled: newEnabled });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📱 Integrations & Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Connect your favorite platforms to receive personalized story reminders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Slack className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Slack</CardTitle>
                <CardDescription>Receive story reminders via Slack DMs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {slackIntegration.connected ? (
              <>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Connected to {slackIntegration.integration?.teamName}
                      </p>
                      <p className="text-sm text-green-600">Direct messages enabled</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleTestMessage}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Send Test DM
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleSlackDisconnect}>
                    Disconnect
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={handleNotificationToggle}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium">Enable notifications</label>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      Connect Slack to receive personalized story reminders as direct messages 15
                      minutes before your events!
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleSlackConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Slack className="h-4 w-4 mr-2" />
                      Connect Slack
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Microsoft Teams - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle>Microsoft Teams</CardTitle>
                <CardDescription>Get story reminders in Teams</CardDescription>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                Coming Soon
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  Microsoft Teams integration is coming soon! You'll be able to receive the same
                  epic story reminders in your Teams channels.
                </p>
              </div>
            </div>

            <Button className="w-full" disabled>
              <MessageSquare className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🔔 Notification Settings</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Reminder Timing</h4>
              <p className="text-sm text-muted-foreground">
                Currently set to {notifications.reminderMinutes} minutes before events
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  notifications.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {notifications.enabled ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

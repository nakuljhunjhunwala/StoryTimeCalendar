import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';

export const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const calendarsFound = searchParams.get('calendarsFound');

        if (error) {
          setStatus('error');
          setMessage(decodeURIComponent(error));
          return;
        }

        if (success === 'true') {
          setStatus('success');
          const calendarText = calendarsFound === '1' ? 'calendar' : 'calendars';
          setMessage(
            `Google Calendar connected successfully! Found ${calendarsFound} ${calendarText}.`
          );

          // Redirect to calendar page after a short delay
          setTimeout(() => {
            navigate('/calendar');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Invalid authorization response');
        }
      } catch (err: unknown) {
        setStatus('error');
        setMessage(getErrorMessage(err, 'Failed to process authorization'));
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Connecting Google Calendar...';
      case 'success':
        return 'Calendar Connected Successfully!';
      case 'error':
        return 'Connection Failed';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we set up your calendar integration';
      case 'success':
        return 'Your Google Calendar has been connected. Redirecting you to the dashboard...';
      case 'error':
        return message;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{getIcon()}</div>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'error' && (
              <div className="space-y-4">
                <Button onClick={() => navigate('/calendar/connect')} className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  This should only take a few seconds...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard in a moment...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { healthService } from '@/services';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<{
    status: 'UP' | 'DOWN' | 'CHECKING';
    details?: any;
  }>({ status: 'CHECKING' });
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async (detailed = false) => {
    setIsLoading(true);
    try {
      const response = detailed
        ? await healthService.getDetailedHealth()
        : await healthService.getHealth();

      setHealthStatus({
        status: response.data.status,
        details: 'details' in response.data ? response.data.details : undefined,
      });
    } catch (error) {
      setHealthStatus({ status: 'DOWN' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'UP':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DOWN':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          System Health
        </CardTitle>
        <CardDescription>Current status of the backend services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Backend API</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                healthStatus.status === 'UP'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {healthStatus.status}
            </span>
          </div>

          {healthStatus.details && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    healthStatus.details.database.status === 'UP'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {healthStatus.details.database.status}
                </span>
              </div>
              {healthStatus.details.database.error && (
                <p className="text-sm text-red-600">{healthStatus.details.database.error}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => checkHealth(false)} disabled={isLoading} size="sm">
              {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Check Health
            </Button>
            <Button
              onClick={() => checkHealth(true)}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Detailed Check
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

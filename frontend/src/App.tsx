import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { CalendarConnectPage } from '@/pages/calendar/CalendarConnectPage';
import { GoogleCallbackPage } from '@/pages/calendar/GoogleCallbackPage';
import { StoriesPage } from '@/pages/stories/StoriesPage';
import { StoryGenerationPage } from '@/pages/stories/StoryGenerationPage';
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage';
import { AISettingsPage } from '@/pages/settings/AISettingsPage';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { IntegrationsPage } from '@/pages/integrations/IntegrationsPage';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useAuthStore } from '@/store/auth';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public routes */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <ErrorBoundary>
                  <LoginPage />
                </ErrorBoundary>
              </PublicRoute>
            }
          />

          <Route
            path="/auth/register"
            element={
              <PublicRoute>
                <ErrorBoundary>
                  <RegisterPage />
                </ErrorBoundary>
              </PublicRoute>
            }
          />

          {/* OAuth callback (no auth required) */}
          <Route
            path="/auth/google/callback"
            element={
              <ErrorBoundary>
                <GoogleCallbackPage />
              </ErrorBoundary>
            }
          />

          {/* Protected routes with layout */}
          <Route path="/" element={<MainLayout />}>
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <DashboardPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="calendar"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <CalendarPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="calendar/connect"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <CalendarConnectPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="stories"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <StoriesPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="stories/generate"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <StoryGenerationPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="analytics"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AnalyticsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="ai-settings"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AISettingsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="integrations"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <IntegrationsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

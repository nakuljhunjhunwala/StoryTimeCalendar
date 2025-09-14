import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { Calendar, User, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">StoryTime Calendar</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-4 ml-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/calendar">
            <Button variant="ghost" size="sm">
              Calendar
            </Button>
          </Link>
          <Link to="/stories">
            <Button variant="ghost" size="sm">
              Stories
            </Button>
          </Link>
          <Link to="/integrations">
            <Button variant="ghost" size="sm">
              Integrations
            </Button>
          </Link>
        </nav>

        {/* User Menu */}
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {user?.name?.split(' ')[0] || 'User'}!
          </span>

          <Link to="/profile">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>

          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>

          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

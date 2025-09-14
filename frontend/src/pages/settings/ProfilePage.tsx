import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfileSettings } from '@/components/features/UserProfileSettings';
import { HealthCheck } from '@/components/features/HealthCheck';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services';
import { getErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Key, Settings } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: getErrorMessage(error, 'Failed to change password'),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* User Info Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
              <p
                className={`text-lg font-semibold ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}
              >
                {user?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">AI Provider</Label>
              <p className="text-lg">{user?.aiProvider || 'Not configured'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings Form */}
      <UserProfileSettings />

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password for security</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage && (
              <div
                className={`p-3 rounded ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="Enter your current password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="Enter your new password"
                minLength={8}
                required
              />
              <p className="text-sm text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm your new password"
                required
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>Additional account management options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">AI Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure your AI provider and API keys
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/ai-settings">
                  <Key className="h-4 w-4 mr-2" />
                  Manage AI Settings
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Calendar Integration</h4>
                <p className="text-sm text-muted-foreground">Manage your connected calendars</p>
              </div>
              <Button variant="outline" asChild>
                <a href="/calendar">Manage Calendars</a>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
              <div>
                <h4 className="font-medium text-red-700">Logout</h4>
                <p className="text-sm text-red-600">Sign out of your account on this device</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <HealthCheck />
    </div>
  );
};

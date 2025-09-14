import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services';
import { getErrorMessage } from '@/lib/error-utils';

const profileSchema = z.object({
  name: z.string().optional(),
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),
  selectedTheme: z.enum(['FANTASY', 'GENZ', 'MEME']).optional(),
  timezone: z.string().optional(),
  notificationMinutes: z.number().min(1).max(60).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const UserProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age,
      gender: user?.gender as 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | undefined,
      selectedTheme: user?.selectedTheme as 'FANTASY' | 'GENZ' | 'MEME' | undefined,
      timezone: user?.timezone,
      notificationMinutes: user?.notificationMinutes,
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authService.updateProfile(data);
      updateUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getErrorMessage(error, 'Failed to update profile'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="Enter your full name" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="Your age"
              />
              {errors.age && <p className="text-sm text-red-600">{errors.age.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationMinutes">Notification (minutes before)</Label>
              <Input
                id="notificationMinutes"
                type="number"
                {...register('notificationMinutes', { valueAsNumber: true })}
                placeholder="15"
              />
              {errors.notificationMinutes && (
                <p className="text-sm text-red-600">{errors.notificationMinutes.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" {...register('gender')} className="w-full p-2 border rounded-md">
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectedTheme">Story Theme</Label>
            <select
              id="selectedTheme"
              {...register('selectedTheme')}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select theme</option>
              <option value="FANTASY">Fantasy</option>
              <option value="GENZ">Gen-Z</option>
              <option value="MEME">Meme</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register('timezone')} placeholder="e.g., America/New_York" />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

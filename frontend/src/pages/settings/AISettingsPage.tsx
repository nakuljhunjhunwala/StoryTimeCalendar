import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { aiService } from '@/services';
import { getErrorMessage } from '@/lib/error-utils';
import { Sparkles, Eye, EyeOff, Key, Zap, Palette, Loader2 } from 'lucide-react';

const aiSettingsSchema = z.object({
  aiApiKey: z.string().optional(),
  aiProvider: z.enum(['GEMINI', 'OPENAI', 'CLAUDE']),
  aiModel: z.string().optional(),
});

type AISettingsForm = z.infer<typeof aiSettingsSchema>;

export const AISettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<Record<string, { models: string[]; defaultModel: string }>>(
    {}
  );
  const [isLoadingData, setIsLoadingData] = useState(true);

  console.log('🎯 AISettingsPage rendered, state:', {
    user: !!user,
    providersLength: providers.length,
    modelsKeys: Object.keys(models),
    isLoadingData,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AISettingsForm>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      aiApiKey: '',
      aiProvider: (user?.aiProvider || 'GEMINI') as 'GEMINI' | 'OPENAI' | 'CLAUDE',
      aiModel: user?.aiModel || '',
    },
  });

  const selectedProvider = watch('aiProvider');

  // Fetch providers and models data from backend
  useEffect(() => {
    console.log('🔄 Starting to fetch AI data...');
    const fetchData = async () => {
      try {
        console.log('📡 Making API calls...');
        const [providersResponse, modelsResponse] = await Promise.all([
          aiService.getProviders(),
          aiService.getAllModels(),
        ]);

        console.log('📥 Providers Response:', providersResponse);
        console.log('📥 Models Response:', modelsResponse);

        const providersData = providersResponse.data.data.providers || [];
        const modelsData = modelsResponse.data.data.models || {};

        console.log('📊 Extracted Providers:', providersData);
        console.log('📊 Extracted Models:', modelsData);
        console.log('📊 Providers length:', providersData.length);
        console.log('📊 Models keys:', Object.keys(modelsData));

        setProviders(providersData);
        setModels(modelsData);

        console.log('✅ Data set successfully');
      } catch (error) {
        console.error('❌ Failed to fetch AI data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load AI provider data. Please refresh the page.',
        });
      } finally {
        setIsLoadingData(false);
        console.log('🏁 Finished loading data, isLoadingData set to false');
      }
    };

    fetchData();
  }, []);

  // Load existing user AI configuration
  useEffect(() => {
    const loadUserConfig = async () => {
      if (!user) return;

      try {
        const configResponse = await aiService.getUserConfig();
        const config = configResponse.data.data;

        // Update form with existing settings
        if (config.aiProvider) {
          setValue('aiProvider', config.aiProvider);
        }
        if (config.aiModel) {
          setValue('aiModel', config.aiModel);
        }
      } catch (error) {
        // User might not have AI config yet, that's okay
        console.log('No existing AI config found, using defaults');
      }
    };

    loadUserConfig();
  }, [user, setValue]);

  const onSubmit = async (data: AISettingsForm) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Only send API key if it's not empty
      const updateData: any = {
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
      };

      // Only include API key if user entered one
      if (data.aiApiKey && data.aiApiKey.trim()) {
        updateData.aiApiKey = data.aiApiKey;
      }

      const response = await aiService.updateSettings(updateData);
      updateUser(response.data.data.user);

      // Clear the API key field and reset form
      setValue('aiApiKey', '');
      setShowApiKey(false);

      setMessage({ type: 'success', text: 'AI settings updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getErrorMessage(error, 'Failed to update AI settings'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    // Find provider from backend data
    const providerData = providers.find((p) => p.provider === provider);
    const modelData = models[provider];

    if (providerData) {
      // Map provider icons
      const icons: Record<string, string> = {
        GEMINI: '🔵',
        OPENAI: '🤖',
        CLAUDE: '🎭',
      };

      // Map API key help
      const apiKeyHelp: Record<string, string> = {
        GEMINI: 'Get your API key from Google AI Studio',
        OPENAI: 'Get your API key from OpenAI Platform',
        CLAUDE: 'Get your API key from Anthropic Console',
      };

      return {
        name: providerData.name,
        description: providerData.description,
        apiKeyHelp: apiKeyHelp[provider] || "Get your API key from the provider's platform",
        defaultModel: modelData?.defaultModel || providerData.defaultModel,
        models: modelData?.models || providerData.supportedModels || [],
        icon: icons[provider] || '🤖',
      };
    }

    // Fallback for when data is loading
    return {
      name: provider,
      description: 'Loading...',
      apiKeyHelp: "Get your API key from the provider's platform",
      defaultModel: '',
      models: [],
      icon: '🤖',
    };
  };

  const providerInfo = getProviderInfo(selectedProvider);

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Settings</h1>
          <p className="text-muted-foreground">
            Configure your AI provider and API settings for story generation
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading AI providers...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI provider and API settings for story generation
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Current AI Configuration
          </CardTitle>
          <CardDescription>Your current AI provider and story generation settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">AI Provider</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  {getProviderInfo(user?.aiProvider || 'GEMINI').icon}
                  {getProviderInfo(user?.aiProvider || 'GEMINI').name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Story Theme</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {user?.selectedTheme || 'FANTASY'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">API Key Status</Label>
                <p
                  className={`text-lg font-semibold flex items-center gap-2 ${
                    user?.hasApiKey ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <Key className="h-4 w-4" />
                  {user?.hasApiKey ? 'Configured' : 'Not Set'}
                </p>
                {user?.hasApiKey && user?.apiKeyPreview && (
                  <p className="text-sm text-muted-foreground mt-1">{user.apiKeyPreview}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Model</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {user?.aiModel || 'Default'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configure AI Settings</CardTitle>
          <CardDescription>Update your AI provider, API key, and model preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            {/* AI Provider Selection */}
            <div className="space-y-3">
              <Label htmlFor="aiProvider">AI Provider</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {providers.map((provider) => (
                  <label
                    key={provider.provider}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProvider === provider.provider
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={provider.provider}
                      {...register('aiProvider')}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getProviderInfo(provider.provider).icon}</span>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.aiProvider && (
                <p className="text-sm text-red-600">{errors.aiProvider.message}</p>
              )}
            </div>

            {/* API Key */}
            <div className="space-y-3">
              <Label htmlFor="aiApiKey">API Key</Label>
              {user?.hasApiKey && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">API Key is configured</p>
                      <p className="text-sm text-green-600">{user.apiKeyPreview}</p>
                    </div>
                    <div className="text-green-600">
                      <Key className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              )}
              <div className="relative">
                <Input
                  id="aiApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={
                    user?.hasApiKey
                      ? `Enter new ${providerInfo.name} API key to update`
                      : `Enter your ${providerInfo.name} API key`
                  }
                  {...register('aiApiKey')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.hasApiKey
                  ? `Leave empty to keep current API key. ${providerInfo.apiKeyHelp}`
                  : providerInfo.apiKeyHelp}
              </p>
              {errors.aiApiKey && <p className="text-sm text-red-600">{errors.aiApiKey.message}</p>}
            </div>

            {/* AI Model Selection */}
            <div className="space-y-3">
              <Label htmlFor="aiModel">AI Model (Optional)</Label>
              <select
                id="aiModel"
                {...register('aiModel')}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Use default model ({providerInfo.defaultModel})</option>
                {providerInfo.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Leave empty to use the default model for {providerInfo.name}
              </p>
            </div>

            {/* Story Theme Settings */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Story Theme Preference</CardTitle>
                <CardDescription>
                  This affects how your AI generates stories from calendar events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Current theme: <strong>{user?.selectedTheme || 'FANTASY'}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  To change your story theme, visit your profile settings.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <a href="/profile">Update Story Theme</a>
                </Button>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Updating...' : 'Update AI Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* API Key Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            Your API key is encrypted and stored securely. We never log or share your API keys. Make
            sure to use API keys with appropriate usage limits and monitor your provider's billing
            dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

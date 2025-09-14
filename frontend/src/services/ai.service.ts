import api from '@/lib/api';

export interface AIProvider {
  provider: string;
  name: string;
  description: string;
  defaultModel: string;
  supportedModels: string[];
  maxTokens: number;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  reliability: 'high' | 'medium' | 'low';
  setupComplexity: 'easy' | 'medium' | 'hard';
  features: string[];
}

export interface AIModels {
  models: string[];
  defaultModel: string;
}

export interface APIKeyValidationResult {
  isValid: boolean;
  provider: string;
  supportedModels: string[];
  defaultModel: string;
  error?: string;
  testResponse?: {
    success: boolean;
    latencyMs: number;
    model: string;
  };
}

export interface AITestResult {
  success: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  testStory?: string;
  error?: string;
}

export interface AIStats {
  totalGenerations: number;
  totalTokensUsed: number;
  averageTokensPerGeneration: number;
  byProvider: Record<string, { count: number; tokens: number }>;
  byTheme: Record<string, { count: number; tokens: number }>;
  successRate: number;
  lastGeneration?: string;
}

export const aiService = {
  // Get all AI providers
  async getProviders() {
    console.log('🔄 aiService.getProviders() called');
    try {
      const response = await api.get('/ai/providers');
      console.log('✅ Providers API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Providers API error:', error);
      throw error;
    }
  },

  // Get all models for all providers
  async getAllModels() {
    console.log('🔄 aiService.getAllModels() called');
    try {
      const response = await api.get('/ai/models');
      console.log('✅ Models API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Models API error:', error);
      throw error;
    }
  },

  // Get models for specific provider
  async getProviderModels(provider: string) {
    const response = await api.get(`/ai/models/${provider}`);
    return response;
  },

  // Get user's AI configuration
  async getUserConfig() {
    const response = await api.get('/ai/config');
    return response;
  },

  // Update user's AI settings
  async updateSettings(settings: { aiProvider?: string; aiApiKey?: string; aiModel?: string }) {
    const response = await api.put('/ai/config', settings);
    return response;
  },

  // Validate API key
  async validateApiKey(provider: string, apiKey: string, model?: string) {
    const response = await api.post('/ai/validate-key', {
      provider,
      apiKey,
      model,
    });
    return response;
  },

  // Test user's AI setup
  async testSetup() {
    const response = await api.post('/ai/test');
    return response;
  },

  // Get AI usage statistics
  async getStats() {
    const response = await api.get('/ai/stats');
    return response;
  },

  // Get provider recommendation
  async getRecommendation() {
    const response = await api.get('/ai/recommendation');
    return response;
  },

  // Generate storyline for event
  async generateStoryline(
    eventId: string,
    options?: {
      theme?: string;
      forceRegenerate?: boolean;
      includeContext?: boolean;
    }
  ) {
    // 🔧 BACKEND INTEGRATION: Use calendar API for storyline generation
    const response = await api.post(`/calendar/events/${eventId}/storyline`, options);
    return response;
  },

  // Generate multiple storylines
  async generateMultiple(
    eventIds: string[],
    options?: {
      theme?: string;
      forceRegenerate?: boolean;
      includeContext?: boolean;
    }
  ) {
    const response = await api.post('/ai/generate-multiple', {
      eventIds,
      ...options,
    });
    return response;
  },

  // Generate all user storylines
  async generateAll(options?: { forceRegenerate?: boolean; includeContext?: boolean }) {
    const response = await api.post('/ai/generate-all', options);
    return response;
  },

  // Clear user's AI configuration
  async clearConfig() {
    const response = await api.delete('/ai/config');
    return response;
  },
};

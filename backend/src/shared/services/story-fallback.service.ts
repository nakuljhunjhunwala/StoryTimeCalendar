/**
 * Story Fallback Service - Comprehensive fallback and error handling
 */

import { AIProvider, Event, Theme } from '@prisma/client';
import { StoryPromptService } from './story-prompt.service';
import { AIErrorType } from '@/shared/types/ai.types';

export interface FallbackConfig {
  enableSmartFallbacks: boolean;
  useTemplateVariations: boolean;
  includeEventDetails: boolean;
  maxFallbackAttempts: number;
}

export interface FallbackResult {
  storyText: string;
  emoji: string;
  plainText: string;
  fallbackLevel: 'template' | 'simple' | 'basic';
  confidence: number;
}

export class StoryFallbackService {
  private static readonly DEFAULT_CONFIG: FallbackConfig = {
    enableSmartFallbacks: true,
    useTemplateVariations: true,
    includeEventDetails: true,
    maxFallbackAttempts: 3,
  };

  /**
   * Generate fallback storyline with multiple levels of sophistication
   */
  static generateFallbackStory(
    event: Event,
    theme: Theme,
    errorType?: AIErrorType,
    config: Partial<FallbackConfig> = {},
  ): FallbackResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Try different fallback levels based on error type and config
    for (
      let attempt = 0;
      attempt < finalConfig.maxFallbackAttempts;
      attempt++
    ) {
      try {
        if (attempt === 0 && finalConfig.enableSmartFallbacks) {
          // Level 1: Smart template-based fallback
          const templateResult = this.generateTemplateFallback(
            event,
            theme,
            finalConfig,
          );
          if (templateResult)
            return {
              ...templateResult,
              fallbackLevel: 'template',
              confidence: 0.8,
            };
        }

        if (attempt === 1 && finalConfig.useTemplateVariations) {
          // Level 2: Simple variation fallback
          const simpleResult = this.generateSimpleFallback(
            event,
            theme,
            finalConfig,
          );
          if (simpleResult)
            return {
              ...simpleResult,
              fallbackLevel: 'simple',
              confidence: 0.6,
            };
        }

        // Level 3: Basic guaranteed fallback
        const basicResult = this.generateBasicFallback(event, theme);
        return { ...basicResult, fallbackLevel: 'basic', confidence: 0.4 };
      } catch (error) {
        console.warn(`Fallback attempt ${attempt + 1} failed:`, error);
        continue;
      }
    }

    // Ultimate fallback - this should never fail
    return this.generateUltimateFallback(event, theme);
  }

  /**
   * Level 1: Smart template-based fallback with event analysis
   */
  private static generateTemplateFallback(
    event: Event,
    theme: Theme,
    config: FallbackConfig,
  ): FallbackResult | null {
    try {
      const eventAnalysis = this.analyzeEvent(event);
      const themeConfig = StoryPromptService.getThemeConfig(theme);
      const timeContext = this.getTimeContext(event.startTime);

      const templates = this.getSmartTemplates(
        theme,
        eventAnalysis.type,
        timeContext,
      );
      const selectedTemplate =
        templates[Math.floor(Math.random() * templates.length)];

      const variables = this.extractTemplateVariables(
        event,
        eventAnalysis,
        config,
      );
      const storyText = this.fillTemplate(selectedTemplate.template, variables);

      return {
        storyText,
        emoji: selectedTemplate.emoji || themeConfig.emojis[0],
        plainText: this.generatePlainText(event),
        fallbackLevel: 'template' as const,
        confidence: 0.8,
      };
    } catch (error) {
      console.warn('Template fallback failed:', error);
      return null;
    }
  }

  /**
   * Level 2: Simple variation fallback
   */
  private static generateSimpleFallback(
    event: Event,
    theme: Theme,
    config: FallbackConfig,
  ): FallbackResult | null {
    try {
      const themeConfig = StoryPromptService.getThemeConfig(theme);
      const emoji =
        themeConfig.emojis[
          Math.floor(Math.random() * themeConfig.emojis.length)
        ];
      const timeStr = this.formatTime(event.startTime);

      const templates = this.getSimpleTemplates(theme);
      const template = templates[Math.floor(Math.random() * templates.length)];

      const storyText = template
        .replace('{emoji}', emoji)
        .replace('{title}', event.title)
        .replace('{time}', timeStr)
        .replace('{location}', event.location || 'the gathering place');

      return {
        storyText,
        emoji,
        plainText: this.generatePlainText(event),
        fallbackLevel: 'simple' as const,
        confidence: 0.6,
      };
    } catch (error) {
      console.warn('Simple fallback failed:', error);
      return null;
    }
  }

  /**
   * Level 3: Basic guaranteed fallback
   */
  private static generateBasicFallback(
    event: Event,
    theme: Theme,
  ): FallbackResult {
    const themeConfig = StoryPromptService.getThemeConfig(theme);
    const emoji = themeConfig.emojis[0];
    const timeStr = this.formatTime(event.startTime);

    const basicTemplates = {
      [Theme.FANTASY]: `${emoji} The fellowship gathers for "{title}" at {time}. A quest awaits!`,
      [Theme.GENZ]: `${emoji} "{title}" at {time} bestie! Time to slay, no cap!`,
      [Theme.MEME]: `${emoji} "{title}" at {time}... this is fine, everything is fine ${emoji}`,
    };

    const storyText = basicTemplates[theme]
      .replace('{title}', event.title)
      .replace('{time}', timeStr);

    return {
      storyText,
      emoji,
      plainText: this.generatePlainText(event),
      fallbackLevel: 'basic' as const,
      confidence: 0.4,
    };
  }

  /**
   * Ultimate fallback - guaranteed to work
   */
  private static generateUltimateFallback(
    event: Event,
    theme: Theme,
  ): FallbackResult {
    const timeStr = event.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      storyText: `📅 ${event.title} at ${timeStr}`,
      emoji: '📅',
      plainText: `${event.title} at ${timeStr}`,
      fallbackLevel: 'basic',
      confidence: 0.2,
    };
  }

  /**
   * Analyze event to determine type and characteristics
   */
  private static analyzeEvent(event: Event): {
    type:
      | 'meeting'
      | 'call'
      | 'workshop'
      | 'interview'
      | 'presentation'
      | 'social'
      | 'other';
    formality: 'formal' | 'casual' | 'mixed';
    size: 'small' | 'medium' | 'large';
    duration: 'short' | 'medium' | 'long';
  } {
    const title = event.title.toLowerCase();
    const description = event.description?.toLowerCase() || '';
    const durationMinutes =
      (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);

    // Determine event type
    let type:
      | 'meeting'
      | 'call'
      | 'workshop'
      | 'interview'
      | 'presentation'
      | 'social'
      | 'other' = 'other';

    if (
      title.includes('standup') ||
      title.includes('daily') ||
      title.includes('scrum')
    ) {
      type = 'meeting';
    } else if (title.includes('call') || title.includes('phone')) {
      type = 'call';
    } else if (title.includes('workshop') || title.includes('training')) {
      type = 'workshop';
    } else if (title.includes('interview')) {
      type = 'interview';
    } else if (title.includes('demo') || title.includes('presentation')) {
      type = 'presentation';
    } else if (
      title.includes('lunch') ||
      title.includes('coffee') ||
      title.includes('social')
    ) {
      type = 'social';
    } else if (title.includes('meeting') || title.includes('sync')) {
      type = 'meeting';
    }

    // Determine formality
    const formality =
      title.includes('board') ||
      title.includes('executive') ||
      title.includes('client')
        ? 'formal'
        : 'casual';

    // Determine size
    const size = !event.attendeeCount
      ? 'small'
      : event.attendeeCount <= 3
        ? 'small'
        : event.attendeeCount <= 10
          ? 'medium'
          : 'large';

    // Determine duration
    const duration =
      durationMinutes <= 30
        ? 'short'
        : durationMinutes <= 90
          ? 'medium'
          : 'long';

    return { type, formality, size, duration };
  }

  /**
   * Get smart templates based on theme and event analysis
   */
  private static getSmartTemplates(
    theme: Theme,
    eventType: string,
    timeContext: string,
  ): Array<{ template: string; emoji: string }> {
    const templates = {
      [Theme.FANTASY]: {
        meeting: [
          `{emoji} The council of {title} convenes at {time}! Rally the fellowship for this {timeContext} gathering.`,
          `{emoji} Hear ye! The {title} assembly begins at {time}. Bring thy scrolls and wisdom to this {timeContext} conclave.`,
          `{emoji} The knights gather for {title} at {time}. A quest of great importance awaits in this {timeContext} hour!`,
        ],
        call: [
          `{emoji} The crystal ball summons all for {title} at {time}! Answer the mystical call in this {timeContext} moment.`,
          `{emoji} Hark! The enchanted horn calls for {title} at {time}. Join this {timeContext} gathering of voices!`,
        ],
        presentation: [
          `{emoji} Behold! The grand {title} spectacle begins at {time}. Witness this {timeContext} display of knowledge!`,
          `{emoji} The scroll of {title} shall be unveiled at {time}. All shall gather for this {timeContext} revelation!`,
        ],
      },
      [Theme.GENZ]: {
        meeting: [
          `{emoji} {title} at {time} bestie! Time to gather the squad for this {timeContext} vibe check, no cap!`,
          `{emoji} "{title}" hits different at {time} fr fr! Everyone pull up for this {timeContext} energy 💯`,
          `{emoji} Squad assemble! {title} at {time} is about to be fire 🔥 This {timeContext} meeting bout to slay!`,
        ],
        call: [
          `{emoji} Ring ring! {title} calling at {time} bestie! Time to hop on this {timeContext} chat and spill the tea ☕`,
          `{emoji} Phone check! {title} at {time} is gonna hit different! Join this {timeContext} conversation, periodt!`,
        ],
        presentation: [
          `{emoji} Main character energy! {title} presentation at {time} is about to serve looks 💅 This {timeContext} show bout to be iconic!`,
          `{emoji} Y'all ready for {title} at {time}? This {timeContext} presentation about to understood the assignment fr!`,
        ],
      },
      [Theme.MEME]: {
        meeting: [
          `{emoji} {title} at {time}... this is fine, everything is fine {emoji} *nervous {timeContext} meeting noises*`,
          `{emoji} *narrator voice: they were not prepared for {title} at {time}* Plot twist: it's a {timeContext} meeting!`,
          `{emoji} Achievement unlocked: Survived another {title} at {time}! Level up your {timeContext} meeting game 🎮`,
        ],
        call: [
          `{emoji} *connection loading...* {title} at {time} buffering... Please wait for this {timeContext} audio experience 📞`,
          `{emoji} Error 404: Productivity not found during {title} at {time}. This {timeContext} call brought to you by chaos!`,
        ],
        presentation: [
          `{emoji} *PowerPoint has entered the chat* {title} at {time} serving slides and vibes! This {timeContext} show bout to be legendary 📊`,
          `{emoji} Plot armor activated! {title} presentation at {time} - will they survive this {timeContext} performance? Find out next!`,
        ],
      },
    };

    const themeTemplates = templates[theme];
    const eventTemplates =
      (themeTemplates as any)[eventType] || themeTemplates.meeting;

    return eventTemplates.map((template: string) => ({
      template,
      emoji: '{emoji}',
    }));
  }

  /**
   * Get simple templates for basic fallback
   */
  private static getSimpleTemplates(theme: Theme): string[] {
    return {
      [Theme.FANTASY]: [
        `{emoji} The {title} quest begins at {time}! Gather at {location} for this noble endeavor.`,
        `{emoji} Heed the call! {title} awaits at {time}. Journey to {location} brave ones!`,
        `{emoji} {title} summons all at {time}. The fellowship shall meet at {location}!`,
      ],
      [Theme.GENZ]: [
        `{emoji} {title} at {time} is gonna be fire! Meet us at {location} bestie 🔥`,
        `{emoji} Pull up to {title} at {time}! We're meeting at {location}, no cap!`,
        `{emoji} {title} vibes at {time}! See y'all at {location}, this bout to slap!`,
      ],
      [Theme.MEME]: [
        `{emoji} {title} at {time}... *chuckles* I'm in danger 😅 Location: {location}`,
        `{emoji} Plot twist: {title} at {time} actually matters! See you at {location}`,
        `{emoji} *boss music starts* {title} final boss battle at {time}! Arena: {location}`,
      ],
    }[theme];
  }

  /**
   * Extract variables for template filling
   */
  private static extractTemplateVariables(
    event: Event,
    analysis: any,
    config: FallbackConfig,
  ): Record<string, string> {
    return {
      title: event.title,
      time: this.formatTime(event.startTime),
      location: event.location || 'the gathering place',
      attendeeCount: event.attendeeCount?.toString() || 'the team',
      duration: this.formatDuration(event.startTime, event.endTime),
      timeContext: this.getTimeContext(event.startTime),
      eventType: analysis.type,
      formality: analysis.formality,
    };
  }

  /**
   * Fill template with variables
   */
  private static fillTemplate(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return result;
  }

  /**
   * Format time for display
   */
  private static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format duration
   */
  private static formatDuration(start: Date, end: Date): string {
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (minutes < 60) return `${Math.round(minutes)}min`;

    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }

  /**
   * Get time context
   */
  private static getTimeContext(date: Date): string {
    const hour = date.getHours();

    if (hour < 9) return 'early morning';
    if (hour < 12) return 'morning';
    if (hour < 14) return 'midday';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'late evening';
  }

  /**
   * Generate plain text version
   */
  private static generatePlainText(event: Event): string {
    const timeStr = this.formatTime(event.startTime);
    return `${event.title} at ${timeStr}`;
  }

  /**
   * Handle specific AI error types with appropriate fallbacks
   */
  static handleAIError(
    error: AIErrorType,
    event: Event,
    theme: Theme,
    provider: AIProvider,
  ): FallbackResult {
    const errorContext = this.getErrorContext(error, provider);

    // Adjust fallback strategy based on error type
    const config: Partial<FallbackConfig> = {
      enableSmartFallbacks: error !== AIErrorType.QUOTA_EXCEEDED, // Use simpler fallbacks for quota issues
      useTemplateVariations: error !== AIErrorType.NETWORK_ERROR, // Skip variations for network issues
      includeEventDetails: true,
      maxFallbackAttempts: error === AIErrorType.RATE_LIMIT_EXCEEDED ? 1 : 3, // Fewer attempts for rate limits
    };

    const result = this.generateFallbackStory(event, theme, error, config);

    // Add error context to the result if needed
    if (errorContext && result.confidence > 0.5) {
      result.storyText = this.addErrorContext(
        result.storyText,
        errorContext,
        theme,
      );
    }

    return result;
  }

  /**
   * Get context message for specific errors
   */
  private static getErrorContext(
    error: AIErrorType,
    provider: AIProvider,
  ): string | null {
    switch (error) {
      case AIErrorType.QUOTA_EXCEEDED:
        return `(${provider} quota exceeded - using backup story engine)`;
      case AIErrorType.RATE_LIMIT_EXCEEDED:
        return `(${provider} busy - backup story ready!)`;
      case AIErrorType.NETWORK_ERROR:
        return `(Connection hiccup - local story engine activated)`;
      default:
        return null;
    }
  }

  /**
   * Add error context to story based on theme
   */
  private static addErrorContext(
    storyText: string,
    context: string,
    theme: Theme,
  ): string {
    const themeContext = {
      [Theme.FANTASY]: context.replace(
        /\(([^)]+)\)/,
        '(The magical scribes are resting - $1)',
      ),
      [Theme.GENZ]: context.replace(/\(([^)]+)\)/, '(AI said "brb" - $1)'),
      [Theme.MEME]: context.replace(
        /\(([^)]+)\)/,
        '(*AI has left the chat* - $1)',
      ),
    };

    return `${storyText} ${themeContext[theme] || context}`;
  }
}

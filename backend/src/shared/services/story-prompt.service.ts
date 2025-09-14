/**
 * Story Prompt Service - Advanced theme-specific prompt engineering
 */

import { Theme } from '@prisma/client';
import {
  AIStoryResponse,
  StoryContext,
  ThemeConfig,
} from '@/shared/types/ai.types';

export class StoryPromptService {
  private static readonly THEME_CONFIGS: Record<Theme, ThemeConfig> = {
    [Theme.FANTASY]: {
      theme: Theme.FANTASY,
      description:
        'Epic fantasy adventures with rich medieval storytelling, magical elements, and heroic narratives',
      keywords: [
        'fellowship',
        'council of legends',
        'sacred quest',
        'legendary battle',
        'mystical alliance',
        'ancient guild',
        'enchanted realm',
        'kingdom of dreams',
        'mystical tavern',
        'sacred monastery',
        'castle of wonders',
        'magical forge',
        'sacred covenant',
        'ancient prophecy',
        'forbidden scrolls',
        'chosen champion',
        'noble warrior',
        'wise sage',
        'arcane wizard',
        'valiant knight',
        'divine guardian',
        'royal herald',
        'mystical oracle',
        'sacred ritual',
        'legendary artifact',
        'enchanted portal',
        'crystal of power',
        'tome of secrets',
        'blade of destiny',
      ],
      emojis: [
        '⚔️',
        '🏰',
        '🛡️',
        '👑',
        '🧙‍♂️',
        '🧙‍♀️',
        '📜',
        '🗡️',
        '🏹',
        '⚡',
        '✨',
        '🔮',
        '🏺',
        '🗿',
        '🐉',
        '🦄',
        '🧝‍♂️',
        '🧝‍♀️',
        '⭐',
        '🌟',
      ],
      toneDescription:
        'Epic, noble, magical and immersive with rich medieval fantasy language that makes mundane events feel like legendary adventures',
      examples: [
        {
          input: 'Budget Planning Meeting - 3:00 PM',
          output: {
            story_text:
              '👑 Hail, Noble Champion! At the 3rd hour past midday, you shall lead the Ancient Council of Treasury Guardians in their sacred quest! Your wisdom and valor are needed as the fellowship gathers to divine the mystical allocation of golden coffers - may your strategic mind guide this legendary conclave to glory!',
            emoji: '👑',
            plain_text: 'Budget Planning Meeting at 3:00 PM',
          },
        },
      ],
    },
    [Theme.GENZ]: {
      theme: Theme.GENZ,
      description:
        'Ultra-modern Gen Z energy with authentic slang, social media vibes, and relatable cultural references',
      keywords: [
        'bestie',
        'no cap',
        'fr fr',
        'periodt',
        'slay queen',
        'main character energy',
        'understood the assignment',
        'living rent free',
        'its giving',
        'chef kiss',
        'hits different',
        'absolutely sending me',
        'bussin respectfully',
        'caught in 4K',
        'this aint it chief',
        'say less',
        'big mood',
        'we stan',
        'valid king/queen',
        'thats on periodt',
        'lowkey highkey',
        'spill the tea sis',
        'touch grass energy',
        'tell me without telling me',
        'the way i RAN here',
        'not me thinking',
        'pov you are',
        'this is why we cant have nice things',
        'sorry not sorry',
        'iykyk energy',
        'alexa play',
        'spotify wrapped vibes',
        'certified banger',
        'dripping in finesse',
        'manifest this energy',
      ],
      emojis: [
        '💯',
        '💸',
        '🔥',
        '✨',
        '💅',
        '👑',
        '💕',
        '🙌',
        '😭',
        '💀',
        '🤌',
        '🚫🧢',
        '👀',
        '🫶',
        '💫',
        '🌟',
        '😌',
        '🥺',
        '😩',
        '🤳',
      ],
      toneDescription:
        'Authentic Gen Z energy with internet culture, trending slang, and social media references that make events feel like the main character moment',
      examples: [
        {
          input: 'Budget Planning Meeting - 3:00 PM',
          output: {
            story_text:
              '💀 Bestie, you\'re about to absolutely SLAY this 3PM budget meeting! POV: You walking into that room like the main character you are, ready to serve financial wisdom while 35 other legends witness your iconic moment 🔥 This is giving "I understood the assignment" energy and we are HERE for it king/queen!',
            emoji: '💀',
            plain_text: 'Budget Planning Meeting at 3:00 PM',
          },
        },
      ],
    },
    [Theme.MEME]: {
      theme: Theme.MEME,
      description:
        'Peak internet culture with viral meme references, relatable chaos, and perfectly-timed internet humor',
      keywords: [
        'this is fine meme energy',
        '*narrator voice*',
        'plot twist nobody asked for',
        'character development arc',
        'main character syndrome',
        'NPC behavior detected',
        'life is a simulation',
        'side quest activated',
        'achievement unlocked',
        'respawn in 3...2...1',
        'loading screen of life',
        'error 404 motivation not found',
        'ctrl+z this situation',
        'delete from existence',
        'system requires reboot',
        'buffering life choices',
        'connection to reality lost',
        'low battery anxiety',
        'airplane mode activated',
        'do not disturb vibes',
        'touching grass is required',
        'the audacity energy',
        'sir this is a wendys',
        'mom come pick me up',
        'thats not how this works',
        'the lion the witch',
        'i am once again asking',
        'stonks only go up',
        'time to yeet myself',
        'big oof energy',
        'uno reverse card',
        'no thoughts head empty',
        'brain.exe has stopped',
        'social anxiety has entered chat',
        'anxiety go brrr',
      ],
      emojis: [
        '🔥',
        '😅',
        '💀',
        '🤡',
        '👀',
        '🙃',
        '😬',
        '🤷‍♂️',
        '🤷‍♀️',
        '🎭',
        '📱',
        '💻',
        '🚨',
        '🤯',
        '😭',
        '🥲',
        '😵‍💫',
        '🫠',
        '🤠',
        '🗿',
      ],
      toneDescription:
        'Peak internet humor with viral meme references, relatable anxiety, and that perfect chaotic energy that makes everything hilariously relatable',
      examples: [
        {
          input: 'Budget Planning Meeting - 3:00 PM',
          output: {
            story_text:
              "🔥 Chosen One, your 3PM budget meeting awaits... this is fine, everything is fine 🔥 *narrator voice: Our hero was absolutely NOT prepared for this level of financial reality* You're about to lead 35 fellow humans into the sacred arena where Excel spreadsheets reveal their deepest secrets. Achievement unlocked: Adult Responsibilities Boss Battle! 💀",
            emoji: '🔥',
            plain_text: 'Budget Planning Meeting at 3:00 PM',
          },
        },
      ],
    },
  };

  /**
   * Generate comprehensive prompt for story generation
   */
  static generatePrompt(context: StoryContext): string {
    const themeConfig = this.THEME_CONFIGS[context.theme];

    // Build context-aware prompt with past story integration
    const basePrompt = this.buildBasePrompt(context, themeConfig);
    const contextualPrompt = this.addContextualElements(
      basePrompt,
      context,
      themeConfig,
    );
    const finalPrompt = this.addResponseFormat(contextualPrompt);

    return finalPrompt;
  }

  /**
   * Build base prompt with event details
   */
  private static buildBasePrompt(
    context: StoryContext,
    themeConfig: ThemeConfig,
  ): string {
    const timeStr = this.formatEventTime(
      context.startTime,
      context.endTime,
      context.userTimezone,
    );
    const durationStr = this.calculateDuration(
      context.startTime,
      context.endTime,
    );

    // Get personalized user persona based on their actual info
    const userPersona = this.getUserPersona(themeConfig.theme, context);

    const ageContext = context.userAge ? ` (Age: ${context.userAge})` : '';
    const genderContext = context.userGender
      ? ` (Gender: ${context.userGender})`
      : '';

    const prompt = `Transform "${context.eventTitle}" (${timeStr}${context.attendeeCount ? `, ${context.attendeeCount} people` : ''}${context.location ? `, ${context.location}` : ''}) into ${themeConfig.theme} story starring the user.

USER: Address as "${userPersona}"${genderContext}${ageContext} - make them the main character
STYLE: ${themeConfig.toneDescription.split(' ').slice(0, 8).join(' ')}
KEYWORDS: ${themeConfig.keywords.slice(0, 8).join(', ')}

RULES:
1. Make USER the hero/protagonist of this event
2. Use theme-specific greeting/address for personal connection  
3. Respect user's gender and age in language/slang choices
4. Transform event details into epic story elements
5. Keep critical info (time/location) recognizable but themed
6. 2-3 sentences, complete adventure with user as star

EXAMPLE: "${themeConfig.examples[0].output.story_text}"`;

    return prompt;
  }

  /**
   * Get personalized user persona based on theme and actual user data
   */
  private static getUserPersona(theme: string, context: StoryContext): string {
    const { userGender } = context;
    const { userAge } = context;

    // Get age-appropriate and gender-appropriate personas
    const personas = this.getPersonasForTheme(
      theme.toUpperCase(),
      userGender,
      userAge,
    );
    return personas[Math.floor(Math.random() * personas.length)];
  }

  /**
   * Get gender and age-appropriate personas for each theme
   */
  private static getPersonasForTheme(
    theme: string,
    gender?: string,
    age?: number,
  ): string[] {
    const isYoung = age && age < 25;
    const isMature = age && age >= 40;

    switch (theme) {
      case 'FANTASY':
        const fantasyBase = [
          'Noble Adventurer',
          'Master of Time',
          'Champion of the Realm',
        ];
        if (gender === 'MALE') {
          return [
            ...fantasyBase,
            'Lord of Schedules',
            'Sir Hero',
            'Knight Commander',
            'Brave Warrior',
          ];
        } else if (gender === 'FEMALE') {
          return [
            ...fantasyBase,
            'Lady of Schedules',
            'Dame Hero',
            'Warrior Princess',
            'Noble Maiden',
          ];
        } else if (gender === 'NON_BINARY') {
          return [
            ...fantasyBase,
            'Noble of Schedules',
            'Legendary Champion',
            'Sage Warrior',
            'Mystic Guardian',
          ];
        }
        return [...fantasyBase, 'Hero of Seven Kingdoms', 'Legendary Champion'];

      case 'GENZ':
        const genzBase = [
          'Main Character',
          'Icon',
          'Bestie',
          'Legend',
          'Absolute Unit',
        ];
        if (gender === 'MALE') {
          return [
            ...genzBase,
            'King',
            'Boss',
            'Sigma King',
            'Based King',
            'The GOAT',
            'Big Boss Energy',
          ];
        } else if (gender === 'FEMALE') {
          return [
            ...genzBase,
            'Queen',
            'Goddess',
            'Baddie',
            'Boss Babe',
            'Iconic Queen',
            'Queen Energy',
          ];
        } else if (gender === 'NON_BINARY') {
          return [
            ...genzBase,
            'Monarch',
            'Supreme Ruler',
            'Royal Highness',
            'Ultimate Being',
            'Legendary Icon',
          ];
        }
        return [
          ...genzBase,
          'Legend',
          'Icon',
          'Supreme Being',
          'The Main Character',
        ];

      case 'MEME':
        const memeBase = [
          'Fellow Human',
          'Chosen One',
          'Based Individual',
          'Legendary Being',
        ];
        let agePersonas = [];

        if (isYoung) {
          agePersonas = [
            'Zoomer Legend',
            'Digital Native',
            'TikTok Main Character',
          ];
          if (gender === 'MALE')
            agePersonas.push('Meme Lord', 'Sigma Grindset King');
          else if (gender === 'FEMALE')
            agePersonas.push('Meme Queen', 'Girl Boss Energy');
          else agePersonas.push('Meme Royalty', 'Internet Legend');
        } else if (isMature) {
          agePersonas = [
            'Wise Meme Sage',
            'Elder Millennial',
            'Veteran Internet User',
          ];
        } else {
          agePersonas = ['Ultimate Protagonist', 'Meme Master'];
        }

        return [...memeBase, ...agePersonas];

      case 'PROFESSIONAL':
        const professionalBase = ['Distinguished Leader', 'Strategic Mind'];
        if (isMature) {
          return [
            ...professionalBase,
            'Executive Champion',
            'Senior Leader',
            'Seasoned Professional',
          ];
        }
        return [
          ...professionalBase,
          'Rising Star',
          'Dynamic Professional',
          'Accomplished Leader',
        ];

      default:
        return [
          'Calendar Champion',
          'Schedule Master',
          'Time Wizard',
          'Productivity Hero',
        ];
    }
  }

  /**
   * Add contextual elements based on user profile and past stories
   */
  private static addContextualElements(
    basePrompt: string,
    context: StoryContext,
    themeConfig: ThemeConfig,
  ): string {
    // Keep it super minimal to save tokens
    return basePrompt;
  }

  /**
   * Add strict JSON response format requirements
   */
  private static addResponseFormat(prompt: string): string {
    return `${prompt}

Return JSON only:
{"story_text": "Address user with their persona! Use gender/age-appropriate language! Epic themed story (2-3 sentences)", "emoji": "😀", "plain_text": "Professional version"}`;
  }

  /**
   * Get theme adjective for prompt
   */
  private static getThemeAdjective(prompt: string): string {
    if (prompt.includes('FANTASY')) return 'epic and noble';
    if (prompt.includes('GENZ')) return 'trendy and casual';
    if (prompt.includes('MEME')) return 'humorous and meme-referenced';
    return 'engaging';
  }

  /**
   * Format event time with timezone awareness
   */
  private static formatEventTime(
    startTime: Date,
    endTime: Date,
    timezone: string,
  ): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    };

    const startStr = startTime.toLocaleString('en-US', options);
    const endStr = endTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    });

    return `${startStr} - ${endStr}`;
  }

  /**
   * Calculate event duration
   */
  private static calculateDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0
        ? `${hours}h ${minutes}m`
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Infer meeting type from event details
   */
  private static inferMeetingType(context: StoryContext): string | null {
    const title = context.eventTitle.toLowerCase();
    const description = context.eventDescription?.toLowerCase() || '';

    if (title.includes('standup') || title.includes('daily'))
      return 'Daily standup';
    if (title.includes('retrospective') || title.includes('retro'))
      return 'Team retrospective';
    if (title.includes('planning') || title.includes('sprint'))
      return 'Planning session';
    if (title.includes('interview')) return 'Interview';
    if (title.includes('demo') || title.includes('presentation'))
      return 'Presentation/Demo';
    if (title.includes('1:1') || title.includes('one-on-one'))
      return 'One-on-one meeting';
    if (title.includes('review')) return 'Review meeting';
    if (title.includes('training') || title.includes('workshop'))
      return 'Training/Workshop';
    if (context.attendeeCount && context.attendeeCount > 10)
      return 'Large group meeting';
    if (context.attendeeCount && context.attendeeCount <= 3)
      return 'Small team meeting';

    return null;
  }

  /**
   * Get age group description
   */
  private static getAgeGroup(age: number): string {
    if (age < 25) return 'Young professional';
    if (age < 35) return 'Early career';
    if (age < 50) return 'Mid-career';
    return 'Senior professional';
  }

  /**
   * Get time of day context
   */
  private static getTimeContext(startTime: Date): string {
    const hour = startTime.getHours();

    if (hour < 6) return 'Very early morning';
    if (hour < 9) return 'Early morning';
    if (hour < 12) return 'Late morning';
    if (hour < 14) return 'Early afternoon';
    if (hour < 17) return 'Late afternoon';
    if (hour < 20) return 'Evening';
    return 'Late evening';
  }

  /**
   * Get seasonal context
   */
  private static getSeasonalContext(date: Date): string | null {
    const month = date.getMonth();
    const day = date.getDate();

    // Holiday seasons
    if (month === 11 && day > 20) return 'Holiday season';
    if (month === 0 && day < 7) return 'New Year period';
    if (month === 9 && day > 25) return 'Halloween season';

    // Regular seasons
    if (month >= 2 && month <= 4) return 'Spring season';
    if (month >= 5 && month <= 7) return 'Summer season';
    if (month >= 8 && month <= 10) return 'Fall season';
    if (month === 11 || month <= 1) return 'Winter season';

    return null;
  }

  /**
   * Get theme configuration
   */
  static getThemeConfig(theme: Theme): ThemeConfig {
    return this.THEME_CONFIGS[theme];
  }

  /**
   * Get all available themes with their configurations
   */
  static getAllThemeConfigs(): Record<Theme, ThemeConfig> {
    return { ...this.THEME_CONFIGS };
  }

  /**
   * Validate theme support
   */
  static isThemeSupported(theme: string): theme is Theme {
    return Object.values(Theme).includes(theme as Theme);
  }

  /**
   * Get example story for theme preview
   */
  static getThemeExample(
    theme: Theme,
    eventTitle: string = 'Team Meeting',
  ): AIStoryResponse {
    const config = this.THEME_CONFIGS[theme];

    // Generate example based on theme with user as protagonist
    switch (theme) {
      case Theme.FANTASY:
        return {
          story_text: `Hail, Noble Champion! Your ${eventTitle.toLowerCase()} quest awaits - lead your fellowship to forge new alliances and plan the next legendary adventure! May your wisdom guide this sacred gathering.`,
          emoji: '⚔️',
          plain_text: eventTitle,
        };

      case Theme.GENZ:
        return {
          story_text: `Bestie, you're about to absolutely SLAY this ${eventTitle}! Time to serve main character energy and show everyone how it's done, no cap. You understood the assignment before anyone else even read it fr fr king/queen 💯`,
          emoji: '💯',
          plain_text: eventTitle,
        };

      case Theme.MEME:
        return {
          story_text: `Chosen One, your ${eventTitle} awaits... this is fine, everything is fine 🔥 *narrator voice: Our hero was definitely not prepared but somehow always pulls through* Time for you to face the ultimate boss battle!`,
          emoji: '🔥',
          plain_text: eventTitle,
        };

      default:
        return config.examples[0].output;
    }
  }
}

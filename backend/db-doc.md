# StoryTime Calendar - Comprehensive Database Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Design Philosophy](#database-design-philosophy)
3. [Core Architecture](#core-architecture)
4. [Database Schema Deep Dive](#database-schema-deep-dive)
5. [Authentication System](#authentication-system)
6. [User Management](#user-management)
7. [Calendar Integration Framework](#calendar-integration-framework)
8. [Core Features & Workflows](#core-features--workflows)
9. [Notification Management System](#notification-management-system)
10. [AI Integration & Story Generation](#ai-integration--story-generation)
11. [Sync Management](#sync-management)
12. [API Design Considerations](#api-design-considerations)
13. [Scalability & Performance](#scalability--performance)
14. [Security Considerations](#security-considerations)

---

## System Overview

### Purpose

StoryTime Calendar is a productivity application that transforms mundane calendar events into engaging storylines and delivers them through various notification channels. The system is designed to make calendar reminders memorable, shareable, and fun while maintaining practical functionality.

### Core Design Principles

#### 1. Simplicity Over Complexity

- **Decision**: Plain text-based relationships instead of complex foreign key constraints
- **Rationale**: Easier to understand, debug, and maintain; reduces database coupling
- **Implementation**: String IDs for relationships, manual relationship management in application layer

#### 2. Provider Agnostic Architecture

- **Decision**: Generic provider fields support any calendar/AI/notification service
- **Rationale**: Future-proof design that can adapt to new services without schema changes
- **Implementation**: Enum-based provider types with flexible metadata storage

#### 3. Performance-First Design

- **Decision**: Strategic denormalization and caching patterns
- **Rationale**: AI generation and notification delivery require fast response times
- **Implementation**: Cached storylines, minimal data storage, optimized query patterns

#### 4. User-Controlled AI Integration

- **Decision**: Users provide their own AI API keys
- **Rationale**: Cost control, privacy, and flexibility in AI provider choice
- **Implementation**: Secure API key storage with user-managed quotas

---

## Database Design Philosophy

### Schema Organization Strategy

#### Entity Separation Logic

The database is organized into logical groups based on functionality and lifecycle:

**Core User Management** (Identity and preferences):

- `users` - Authentication and user preferences
- `notification_channels` - Multi-channel notification setup

**Calendar Integration Layer** (External system connections):

- `calendar_integrations` - OAuth connections to calendar providers
- `calendars` - Individual calendar instances
- `events` - Minimal event data for story generation

**AI & Content Generation** (Story creation and caching):

- `storylines` - AI-generated narrative content
- `notification_logs` - Delivery tracking and audit trails

**System Operations** (Infrastructure and monitoring):

- `sync_jobs` - Background process tracking

### Relationship Design Decisions

#### Why Plain Text Relationships?

**Traditional Foreign Key Approach**:

```sql
-- Complex with Prisma relations
User → CalendarIntegration → Calendar → Event → Storyline
```

**Our Plain Text Approach**:

```sql
-- Simple string references
storylines.eventId = events.id
events.calendarId = calendars.id
calendars.integrationId = calendar_integrations.id
```

**Decision Rationale**:

- **Simplicity**: No complex join syntax or relation management
- **Flexibility**: Easy to reference across services or microservices
- **Performance**: Manual optimization of queries based on actual usage patterns
- **Debugging**: Clear, explicit relationship handling in application code

#### Denormalization Strategies

**Where and Why We Denormalized**:

**1. Notification Delivery Data**:

```sql
NotificationLog {
  eventId: String,        -- Reference to event
  storylineId: String?,   -- Reference to storyline
  messageText: String     -- Full message stored for audit
}
```

**Rationale**: Notification logs need to preserve exact message content even if storylines are regenerated or events are updated.

**2. Event Synchronization Tracking**:

```sql
Event {
  lastUpdatedAt: DateTime,  -- Provider's last update time
  dataHash: String?         -- Quick change detection
}
```

**Rationale**: Efficient sync operations require fast change detection without complex comparisons.

---

## Core Architecture

### User-Centric Design

#### Single User Focus

Unlike multi-tenant systems, StoryTime Calendar is designed around individual users:

```sql
-- All data is owned by specific users
events.userId = users.id
storylines.userId = users.id
notification_channels.userId = users.id
```

**Benefits**:

- **Data Privacy**: Clear ownership and isolation
- **Performance**: Simplified queries without tenant scoping
- **User Control**: Users manage their own data and integrations

#### Personal AI Integration

Users bring their own AI providers:

```sql
User {
  aiApiKey: String?,      -- User's own API key
  aiProvider: AIProvider, -- Their chosen provider
  aiModel: String?        -- Specific model preference
}
```

**Rationale**:

- **Cost Control**: Users pay for their own AI usage
- **Privacy**: User data never leaves their control
- **Flexibility**: Users can choose premium or budget AI models

### Data Lifecycle Management

#### Story Generation Lifecycle

```
Event Created → Story Generated → Story Cached → Notification Scheduled → Delivered
```

#### Cache Management Strategy

```sql
Storyline {
  expiresAt: DateTime,    -- Automatic cache expiry
  isActive: Boolean       -- Manual cache invalidation
}
```

**Expiry Logic**:

- **2-day events**: Generate stories day before
- **Cache duration**: Stories valid until event passes
- **Regeneration**: Manual sync or cache expiry triggers new generation

---

## Database Schema Deep Dive

### Core Entities Detailed Analysis

#### User Entity - The Central Hub

```sql
model User {
  id: String @id @default(cuid())
  email: String @unique               -- Authentication identifier
  password: String                    -- Hashed authentication credential
  name: String?                       -- Display name for personalization
  age: Int?                          -- AI prompt personalization
  gender: Gender?                     -- AI prompt personalization
  aiApiKey: String?                   -- User's AI service key
  aiProvider: AIProvider @default(GEMINI) -- Preferred AI service
  selectedTheme: Theme @default(FANTASY)  -- Story generation style
  timezone: String @default("UTC")    -- Critical for event timing
  notificationMinutes: Int @default(15) -- Reminder timing preference
}
```

**Design Decisions Deep Dive**:

**Why Demographics Fields?**

- **Age**: Influences story complexity and references
- **Gender**: Enables pronoun-appropriate storylines
- **Usage**: "The fellowship awaits you, my lord" vs "The fellowship awaits you, my lady"

**Why User-Managed AI Keys?**

- **Privacy**: No intermediary access to user's AI interactions
- **Cost**: Users control their own AI spending
- **Quality**: Users can choose premium models for better stories

**Critical Field Analysis**:

- **timezone**: Essential for accurate notification delivery timing
- **notificationMinutes**: Personalized reminder preferences (5min vs 30min)
- **selectedTheme**: Default story style, can be overridden per event

#### NotificationChannel Entity - Multi-Modal Delivery

```sql
model NotificationChannel {
  id: String @id
  userId: String                      -- Owner reference
  type: String                        -- "slack", "email", "teams", "webhook"
  identifier: String                  -- Channel-specific address
  name: String?                       -- User-friendly label
  isActive: Boolean @default(true)    -- Enable/disable channel
  isPrimary: Boolean @default(false)  -- Default delivery channel
  metadata: Json?                     -- Provider-specific settings
}
```

**Channel Type Examples**:

**Slack Integration**:

```json
{
  "type": "slack",
  "identifier": "C1234567890",
  "name": "Work Slack #general",
  "metadata": {
    "team_id": "T987654321",
    "workspace": "Acme Corp",
    "bot_token": "xoxb-encrypted-token"
  }
}
```

**Email Channel**:

```json
{
  "type": "email",
  "identifier": "user@example.com",
  "name": "Personal Email",
  "metadata": null
}
```

**Webhook Integration**:

```json
{
  "type": "webhook",
  "identifier": "https://api.company.com/notifications",
  "name": "Company Dashboard",
  "metadata": {
    "auth_header": "Bearer token123",
    "format": "json"
  }
}
```

**Why This Design?**:

- **Extensibility**: Adding new notification types requires no schema changes
- **Rich Metadata**: JSON field accommodates provider-specific requirements
- **User Control**: Users can have multiple channels with different purposes

#### Calendar Integration Entity - Provider Management

```sql
model CalendarIntegration {
  id: String @id
  userId: String                      -- Owner reference
  provider: CalendarProvider          -- GOOGLE, MICROSOFT, etc.
  accessToken: String?                -- OAuth access token
  refreshToken: String?               -- OAuth refresh token
  tokenExpiry: DateTime?              -- Token expiration time
  status: IntegrationStatus           -- ACTIVE, ERROR, EXPIRED
  lastSyncAt: DateTime?               -- Last successful sync
}
```

**OAuth Token Management**:

- **accessToken**: Short-lived (1 hour) for API calls
- **refreshToken**: Long-lived (months) for token renewal
- **tokenExpiry**: Proactive refresh before expiration

**Status Management**:

- **ACTIVE**: Working integration, regular syncing
- **ERROR**: Temporary issue, retry logic applies
- **EXPIRED**: Token refresh failed, user intervention needed
- **INACTIVE**: User disabled, no syncing

**Multi-Provider Support**:

```javascript
// User can have multiple calendar providers simultaneously
const integrations = [
  { provider: "GOOGLE", status: "ACTIVE" }, // Personal Gmail
  { provider: "MICROSOFT", status: "ACTIVE" }, // Work Outlook
];
```

#### Event Entity - Minimal Event Storage

```sql
model Event {
  id: String @id
  userId: String                      -- Owner reference
  calendarId: String                  -- Calendar reference
  providerEventId: String             -- Provider's event ID
  title: String                       -- Event title for story generation
  description: String?                -- Additional context
  startTime: DateTime                 -- Critical for reminder timing
  endTime: DateTime                   -- Event duration
  location: String?                   -- Optional context for AI
  meetingLink: String?                -- Meeting access
  attendeeCount: Int?                 -- Just count, not details
  status: EventStatus                 -- ACTIVE, CANCELLED, RESCHEDULED
  dataHash: String?                   -- Change detection optimization
}
```

**Minimal Data Philosophy**:

**What We Store**:

- Essential reminder data: title, time, location
- Story generation context: description, attendee count
- Sync optimization: dataHash, lastUpdatedAt

**What We DON'T Store**:

- Full attendee details (privacy + performance)
- Complex recurrence rules (simplified handling)
- Extensive metadata (keep it lightweight)

**dataHash Usage**:

```javascript
// Efficient change detection
const newHash = md5(`${title}${startTime}${description}`);
if (newHash !== event.dataHash) {
  // Event changed, regenerate story
  await regenerateStoryline(event.id);
}
```

#### Storyline Entity - AI-Generated Content

```sql
model Storyline {
  id: String @id
  userId: String                      -- Owner reference
  eventId: String                     -- Event reference
  theme: Theme                        -- FANTASY, GENZ, MEME
  storyText: String                   -- 2-3 line AI-generated narrative
  plainText: String                   -- Fallback simple text
  emoji: String?                      -- Theme-appropriate emoji
  aiProvider: AIProvider?             -- Which AI generated this
  tokensUsed: Int?                    -- Cost tracking
  expiresAt: DateTime                 -- Cache expiry time
}
```

**Story Generation Examples**:

**Original Event**: "Budget Planning Meeting - 3:00 PM"

**Theme Variations**:

```javascript
FANTASY: {
  storyText: "⚔️ The treasure council convenes at 3PM to divide the golden spoils and plan future quests! Bring your scrolls of wisdom and chalice of coffee.",
  emoji: "⚔️",
  plainText: "Budget Planning Meeting at 3:00 PM"
}

GENZ: {
  storyText: "💰 Budget meeting at 3PM bestie... time to see where all our coins went 💸 No cap this gonna be interesting fr fr",
  emoji: "💸",
  plainText: "Budget Planning Meeting at 3:00 PM"
}

MEME: {
  storyText: "🔥 Budget meeting at 3PM... this is fine, everything is fine 🔥 (narrator: it was not fine) *nervous sweating*",
  emoji: "🔥",
  plainText: "Budget Planning Meeting at 3:00 PM"
}
```

**Cache Strategy**:

- **Generation**: Stories created during daily morning sync
- **Lifespan**: Valid until event completion + 1 day
- **Regeneration**: Manual sync, theme change, or event modification

#### NotificationLog Entity - Delivery Audit Trail

```sql
model NotificationLog {
  id: String @id
  userId: String                      -- Owner reference
  eventId: String                     -- Event reference
  storylineId: String?                -- Story reference
  channelId: String?                  -- Delivery channel reference
  scheduledFor: DateTime              -- Intended delivery time
  sentAt: DateTime?                   -- Actual delivery time
  status: NotificationStatus          -- PENDING, SENT, FAILED
  messageText: String                 -- Exact delivered content
  errorMessage: String?               -- Failure details
  retryCount: Int @default(0)         -- Retry attempts
}
```

**Delivery Lifecycle**:

```
PENDING → SENT (success)
PENDING → FAILED → PENDING (retry) → SENT/FAILED
```

**Message Content Preservation**:

```javascript
// Store exact delivered message for audit
const messageText = `⚔️ The fellowship gathers for their weekly council at 2PM. Bring your battle plans and coffee of power!`;

await createNotificationLog({
  messageText, // Exact content delivered
  storylineId: story.id, // Reference for regeneration comparison
  sentAt: new Date(), // Delivery timestamp
});
```

**Retry Logic**:

- **Max Retries**: 3 attempts with exponential backoff
- **Retry Scenarios**: Rate limits, temporary network issues
- **Final Failure**: User notification and manual intervention option

---

## Authentication System

### Password-Based Authentication Design

#### Authentication Flow

```
User Login → Password Verification → Session Token Generation → API Access
```

#### Password Security

```javascript
// Registration: Hash password before storage
const hashedPassword = await bcrypt.hash(plainPassword, 12);
await prisma.user.create({
  data: {
    email: email.toLowerCase(),
    password: hashedPassword,
  },
});

// Login: Verify hashed password
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await bcrypt.compare(plainPassword, user.password);
```

#### Session Management

```javascript
// Generate secure session token
const sessionToken = crypto.randomBytes(32).toString("hex");
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

// Store session (could be in Redis or database)
await storeSession(sessionToken, user.id, expiresAt);

// Return to client
res.json({
  token: sessionToken,
  user: { id: user.id, email: user.email, name: user.name },
});
```

#### Authentication Middleware

```javascript
async function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const session = await getSession(token);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
  }
}
```

---

## User Management

### User Registration & Onboarding

#### Registration Workflow

```javascript
async function registerUser(registrationData) {
  // 1. Validate input
  const { email, password, name, age, gender } =
    await validateRegistration(registrationData);

  // 2. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // 3. Create user account
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      name,
      age,
      gender,
      // Defaults from schema
      aiProvider: "GEMINI",
      selectedTheme: "FANTASY",
      timezone: "UTC",
      notificationMinutes: 15,
    },
  });

  // 4. Generate welcome session
  const sessionToken = await createSession(user.id);

  return { user: sanitizeUser(user), token: sessionToken };
}
```

#### User Profile Management

```javascript
async function updateUserProfile(userId, updates) {
  const allowedUpdates = [
    "name",
    "age",
    "gender",
    "selectedTheme",
    "timezone",
    "notificationMinutes",
  ];
  const filteredUpdates = Object.keys(updates)
    .filter((key) => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...filteredUpdates,
      updatedAt: new Date(),
    },
  });

  return sanitizeUser(updatedUser);
}
```

#### AI Provider Setup

```javascript
async function setupAIProvider(userId, { provider, apiKey, model }) {
  // Validate API key by testing it
  const isValidKey = await validateAPIKey(provider, apiKey);
  if (!isValidKey) {
    throw new Error("Invalid API key for provider");
  }

  // Encrypt API key before storage
  const encryptedKey = encrypt(apiKey);

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiProvider: provider,
      aiApiKey: encryptedKey,
      aiModel: model || getDefaultModel(provider),
    },
  });

  return { success: true, provider, model };
}
```

---

## Calendar Integration Framework

### Universal Calendar Provider Support

#### OAuth Integration Flow

```javascript
async function initiateCalendarConnection(userId, provider) {
  const oauthConfig = getOAuthConfig(provider);

  // Generate OAuth URL with state parameter
  const state = crypto.randomBytes(16).toString("hex");
  await storeOAuthState(state, { userId, provider });

  const authUrl =
    `${oauthConfig.authEndpoint}?` +
    `client_id=${oauthConfig.clientId}&` +
    `redirect_uri=${oauthConfig.redirectUri}&` +
    `scope=${oauthConfig.scopes.join(" ")}&` +
    `state=${state}&` +
    `response_type=code`;

  return { authUrl, state };
}

async function completeCalendarConnection(code, state) {
  // Verify state parameter
  const stateData = await getOAuthState(state);
  if (!stateData) {
    throw new Error("Invalid OAuth state");
  }

  const { userId, provider } = stateData;

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(provider, code);

  // Create calendar integration
  const integration = await prisma.calendarIntegration.create({
    data: {
      userId,
      provider,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      status: "ACTIVE",
    },
  });

  // Fetch user's calendars
  await syncUserCalendars(integration.id);

  return integration;
}
```

#### Multi-Provider Calendar Discovery

```javascript
async function syncUserCalendars(integrationId) {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { id: integrationId },
  });

  const calendarAPI = getCalendarAPI(integration.provider);
  const userCalendars = await calendarAPI.listCalendars(
    decrypt(integration.accessToken),
  );

  const calendarsToCreate = userCalendars.map((cal) => ({
    userId: integration.userId,
    integrationId: integration.id,
    providerCalendarId: cal.id,
    name: cal.name,
    timezone: cal.timezone || "UTC",
    isPrimary: cal.primary || false,
  }));

  // Upsert calendars
  await Promise.all(
    calendarsToCreate.map((calendar) =>
      prisma.calendar.upsert({
        where: {
          integrationId_providerCalendarId: {
            integrationId: calendar.integrationId,
            providerCalendarId: calendar.providerCalendarId,
          },
        },
        create: calendar,
        update: {
          name: calendar.name,
          timezone: calendar.timezone,
          isPrimary: calendar.isPrimary,
        },
      }),
    ),
  );
}
```

#### Token Refresh Management

```javascript
async function refreshCalendarTokens(integrationId) {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { id: integrationId },
  });

  if (integration.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
    return; // Token still valid for 5+ minutes
  }

  try {
    const newTokens = await refreshOAuthTokens(
      integration.provider,
      decrypt(integration.refreshToken),
    );

    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: {
        accessToken: encrypt(newTokens.access_token),
        refreshToken: encrypt(
          newTokens.refresh_token || integration.refreshToken,
        ),
        tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
        status: "ACTIVE",
      },
    });
  } catch (error) {
    // Mark integration as expired
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { status: "EXPIRED" },
    });

    throw error;
  }
}
```

---

## Core Features & Workflows

### Daily Sync Process

#### Morning Sync Workflow

```javascript
async function performDailySyncForUser(userId) {
  const syncJob = await prisma.syncJob.create({
    data: {
      userId,
      jobType: "daily_sync",
      status: "running",
    },
  });

  try {
    let totalEventsProcessed = 0;

    // 1. Get user's active calendar integrations
    const integrations = await prisma.calendarIntegration.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    // 2. Sync events from each integration
    for (const integration of integrations) {
      await refreshCalendarTokens(integration.id);

      const calendars = await prisma.calendar.findMany({
        where: {
          integrationId: integration.id,
          isActive: true,
        },
      });

      for (const calendar of calendars) {
        const eventsProcessed = await syncCalendarEvents(calendar.id);
        totalEventsProcessed += eventsProcessed;
      }
    }

    // 3. Generate storylines for new/updated events
    await generateStorylinesForUser(userId);

    // 4. Schedule notifications
    await scheduleNotifications(userId);

    // 5. Update sync job status
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        eventsProcessed: totalEventsProcessed,
      },
    });
  } catch (error) {
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
```

#### Event Synchronization

```javascript
async function syncCalendarEvents(calendarId) {
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
    include: { integration: true },
  });

  const calendarAPI = getCalendarAPI(calendar.integration.provider);
  const accessToken = decrypt(calendar.integration.accessToken);

  // Get events for next 2 days
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const providerEvents = await calendarAPI.getEvents({
    calendarId: calendar.providerCalendarId,
    accessToken,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  });

  let eventsProcessed = 0;

  for (const providerEvent of providerEvents) {
    const eventData = {
      userId: calendar.userId,
      calendarId: calendar.id,
      providerEventId: providerEvent.id,
      title: providerEvent.summary || "Untitled Event",
      description: providerEvent.description,
      startTime: new Date(
        providerEvent.start.dateTime || providerEvent.start.date,
      ),
      endTime: new Date(providerEvent.end.dateTime || providerEvent.end.date),
      isAllDay: !providerEvent.start.dateTime,
      location: providerEvent.location,
      meetingLink: extractMeetingLink(providerEvent),
      attendeeCount: providerEvent.attendees?.length || 0,
      lastUpdatedAt: new Date(providerEvent.updated),
      dataHash: generateEventHash(providerEvent),
    };

    await prisma.event.upsert({
      where: {
        calendarId_providerEventId: {
          calendarId: calendar.id,
          providerEventId: providerEvent.id,
        },
      },
      create: eventData,
      update: {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        meetingLink: eventData.meetingLink,
        attendeeCount: eventData.attendeeCount,
        lastUpdatedAt: eventData.lastUpdatedAt,
        dataHash: eventData.dataHash,
      },
    });

    eventsProcessed++;
  }

  await prisma.calendar.update({
    where: { id: calendarId },
    data: { lastSyncAt: new Date() },
  });

  return eventsProcessed;
}
```

### Story Generation Workflow

#### AI-Powered Storyline Creation

```javascript
async function generateStorylinesForUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Get events that need storylines
  const upcomingEvents = await prisma.event.findMany({
    where: {
      userId,
      startTime: {
        gte: new Date(),
        lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      status: "ACTIVE",
    },
  });

  for (const event of upcomingEvents) {
    // Check if storyline already exists and is valid
    const existingStoryline = await prisma.storyline.findUnique({
      where: {
        eventId_theme: {
          eventId: event.id,
          theme: user.selectedTheme,
        },
      },
    });

    const needsNewStoryline =
      !existingStoryline ||
      existingStoryline.expiresAt < new Date() ||
      !existingStoryline.isActive;

    if (needsNewStoryline) {
      await generateStorylineForEvent(event, user.selectedTheme, user);
    }
  }
}

async function generateStorylineForEvent(event, theme, user) {
  if (!user.aiApiKey) {
    // Create fallback storyline
    await createFallbackStoryline(event, theme, user.id);
    return;
  }

  try {
    const aiProvider = getAIProvider(user.aiProvider);
    const prompt = buildStoryPrompt(event, theme, user);

    const response = await aiProvider.generateText({
      apiKey: decrypt(user.aiApiKey),
      model: user.aiModel,
      prompt,
      maxTokens: 150,
    });

    const { storyText, emoji } = parseAIResponse(response.text, theme);

    await prisma.storyline.upsert({
      where: {
        eventId_theme: {
          eventId: event.id,
          theme,
        },
      },
      create: {
        userId: user.id,
        eventId: event.id,
        theme,
        storyText,
        plainText: `${event.title} at ${formatTime(event.startTime)}`,
        emoji,
        aiProvider: user.aiProvider,
        tokensUsed: response.tokensUsed,
        expiresAt: new Date(event.startTime.getTime() + 24 * 60 * 60 * 1000), // Expires 24h after event
      },
      update: {
        storyText,
        emoji,
        tokensUsed: response.tokensUsed,
        expiresAt: new Date(event.startTime.getTime() + 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  } catch (error) {
    console.error("AI generation failed:", error);
    await createFallbackStoryline(event, theme, user.id);
  }
}
```

#### Theme-Specific Prompt Engineering

```javascript
function buildStoryPrompt(event, theme, user) {
  const baseContext = {
    title: event.title,
    time: formatTime(event.startTime),
    location: event.location,
    attendeeCount: event.attendeeCount,
    userAge: user.age,
    userGender: user.gender,
  };

  const themePrompts = {
    FANTASY: `Transform this calendar event into an epic fantasy narrative (2-3 lines):
Event: "${baseContext.title}" at ${baseContext.time}
${baseContext.location ? `Location: ${baseContext.location}` : ""}
${baseContext.attendeeCount ? `Attendees: ${baseContext.attendeeCount}` : ""}

Write as if this is a quest or gathering in a medieval fantasy world. Use epic language, mention councils, fellowships, quests, treasures, etc. Include an appropriate emoji. Keep it exciting but professional.

Example style: "⚔️ The fellowship gathers for their weekly council at 2PM. Bring your battle plans and coffee of power!"`,

    GENZ: `Transform this calendar event into Gen Z slang (2-3 lines):
Event: "${baseContext.title}" at ${baseContext.time}
${baseContext.location ? `Location: ${baseContext.location}` : ""}

Write using Gen Z language - words like "bestie", "no cap", "fr fr", "slaps", "hits different", "periodt", etc. Include relevant emojis. Keep it fun but not cringe.

Example style: "💯 Budget meeting at 3PM bestie... time to see where all our coins went 💸 No cap this gonna be interesting fr fr"`,

    MEME: `Transform this calendar event into a meme-style narrative (2-3 lines):
Event: "${baseContext.title}" at ${baseContext.time}
${baseContext.location ? `Location: ${baseContext.location}` : ""}

Write in meme format - reference popular memes like "this is fine", "narrator voice", "plot twist", "POV:", etc. Include fire emoji or other meme-appropriate emojis. Make it humorous but office-appropriate.

Example style: "🔥 Budget meeting at 3PM... this is fine, everything is fine 🔥 (narrator: it was not fine)"`,
  };

  return themePrompts[theme] || themePrompts.FANTASY;
}
```

---

## Notification Management System

### Multi-Channel Notification Delivery

#### Notification Scheduling

```javascript
async function scheduleNotifications(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Get upcoming events with storylines
  const eventsWithStories = await prisma.event.findMany({
    where: {
      userId,
      startTime: {
        gte: new Date(),
        lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      status: "ACTIVE",
    },
  });

  for (const event of eventsWithStories) {
    const storyline = await prisma.storyline.findUnique({
      where: {
        eventId_theme: {
          eventId: event.id,
          theme: user.selectedTheme,
        },
      },
    });

    if (storyline && storyline.isActive) {
      await scheduleEventNotification(event, storyline, user);
    }
  }
}

async function scheduleEventNotification(event, storyline, user) {
  // Calculate notification time
  const notificationTime = new Date(
    event.startTime.getTime() - user.notificationMinutes * 60 * 1000,
  );

  // Don't schedule notifications in the past
  if (notificationTime <= new Date()) {
    return;
  }

  // Get user's notification channels
  const channels = await prisma.notificationChannel.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  // Schedule notification for primary channel (or first active channel)
  const primaryChannel = channels.find((c) => c.isPrimary) || channels[0];

  if (primaryChannel) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        eventId: event.id,
        storylineId: storyline.id,
        channelId: primaryChannel.id,
        scheduledFor: notificationTime,
        status: "PENDING",
        messageText: storyline.storyText,
      },
    });
  }
}
```

#### Notification Delivery Engine

```javascript
async function processScheduledNotifications() {
  const now = new Date();

  const pendingNotifications = await prisma.notificationLog.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
      retryCount: { lt: 3 },
    },
    include: {
      // Note: These would be manual lookups in our plain-text relationship model
    },
  });

  for (const notification of pendingNotifications) {
    try {
      await deliverNotification(notification);
    } catch (error) {
      await handleNotificationFailure(notification, error);
    }
  }
}

async function deliverNotification(notificationLog) {
  // Get notification channel details
  const channel = await prisma.notificationChannel.findUnique({
    where: { id: notificationLog.channelId },
  });

  const deliveryHandler = getDeliveryHandler(channel.type);

  try {
    const result = await deliveryHandler.send({
      channel,
      message: notificationLog.messageText,
      metadata: channel.metadata,
    });

    await prisma.notificationLog.update({
      where: { id: notificationLog.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        errorMessage: null,
      },
    });
  } catch (error) {
    throw error; // Re-throw for retry handling
  }
}
```

#### Channel-Specific Delivery Handlers

**Slack Delivery**:

```javascript
class SlackDeliveryHandler {
  async send({ channel, message, metadata }) {
    const slackAPI = new SlackWebClient(metadata.bot_token);

    const result = await slackAPI.chat.postMessage({
      channel: channel.identifier,
      text: message,
      parse: "full",
    });

    return { success: true, messageId: result.ts };
  }
}
```

**Email Delivery**:

```javascript
class EmailDeliveryHandler {
  async send({ channel, message }) {
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>📅 Calendar Reminder</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          ${message}
        </p>
        <p style="color: #666; font-size: 12px;">
          Sent by StoryTime Calendar
        </p>
      </div>
    `;

    await sendEmail({
      to: channel.identifier,
      subject: "📅 Your Upcoming Event",
      html: emailHTML,
    });

    return { success: true };
  }
}
```

**Webhook Delivery**:

```javascript
class WebhookDeliveryHandler {
  async send({ channel, message, metadata }) {
    const payload = {
      message,
      timestamp: new Date().toISOString(),
      type: "calendar_reminder",
    };

    const response = await fetch(channel.identifier, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(metadata.auth_header && { Authorization: metadata.auth_header }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`);
    }

    return { success: true, statusCode: response.status };
  }
}
```

---

## AI Integration & Story Generation

### Multi-Provider AI Architecture

#### AI Provider Abstraction

```javascript
class AIProviderFactory {
  static getProvider(providerType) {
    switch (providerType) {
      case "GEMINI":
        return new GeminiProvider();
      case "OPENAI":
        return new OpenAIProvider();
      case "CLAUDE":
        return new ClaudeProvider();
      default:
        throw new Error(`Unsupported AI provider: ${providerType}`);
    }
  }
}

class GeminiProvider {
  async generateText({
    apiKey,
    model = "gemini-pro",
    prompt,
    maxTokens = 150,
  }) {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      },
    );

    const data = await response.json();

    return {
      text: data.candidates[0]?.content?.parts[0]?.text || "",
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    };
  }
}

class OpenAIProvider {
  async generateText({
    apiKey,
    model = "gpt-3.5-turbo",
    prompt,
    maxTokens = 150,
  }) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    return {
      text: data.choices[0]?.message?.content || "",
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
```

#### Cost Monitoring & Rate Limiting

```javascript
async function trackAIUsage(userId, provider, tokensUsed, cost = null) {
  // Could be stored in a separate usage tracking table
  const today = new Date().toISOString().split("T")[0];

  await prisma.aiUsageLog.upsert({
    where: {
      userId_provider_date: {
        userId,
        provider,
        date: today,
      },
    },
    create: {
      userId,
      provider,
      date: today,
      tokensUsed,
      requestCount: 1,
      estimatedCost: cost,
    },
    update: {
      tokensUsed: { increment: tokensUsed },
      requestCount: { increment: 1 },
      estimatedCost: cost ? { increment: cost } : undefined,
    },
  });
}

async function checkUserAILimits(userId) {
  const today = new Date().toISOString().split("T")[0];

  const todayUsage = await prisma.aiUsageLog.findUnique({
    where: {
      userId_provider_date: {
        userId,
        provider: user.aiProvider,
        date: today,
      },
    },
  });

  // Example limits (could be user-configurable)
  const dailyLimits = {
    requestCount: 100,
    tokensUsed: 10000,
  };

  if (todayUsage) {
    if (todayUsage.requestCount >= dailyLimits.requestCount) {
      throw new Error("Daily AI request limit exceeded");
    }
    if (todayUsage.tokensUsed >= dailyLimits.tokensUsed) {
      throw new Error("Daily AI token limit exceeded");
    }
  }

  return true;
}
```

---

## Sync Management

### Robust Sync Architecture

#### Sync Job Management

```javascript
async function createSyncJob(userId, jobType = "daily_sync") {
  const existingRunningJob = await prisma.syncJob.findFirst({
    where: {
      userId,
      status: "running",
    },
  });

  if (existingRunningJob) {
    throw new Error("Sync already in progress for user");
  }

  return await prisma.syncJob.create({
    data: {
      userId,
      jobType,
      status: "running",
      eventsProcessed: 0,
    },
  });
}

async function executeSyncJob(syncJobId) {
  const syncJob = await prisma.syncJob.findUnique({
    where: { id: syncJobId },
  });

  if (!syncJob || syncJob.status !== "running") {
    throw new Error("Invalid sync job");
  }

  try {
    const result = await performDailySyncForUser(syncJob.userId);

    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        eventsProcessed: result.eventsProcessed,
      },
    });

    return result;
  } catch (error) {
    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
```

#### Scheduled Sync Operations

```javascript
// Daily sync cron job (runs every morning at 8 AM)
async function scheduledDailySync() {
  const activeUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      lastSyncAt: {
        lt: new Date(Date.now() - 20 * 60 * 60 * 1000), // Last sync > 20 hours ago
      },
    },
  });

  const syncPromises = activeUsers.map(async (user) => {
    try {
      const syncJob = await createSyncJob(user.id, "daily_sync");
      await executeSyncJob(syncJob.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      console.error(`Sync failed for user ${user.id}:`, error);
    }
  });

  await Promise.allSettled(syncPromises);
}

// Manual sync triggered by user
async function manualUserSync(userId) {
  const syncJob = await createSyncJob(userId, "manual_sync");
  const result = await executeSyncJob(syncJob.id);

  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncAt: new Date() },
  });

  return result;
}
```

---

## API Design Considerations

### RESTful API Structure

#### Resource-Based Endpoints

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# User Management
GET    /api/user/profile
PUT    /api/user/profile
PUT    /api/user/ai-settings
GET    /api/user/dashboard

# Calendar Integration
POST   /api/calendars/connect/{provider}
GET    /api/calendars
DELETE /api/calendars/{integrationId}
POST   /api/calendars/sync

# Notifications
GET    /api/notifications/channels
POST   /api/notifications/channels
PUT    /api/notifications/channels/{channelId}
DELETE /api/notifications/channels/{channelId}

# Events & Stories
GET    /api/events
GET    /api/events/{eventId}/storylines
POST   /api/events/{eventId}/regenerate-story

# System
GET    /api/sync/status
POST   /api/sync/manual
```

#### Request/Response Examples

**User Dashboard Data**:

```javascript
// GET /api/user/dashboard
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "selectedTheme": "FANTASY",
    "aiProvider": "GEMINI"
  },
  "stats": {
    "connectedCalendars": 2,
    "activeChannels": 1,
    "upcomingEvents": 5,
    "storiesGenerated": 12
  },
  "recentEvents": [
    {
      "id": "evt123",
      "title": "Team Standup",
      "startTime": "2024-01-20T14:00:00Z",
      "storyline": {
        "storyText": "⚔️ The fellowship gathers for their weekly council...",
        "theme": "FANTASY"
      }
    }
  ],
  "lastSync": "2024-01-20T08:00:00Z"
}
```

**Calendar Connection**:

```javascript
// POST /api/calendars/connect/google
{
  "code": "oauth_authorization_code",
  "state": "oauth_state_parameter"
}

// Response
{
  "success": true,
  "integration": {
    "id": "int123",
    "provider": "GOOGLE",
    "status": "ACTIVE",
    "calendarsFound": 3
  }
}
```

#### Error Handling Standards

```javascript
// Standardized error responses
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided AI API key is invalid",
    "details": {
      "provider": "GEMINI",
      "suggestion": "Please check your API key in user settings"
    }
  }
}

// Validation errors
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "fields": {
        "email": "Must be a valid email address",
        "notificationMinutes": "Must be between 1 and 60"
      }
    }
  }
}
```

---

## Scalability & Performance

### Database Performance Optimization

#### Strategic Indexing Strategy

```sql
-- User lookup patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Event query patterns
CREATE INDEX idx_events_user_time ON events(user_id, start_time);
CREATE INDEX idx_events_calendar_time ON events(calendar_id, start_time);
CREATE INDEX idx_events_status_time ON events(status, start_time) WHERE status = 'ACTIVE';

-- Storyline cache queries
CREATE INDEX idx_storylines_event_theme ON storylines(event_id, theme);
CREATE INDEX idx_storylines_expiry ON storylines(expires_at) WHERE is_active = true;
CREATE INDEX idx_storylines_user_active ON storylines(user_id, is_active);

-- Notification processing
CREATE INDEX idx_notifications_scheduled ON notification_logs(scheduled_for, status);
CREATE INDEX idx_notifications_retry ON notification_logs(status, retry_count) WHERE status = 'FAILED';

-- Sync operations
CREATE INDEX idx_sync_jobs_user_status ON sync_jobs(user_id, status);
CREATE INDEX idx_calendar_integrations_status ON calendar_integrations(status, last_sync_at);
```

#### Query Optimization Examples

```javascript
// Optimized query for upcoming events with stories
async function getUpcomingEventsWithStories(userId, limit = 10) {
  // Single query with manual joins (plain text relationships)
  const events = await prisma.event.findMany({
    where: {
      userId,
      startTime: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: "ACTIVE",
    },
    orderBy: { startTime: "asc" },
    take: limit,
  });

  // Batch fetch storylines
  const eventIds = events.map((e) => e.id);
  const storylines = await prisma.storyline.findMany({
    where: {
      eventId: { in: eventIds },
      isActive: true,
    },
  });

  // Manual join in application
  const storylinesByEvent = storylines.reduce((acc, story) => {
    acc[story.eventId] = story;
    return acc;
  }, {});

  return events.map((event) => ({
    ...event,
    storyline: storylinesByEvent[event.id] || null,
  }));
}
```

#### Caching Strategy

```javascript
// Redis caching for frequently accessed data
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:${userId}`,
  USER_CHANNELS: (userId) => `user:${userId}:channels`,
  EVENT_STORYLINES: (eventId) => `event:${eventId}:storylines`,
  CALENDAR_EVENTS: (calendarId) => `calendar:${calendarId}:events`,
};

async function getCachedUserChannels(userId) {
  const cacheKey = CACHE_KEYS.USER_CHANNELS(userId);

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to database
  const channels = await prisma.notificationChannel.findMany({
    where: { userId, isActive: true },
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(channels));

  return channels;
}

// Cache invalidation on updates
async function updateNotificationChannel(channelId, updates) {
  const channel = await prisma.notificationChannel.update({
    where: { id: channelId },
    data: updates,
  });

  // Invalidate user's channels cache
  await redis.del(CACHE_KEYS.USER_CHANNELS(channel.userId));

  return channel;
}
```

### Background Job Processing

#### Queue-Based Processing

```javascript
// Using a job queue for async operations
const Queue = require("bull");
const syncQueue = new Queue("sync operations");
const notificationQueue = new Queue("notifications");

// Process sync jobs
syncQueue.process("daily-sync", async (job) => {
  const { userId } = job.data;
  await performDailySyncForUser(userId);
});

// Process notification delivery
notificationQueue.process("send-notification", async (job) => {
  const { notificationId } = job.data;
  const notification = await prisma.notificationLog.findUnique({
    where: { id: notificationId },
  });
  await deliverNotification(notification);
});

// Schedule recurring jobs
syncQueue.add(
  "daily-sync-all",
  {},
  {
    repeat: { cron: "0 8 * * *" }, // Daily at 8 AM
  },
);
```

---

## Security Considerations

### Data Protection & Encryption

#### API Key Security

```javascript
const crypto = require("crypto");

// Encryption for sensitive data
function encrypt(text) {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from("storytime-calendar"));

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText) {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from("storytime-calendar"));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

#### Input Validation & Sanitization

```javascript
const joi = require("joi");

const schemas = {
  userRegistration: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).max(128).required(),
    name: joi.string().max(100).optional(),
    age: joi.number().integer().min(13).max(120).optional(),
    gender: joi
      .string()
      .valid("MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY")
      .optional(),
  }),

  aiSettings: joi.object({
    provider: joi
      .string()
      .valid("GEMINI", "OPENAI", "CLAUDE", "LLAMA")
      .required(),
    apiKey: joi.string().min(10).max(500).required(),
    model: joi.string().max(50).optional(),
  }),

  notificationChannel: joi.object({
    type: joi.string().valid("slack", "email", "teams", "webhook").required(),
    identifier: joi.string().max(500).required(),
    name: joi.string().max(100).optional(),
    metadata: joi.object().optional(),
  }),
};

function validateInput(data, schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Unknown validation schema: ${schemaName}`);
  }

  const { error, value } = schema.validate(data, { stripUnknown: true });
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  return value;
}
```

#### Rate Limiting & Abuse Prevention

```javascript
const rateLimit = require("express-rate-limit");

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

// AI generation rate limiting (per user)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: "AI generation rate limit exceeded",
});

// Sync operation limiting
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 sync operations per 5 minutes per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: "Sync rate limit exceeded",
});
```

#### Security Headers & CORS

```javascript
// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://generativelanguage.googleapis.com",
        ],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Request logging for security monitoring
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`,
  );
  next();
});
```

---

## Summary

The StoryTime Calendar database architecture provides a robust, scalable foundation for transforming mundane calendar events into engaging storylines. The design balances simplicity with flexibility, using plain text relationships for ease of maintenance while supporting unlimited future expansion through provider-agnostic patterns.

Key architectural strengths:

- **User-Centric Design**: Clear data ownership and privacy controls
- **Provider Flexibility**: Support for any calendar, AI, or notification service
- **Performance Optimization**: Strategic caching, indexing, and denormalization
- **Security First**: Encryption, validation, and rate limiting throughout
- **Scalable Architecture**: Background processing and queue-based operations

The system handles the complexity of multi-provider integrations while maintaining a clean, understandable codebase that can scale from individual users to enterprise deployments. The plain text relationship model ensures the database remains maintainable and debuggable as the application grows.

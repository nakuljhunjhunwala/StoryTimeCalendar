# StoryTime Calendar - Phase 1 Functional Requirements Document (FRD)

## Table of Contents
1. [Phase 1 Overview](#phase-1-overview)
2. [Sub-Phase 1A: Core Foundation](#sub-phase-1a-core-foundation)
3. [Sub-Phase 1B: Calendar Integration](#sub-phase-1b-calendar-integration)
4. [Sub-Phase 1C: AI Story Generation](#sub-phase-1c-ai-story-generation)
5. [Sub-Phase 1D: Notification System](#sub-phase-1d-notification-system)
6. [Sub-Phase 1E: Dashboard & User Experience](#sub-phase-1e-dashboard--user-experience)
7. [Sub-Phase 1F: Automation & Polish](#sub-phase-1f-automation--polish)
8. [Deployment Checklist](#deployment-checklist)

---

## Phase 1 Overview

### Objective
Build a Minimum Viable Product (MVP) that transforms calendar events into engaging storylines and delivers them via Slack notifications.

### MVP Scope Limitations
- **Single Calendar Provider**: Google Calendar only
- **Single Notification Channel**: Slack only  
- **Fixed Reminder Timing**: 15 minutes before events
- **Limited Sync Window**: 2 days ahead
- **Three Themes**: Fantasy, Gen Z, Memes
- **Basic Dashboard**: Essential functionality only

### Success Criteria
- Users can register and authenticate
- Users can connect Google Calendar with OAuth
- Users can set up Slack notifications
- AI generates storylines for calendar events
- System syncs calendars automatically daily
- Notifications deliver reliably to Slack

---

## Sub-Phase 1A: Core Foundation

**Duration**: 2-3 weeks  
**Priority**: Critical Foundation

### 1A.1 Project Setup & Dependencies

#### Required Dependencies
Install and configure these core packages:
- `@prisma/client` and `prisma` for database operations
- `bcryptjs` for password hashing  
- `jsonwebtoken` for authentication tokens
- `express` for API server
- `helmet` and `cors` for security
- `passport` and `passport-google-oauth20` for Google OAuth
- `dotenv` for environment management

#### Environment Variables Setup
Create `.env` file with these required variables:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret-here"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
SLACK_CLIENT_ID="your-slack-app-client-id" 
SLACK_CLIENT_SECRET="your-slack-app-secret"
FRONTEND_URL="http://localhost:3000"
ENCRYPTION_KEY="32-byte-hex-encryption-key"
```

#### Constants File Structure
Create `src/constants/index.ts` with organized constants:
- `API_ENDPOINTS` object containing all internal API routes
- `EXTERNAL_APIS` object with AI provider URLs (Gemini, OpenAI, Claude)
- `APP_CONFIG` object with JWT expiry (30 days), sync windows, retry limits

### 1A.2 Database Implementation

#### Schema Migration
Use the Prisma schema provided in the database documentation. Run migrations to create all tables with proper indexes.

#### Database Connection Setup
Create database connection utility with health check function. Implement connection retry logic and error handling.

### 1A.3 Authentication System

#### Password-Based Authentication
Implement user registration and login with bcrypt password hashing (12 rounds). Generate JWT tokens with 30-day expiry. Create middleware for token verification on protected routes.

#### Key Authentication Requirements
- Email validation and uniqueness checking
- Secure password hashing before database storage
- JWT tokens for session management
- Protected route middleware that validates tokens
- Password reset functionality via email

#### API Endpoints to Implement
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/forgot-password` - Password reset request
- POST `/api/auth/reset-password` - Password reset completion

### 1A.4 Basic API Infrastructure

#### Express Server Setup
Configure Express server with security middleware (helmet, cors). Remove rate limiting. Set up JSON body parsing with size limits. Implement global error handling middleware.

#### Health Check Endpoint
Create `/health` endpoint that checks database connectivity and returns system status.

#### Request Logging
Implement request logging middleware for debugging and monitoring.

---

## Sub-Phase 1B: Calendar Integration

**Duration**: 2-3 weeks  
**Priority**: High - Core Data Source

### 1B.1 Google OAuth with Passport

#### Passport Configuration
Install and configure `passport-google-oauth20` strategy. Set up OAuth callback handling with Passport middleware. Configure Google OAuth scopes for calendar read access.

#### OAuth Flow Implementation
Create OAuth initiation endpoint that redirects to Google. Implement callback handler that processes OAuth response. Store encrypted access and refresh tokens in database.

#### Required OAuth Scopes
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/userinfo.email`

### 1B.2 Calendar Discovery & Management

#### Calendar Fetching
After successful OAuth, fetch user's calendar list from Google Calendar API. Store calendar metadata (name, timezone, primary status) in database. Allow users to enable/disable specific calendars for syncing.

#### API Integration Details
Use Google Calendar API v3 directly with fetch requests. Handle token refresh automatically when tokens expire. Implement error handling for API rate limits and failures.

### 1B.3 Event Synchronization

#### Event Fetching Strategy
Fetch events from enabled calendars for next 2 days only. Extract essential event data: title, description, start/end times, location, attendee count. Generate hash of event data for change detection.

#### Sync Logic
Compare fetched events with stored events using provider event IDs. Update existing events if data hash has changed. Create new events that don't exist in database. Mark events as completed after they pass.

#### Data Storage Optimization
Store minimal event data needed for story generation. Use upsert operations to handle create/update logic. Implement efficient change detection to avoid unnecessary API calls.

---

## Sub-Phase 1C: AI Story Generation

**Duration**: 2-3 weeks  
**Priority**: High - Core Value Proposition

### 1C.1 AI Provider Integration

#### Multi-Provider Architecture
Create AI provider interface that abstracts different AI services. Implement specific classes for Gemini and OpenAI providers. Handle API key validation for each provider type.

#### External API Constants
Organize all AI provider URLs in constants:
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Claude: `https://api.anthropic.com/v1/messages`

#### User API Key Management
Allow users to configure their own AI provider and API key. Encrypt API keys before database storage. Validate API keys by making test requests to providers.

### 1C.2 Theme Implementation

#### Three Story Themes
**Fantasy Theme**: Transform events into medieval/fantasy narratives using words like "fellowship," "council," "quest," "battle." Include fantasy emojis (⚔️, 🏰, 🛡️).

**Gen Z Theme**: Use modern slang and casual language like "bestie," "no cap," "fr fr," "periodt." Include trendy emojis (💯, 💸, 🔥, ✨).

**Meme Theme**: Reference internet culture and memes like "this is fine," "narrator voice," "plot twist." Use humorous but work-appropriate language with meme emojis (🔥, 😅, 💀).

#### Prompt Engineering
Create theme-specific prompt templates that include event context (title, time, location, attendee count). Design prompts to generate 2-3 line narratives that are engaging but professional. Include emoji selection logic for each theme.

### 1C.3 Story Generation Pipeline

#### Generation Process
Check if valid storyline exists for event and theme combination. If no valid storyline, use user's AI provider to generate new story. Parse AI response to extract story text and emoji. Store generated storyline with expiration time (24 hours after event).

#### Caching Strategy
Cache storylines until event completion plus 1 day. Implement cache invalidation when events are modified. Provide manual regeneration option for users.

#### Fallback Handling
Create simple fallback storylines for each theme when AI generation fails. Ensure system continues working even without AI provider configured.

---

## Sub-Phase 1D: Notification System

**Duration**: 2-3 weeks  
**Priority**: High - User Value Delivery

### 1D.1 Slack Integration Setup

#### Slack App Configuration
Create Slack app in Slack API console with required scopes (`chat:write`, `channels:read`). Configure OAuth redirect URLs. Set up bot user for message posting.

#### OAuth Implementation
Implement Slack OAuth flow similar to Google Calendar. Store bot token securely after successful authorization. Allow users to select notification channel or default to general.

### 1D.2 Notification Scheduling

#### Timing Logic
Calculate notification time as 15 minutes before event start time. Don't schedule notifications for events in the past. Check for existing notifications to prevent duplicates.

#### Database Storage
Store scheduled notifications in `notification_logs` table with PENDING status. Include event reference, storyline reference, and target channel. Track retry count for failed deliveries.

### 1D.3 Notification Delivery Engine

#### Processing Loop
Create background process that checks for due notifications every minute. Process notifications in batches to avoid overwhelming Slack API. Update notification status after successful delivery.

#### Slack Message Delivery
Use Slack Web API to post messages to specified channels. Format messages with storyline text. Handle Slack API errors and rate limits gracefully.

#### Retry Logic
Implement exponential backoff for failed deliveries (1min, 2min, 4min delays). Mark notifications as permanently failed after 3 retry attempts. Log delivery errors for debugging.

---

## Sub-Phase 1E: Dashboard & User Experience

**Duration**: 3-4 weeks  
**Priority**: Medium-High - User Interface

### 1E.1 React Frontend Setup

#### Project Initialization
Create React application with TypeScript. Set up routing with React Router. Configure authentication context for user state management. Implement protected routes that require authentication.

#### Authentication Integration
Create login and registration forms with validation. Implement JWT token storage in localStorage. Add automatic token verification on app load. Handle authentication errors and redirects.

### 1E.2 Dashboard Overview

#### Main Dashboard Page
Display user welcome message and current theme selection. Show connection status for Google Calendar and Slack. List upcoming events with their generated storylines. Provide quick action buttons for manual sync and settings.

#### Key Components Needed
- Stats cards showing connected services and upcoming events
- Recent events list with storyline previews
- Connection status indicators
- Manual sync trigger button

### 1E.3 Integration Management

#### Google Calendar Connection
Create UI for Google OAuth initiation. Display connected calendars with toggle switches for enabling/disabling sync. Show last sync timestamp and sync status. Provide disconnect option.

#### Slack Notification Setup
Implement Slack OAuth flow in frontend. Display connected Slack workspace and channel information. Allow users to change notification preferences. Show notification delivery history.

### 1E.4 Settings & Preferences

#### Theme Selection Interface
Create theme picker with live previews of each theme style. Show example storylines for Fantasy, Gen Z, and Meme themes. Allow instant theme switching with preview updates.

#### AI Provider Configuration
Form for users to input their AI provider choice (Gemini/OpenAI) and API key. Implement API key validation with real-time feedback. Show current usage or connection status.

#### Profile Management
User profile editing form for name, email, and preferences. Account deletion option with confirmation dialog. Data export functionality for user data.

---

## Sub-Phase 1F: Automation & Polish

**Duration**: 2-3 weeks  
**Priority**: Medium - Production Readiness

### 1F.1 Automated Daily Sync

#### Cron Job Setup
Implement daily sync job that runs every morning at 8 AM. Process all active users who haven't been synced in 20+ hours. Handle sync jobs in batches to avoid system overload.

#### Sync Process
For each user: refresh Google Calendar tokens if needed, fetch events from enabled calendars, generate storylines for new/updated events, schedule notifications for upcoming events.

#### Error Handling
Log sync failures with detailed error messages. Continue processing other users if individual sync fails. Track sync job status and completion times.

### 1F.2 Background Notification Processing

#### Continuous Processing
Run notification processor every minute to check for due notifications. Process notifications in batches with concurrency limits. Update notification status after delivery attempts.

#### Delivery Optimization
Implement batch processing for multiple notifications to same Slack workspace. Handle API rate limits by spacing requests appropriately. Queue failed notifications for retry processing.

### 1F.3 Data Cleanup & Maintenance

#### Automated Cleanup
Daily cleanup job to remove expired storylines (after event completion + 1 day). Archive old notification logs (keep for 30 days). Clean up completed sync jobs (keep for 7 days).

#### Database Optimization
Weekly database maintenance to update statistics and optimize performance. Monitor database size and storage usage. Implement soft deletes for user data retention.

### 1F.4 Error Monitoring & Health Checks

#### System Monitoring
Enhance health check endpoint to verify recent sync success rates and notification delivery rates. Monitor database connectivity and response times. Track system resource usage.

#### Error Logging
Comprehensive error logging for all failed operations. Log API errors from Google Calendar, Slack, and AI providers. Create alerts for critical system failures.

#### User Error Notifications
Notify users of sync failures via their connected Slack channel. Provide clear error messages and resolution steps. Create admin dashboard for monitoring system health.

---

## Deployment Checklist

### Infrastructure Setup
- PostgreSQL database (managed service recommended)
- Node.js application server with PM2 or similar process manager  
- Environment variables configured securely
- SSL certificates for HTTPS
- Domain name and DNS configuration

### External Service Configuration
- Google OAuth app with correct redirect URLs
- Slack app with proper permissions and bot configuration
- Email service for password reset functionality (SendGrid/Mailgun)

### Security Configuration
- Environment variables secured and not in version control
- Database connection strings encrypted
- API keys and secrets properly managed
- CORS configured for production domain

### Deployment Steps
1. Deploy database and run migrations
2. Configure environment variables on server
3. Deploy application code
4. Set up cron jobs for automated sync and cleanup
5. Configure monitoring and logging
6. Test all integration flows end-to-end

### Post-Deployment Verification
- Verify user registration and login works
- Test Google Calendar OAuth flow
- Test Slack integration and message delivery
- Confirm daily sync and notification processing
- Check all API endpoints respond correctly

This FRD provides clear, step-by-step guidance for implementing the StoryTime Calendar MVP. Each section focuses on specific functionality with implementation details that allow systematic development and testing of features.
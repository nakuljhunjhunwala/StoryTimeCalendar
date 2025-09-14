# 🎭 StoryTime Calendar Backend

> Transform your mundane calendar events into engaging, personalized narratives with AI-powered storytelling

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0+-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### 🤖 **Multi-Provider AI Integration**
- **OpenAI GPT Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Google Gemini**: Gemini Pro, Gemini Pro Vision
- **Anthropic Claude**: Claude 3 Opus, Sonnet, Haiku
- **Intelligent Fallback**: Automatic provider switching on failures
- **Token Optimization**: Efficient prompt engineering for cost savings

### 📅 **Calendar Integration**
- **Google Calendar**: Full OAuth 2.0 integration with real-time sync
- **Event Management**: CRUD operations with intelligent categorization
- **Smart Scheduling**: Automatic event type detection and context building

### 🎨 **Story Generation**
- **Theme-Based Stories**: Fantasy, GenZ, Meme, Professional, Casual
- **Personalized Narratives**: Age and gender-aware story generation
- **Context-Rich Prompts**: Meeting type, attendees, location-aware storytelling
- **Caching System**: Efficient story storage and retrieval

### 📱 **Slack Notifications**
- **Direct Messages**: Personal story reminders via Slack DMs
- **OAuth Integration**: Secure Slack app installation and management
- **Rich Formatting**: Beautiful message blocks with story content
- **Retry Logic**: Robust delivery with exponential backoff

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure user sessions with refresh tokens
- **OAuth 2.0**: Google and Slack integrations
- **AES-256-GCM Encryption**: Secure API key storage
- **Rate Limiting**: API protection and abuse prevention

### 🏗️ **Architecture**
- **RESTful API**: Clean, documented endpoints
- **Modular Design**: Microservice-ready architecture
- **Background Jobs**: Cron-based story generation and notifications
- **Database**: PostgreSQL with Prisma ORM
- **TypeScript**: Full type safety and IntelliSense

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL database
- Environment variables (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/nakuljhunjhunwala/storytime-calendar-backend.git
cd storytime-calendar-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/storytime"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Encryption for API keys
ENCRYPTION_KEY="your-64-character-hex-encryption-key"

# Google Calendar Integration
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Slack Integration
SLACK_CLIENT_ID="your-slack-app-client-id"
SLACK_CLIENT_SECRET="your-slack-app-client-secret"
SLACK_REDIRECT_URI="https://your-domain.com/api/v1/slack/oauth/callback"

# AI Providers
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-google-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# CORS
FRONTEND_URL="http://localhost:3000"
```

## 📚 API Documentation

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Calendar Management
```http
GET    /api/v1/calendar/events
POST   /api/v1/calendar/events
PUT    /api/v1/calendar/events/:id
DELETE /api/v1/calendar/events/:id
GET    /api/v1/calendar/integrations
POST   /api/v1/calendar/google/oauth
```

### Story Generation
```http
POST /api/v1/stories/generate
GET  /api/v1/stories/:eventId
GET  /api/v1/ai/models
POST /api/v1/ai/keys
```

### Slack Integration
```http
GET    /api/v1/slack/oauth/initiate
GET    /api/v1/slack/oauth/callback
GET    /api/v1/slack/integration
POST   /api/v1/slack/test
DELETE /api/v1/slack/disconnect
```

### Notifications
```http
GET  /api/v1/notifications/preferences
PUT  /api/v1/notifications/preferences
GET  /api/v1/notifications/stats
GET  /api/v1/notifications/recent
POST /api/v1/notifications/trigger/:eventId
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm run start           # Start production server
npm run start:prod      # Start with production environment

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate:dev # Run development migrations
npm run prisma:migrate:prod # Deploy production migrations
npm run prisma:studio      # Open Prisma Studio

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run typecheck       # TypeScript type checking
npm run quality         # Run all quality checks
npm run test            # Run tests (when implemented)

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
```

### Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts             # Server entry point
├── database/
│   ├── db.ts            # Database connection
│   └── schema.prisma    # Database schema
├── modules/
│   ├── auth/            # Authentication & authorization
│   ├── calendar/        # Calendar integration
│   ├── ai/              # AI provider management
│   ├── slack/           # Slack integration
│   └── notifications/   # Notification system
├── shared/
│   ├── config/          # Configuration management
│   ├── constants/       # Application constants
│   ├── middlewares/     # Express middlewares
│   ├── services/        # Shared business logic
│   └── utils/           # Utility functions
└── jobs/
    ├── story-generation.job.ts    # Background story generation
    └── notification-delivery.job.ts # Notification delivery
```

## 🐳 Docker Deployment

```dockerfile
# Build
docker build -t storytime-calendar-backend .

# Run
docker run -p 5004:5004 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-jwt-secret" \
  storytime-calendar-backend
```

## 🔧 Third-Party Service Configuration

### 🤖 **AI Provider Setup**

#### OpenAI (Recommended)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy key (starts with `sk-`) to your `.env` file
4. **Models available**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo

#### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy key to your `.env` file
4. **Models available**: Gemini Pro, Gemini Pro Vision

#### Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create API key
3. Copy key (starts with `sk-ant-`) to your `.env` file
4. **Models available**: Claude 3 Opus, Sonnet, Haiku

### 📅 **Google Calendar Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:5004/api/v1/calendar/google/callback`
7. Copy **Client ID** and **Client Secret** to your `.env` file

### 📱 **Slack App Setup**
1. Go to [Slack API](https://api.slack.com/apps) → **Create New App**
2. Choose **From scratch** → Name your app → Select workspace
3. Go to **OAuth & Permissions**:
   - Add **Bot Token Scopes**: `chat:write`, `users:read`
   - Add **Redirect URL**: `http://localhost:5004/api/v1/slack/oauth/callback`
4. Go to **Install App** → Install to workspace
5. Copy **Client ID** and **Client Secret** to your `.env` file

### 🗄️ **Database Setup**

#### Option 1: Docker (Recommended)
```bash
docker run -d \
  --name storytime-postgres \
  -e POSTGRES_DB=storytime_calendar \
  -e POSTGRES_USER=storytime \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update && sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE storytime_calendar;
CREATE USER storytime WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE storytime_calendar TO storytime;
\q
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nakul Jhunjhunwala**
- GitHub: [@nakuljhunjhunwala](https://github.com/nakuljhunjhunwala)
- Email: nakul@example.com

## 🙏 Acknowledgments

- OpenAI for GPT models
- Google for Gemini AI and Calendar API
- Anthropic for Claude models
- Slack for messaging platform
- Prisma for excellent ORM
- The open-source community

---

Made with ❤️ by [Nakul Jhunjhunwala](https://github.com/nakuljhunjhunwala)
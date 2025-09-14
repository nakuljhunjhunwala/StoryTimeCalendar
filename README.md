# 🎭 StoryTime Calendar - AI-Powered Calendar Storytelling

> **Transform boring calendar events into engaging AI-generated stories** | Turn "Team Meeting" into epic fantasy quests or "Doctor Appointment" into sci-fi adventures

**Keywords:** AI calendar, story generation, OpenAI integration, Google Calendar sync, Slack notifications, React TypeScript, Node.js backend, calendar automation, personalized stories, productivity tool

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 What is StoryTime Calendar?

**StoryTime Calendar** is an innovative full-stack application that revolutionizes how you experience your daily schedule. Using advanced AI technology from OpenAI, Google Gemini, and Anthropic Claude, it transforms mundane calendar events into captivating, personalized narratives.

**Perfect for:** Professionals, students, content creators, and anyone who wants to make their daily schedule more engaging and memorable.

### ✨ Key Features

- 🤖 **Multi-Provider AI Integration** - OpenAI GPT, Google Gemini, Anthropic Claude
- 📅 **Google Calendar Sync** - Seamless real-time calendar integration
- 🎨 **Theme-Based Stories** - Fantasy, GenZ, Meme, Professional, Casual themes
- 👤 **Personalized Narratives** - Age and gender-aware story generation
- 📱 **Slack Notifications** - Direct message story reminders
- 🔐 **Enterprise Security** - JWT auth, OAuth 2.0, AES-256 encryption
- 🎯 **Modern UI/UX** - Responsive React frontend with Tailwind CSS
- 🚀 **Production Ready** - Docker support, comprehensive monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React Frontend│◄──►│  Node.js Backend│◄──►│   PostgreSQL    │
│   (Port 3000)   │    │   (Port 5004)   │    │   Database      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│                 │    │                 │              
│  External APIs  │    │  Background Jobs│              
│  • Google Cal   │    │  • Story Gen    │              
│  • OpenAI       │    │  • Notifications│              
│  • Gemini       │    │  • Sync Tasks   │              
│  • Claude       │    │                 │              
│  • Slack        │    │                 │              
└─────────────────┘    └─────────────────┘              
```

## 🚀 Quick Start Guide

### 🎯 **Option 1: Docker (Recommended - 5 minutes)**

```bash
# 1. Clone and configure
git clone https://github.com/nakuljhunjhunwala/storytime-calendar.git
cd storytime-calendar
cp .env.example .env

# 2. Add your API keys to .env file
# OPENAI_API_KEY=sk-your-key
# GOOGLE_CLIENT_ID=your-google-id
# SLACK_CLIENT_ID=your-slack-id

# 3. Start everything
docker-compose up --build

# 4. Open http://localhost:3000 🎉
```

### 🛠️ **Option 2: Manual Setup (15 minutes)**

**Prerequisites:** Node.js 18+, PostgreSQL 13+, API keys ready

```bash
# 1. Clone repository
git clone https://github.com/nakuljhunjhunwala/storytime-calendar.git
cd storytime-calendar

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and API keys
npm run prisma:generate && npm run prisma:migrate:dev
npm run dev  # Runs on :5004

# 3. Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev  # Runs on :3000
```

### 🌐 **Access Points**
- **🎭 Frontend App**: http://localhost:3000
- **🔧 Backend API**: http://localhost:5004
- **📚 API Docs**: http://localhost:5004/api/docs
- **🗄️ Database GUI**: `npm run prisma:studio` (in backend folder)

## 📋 Environment Configuration

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/storytime"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
ENCRYPTION_KEY="your-64-character-hex-encryption-key"

# Google Calendar
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Slack Integration
SLACK_CLIENT_ID="your-slack-app-client-id"
SLACK_CLIENT_SECRET="your-slack-app-client-secret"
SLACK_REDIRECT_URI="https://your-domain.com/api/v1/slack/oauth/callback"

# AI Providers
OPENAI_API_KEY="sk-your-openai-api-key"
GEMINI_API_KEY="your-google-gemini-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5004/api/v1
VITE_APP_NAME="StoryTime Calendar"

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_SLACK_CLIENT_ID=your-slack-app-client-id
```

## 🛠️ Development

### Available Scripts

#### Backend
```bash
npm run dev              # Development server with hot reload
npm run build           # Build for production
npm run start           # Start production server
npm run quality         # Run all quality checks
npm run prisma:studio   # Open database GUI
```

#### Frontend
```bash
npm run dev             # Development server with hot reload
npm run build          # Build for production
npm run preview        # Preview production build
npm run quality        # Run all quality checks
```

### Project Structure

```
storytime-calendar/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── shared/         # Shared utilities
│   │   ├── database/       # Prisma schema
│   │   └── jobs/           # Background jobs
│   ├── Dockerfile
│   └── README.md
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── store/          # State management
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml      # Multi-container setup
└── README.md              # This file
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Deployment

```bash
# Backend
cd backend
docker build -t storytime-backend .
docker run -p 5004:5004 storytime-backend

# Frontend
cd frontend
docker build -t storytime-frontend .
docker run -p 3000:80 storytime-frontend
```

## 🔑 API Keys & Configuration

### **Step 1: Get Your API Keys (5 minutes)**

| Provider | Get API Key | Purpose |
|----------|-------------|---------|
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | Story generation with GPT models |
| **Google Gemini** | [Google AI Studio](https://makersuite.google.com/app/apikey) | Alternative AI story generation |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | Claude AI story generation |

### **Step 2: OAuth App Setup (10 minutes)**

#### 🗓️ **Google Calendar Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable "Google Calendar API"
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:5004/api/v1/calendar/google/callback`
5. Copy Client ID & Secret to your `.env` file

#### 📱 **Slack Integration Setup**
1. Create app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add OAuth scopes: `chat:write`, `users:read`
3. Set redirect URL: `http://localhost:5004/api/v1/slack/oauth/callback`
4. Install to your workspace
5. Copy Client ID & Secret to your `.env` file

### **Step 3: Environment Variables**

#### Backend Configuration (`backend/.env`)
```bash
# AI Providers (get at least one)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
ANTHROPIC_API_KEY=sk-ant-your-claude-key-here

# Database
DATABASE_URL=postgresql://storytime:password@localhost:5432/storytime_calendar

# Security (generate secure keys)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:5004/api/v1/slack/oauth/callback

# App Config
FRONTEND_URL=http://localhost:3000
PORT=5004
```

#### Frontend Configuration (`frontend/.env.local`)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5004/api/v1
VITE_APP_NAME=StoryTime Calendar

# OAuth (same IDs as backend)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SLACK_CLIENT_ID=your-slack-client-id
```

#### 🔐 **Generate Secure Keys**
```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate Encryption Key (64-character hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 Monitoring & Analytics

### Health Checks

- **Backend**: `GET /api/v1/health`
- **Frontend**: `GET /health`
- **Database**: Built-in Prisma connection monitoring

### Logging

- **Backend**: Winston logger with configurable levels
- **Frontend**: Console logging with environment-based filtering
- **Database**: Prisma query logging

### Performance Monitoring

- **Backend**: Request timing, memory usage, error rates
- **Frontend**: Bundle size analysis, Core Web Vitals
- **Database**: Query performance, connection pooling

## 🔒 Security

### Authentication & Authorization
- JWT tokens with refresh rotation
- OAuth 2.0 for third-party integrations
- Role-based access control (RBAC)

### Data Protection
- AES-256-GCM encryption for sensitive data
- HTTPS enforcement in production
- CORS configuration
- Rate limiting and DDoS protection

### API Security
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection with Content Security Policy
- CSRF protection for state-changing operations

## 🚀 Production Deployment

### Recommended Infrastructure

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    
  backend:
    build: ./backend
    ports:
      - "5004:5004"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=storytime
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Environment-Specific Configurations

#### Development
- Hot reload enabled
- Detailed error messages
- Debug logging
- CORS permissive

#### Production
- Minified builds
- Error tracking (Sentry)
- Performance monitoring
- Security headers
- Rate limiting

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
```

### Frontend Testing
```bash
cd frontend
npm run test             # Unit tests with Jest
npm run test:e2e        # Playwright E2E tests
npm run test:visual     # Visual regression tests
```

## 📈 Performance Optimization

### Backend Optimizations
- Database query optimization with Prisma
- Redis caching for frequently accessed data
- Background job processing with Bull Queue
- API response compression
- Connection pooling

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization with WebP
- Bundle size monitoring
- Service worker for offline support
- CDN integration for static assets

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`npm run quality`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Jest** for unit testing
- **Comprehensive documentation** for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nakul Jhunjhunwala**
- GitHub: [@nakuljhunjhunwala](https://github.com/nakuljhunjhunwala)
- Email: nakul@example.com
- LinkedIn: [Nakul Jhunjhunwala](https://linkedin.com/in/nakuljhunjhunwala)

## 🙏 Acknowledgments

- **OpenAI** for GPT models and API
- **Google** for Gemini AI and Calendar API
- **Anthropic** for Claude models
- **Slack** for messaging platform integration
- **Vercel** for deployment platform
- **Prisma** for excellent database ORM
- **React** and **Node.js** communities
- All open-source contributors

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### ❌ **"Database connection failed"**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Create database manually
createdb storytime_calendar

# Check connection string format
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### ❌ **"Frontend can't connect to backend"**
```bash
# Check backend is running on correct port
curl http://localhost:5004/api/v1/health

# Verify CORS settings in backend/.env
FRONTEND_URL=http://localhost:3000
```

#### ❌ **"AI story generation not working"**
```bash
# Verify at least one AI API key is set
echo $OPENAI_API_KEY

# Check API key format
# OpenAI: sk-...
# Gemini: starts with letters/numbers
# Claude: sk-ant-...
```

#### ❌ **"OAuth redirect errors"**
- **Google**: Redirect URI must match exactly in Google Cloud Console
- **Slack**: Redirect URI must be HTTPS in production
- **Development**: Use `http://localhost:5004/api/v1/[provider]/oauth/callback`

### **Getting Help**
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/nakuljhunjhunwala/storytime-calendar/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/nakuljhunjhunwala/storytime-calendar/discussions)
- 📧 **Email**: support@storytime-calendar.com
- 📚 **Docs**: Check individual README files in `/backend` and `/frontend`

---

<div align="center">
  <strong>Made with ❤️ by <a href="https://github.com/nakuljhunjhunwala">Nakul Jhunjhunwala</a></strong>
  <br>
  <em>Transform your calendar, transform your day! 🎭✨</em>
</div>

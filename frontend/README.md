# 🎭 StoryTime Calendar Frontend

> Modern React frontend that transforms your calendar events into engaging AI-powered stories

[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7+-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Component Library**: Custom UI components built with Radix UI primitives
- **Smooth Animations**: Framer Motion for delightful user interactions
- **Accessible**: WCAG 2.1 compliant with keyboard navigation support

### 📅 **Calendar Management**
- **Google Calendar Integration**: Seamless OAuth 2.0 connection
- **Event Visualization**: Beautiful calendar views with event details
- **Real-time Sync**: Automatic updates from connected calendars
- **Event Management**: Create, edit, and delete events with rich forms

### 🤖 **AI Story Generation**
- **Multi-Provider Support**: OpenAI, Google Gemini, Anthropic Claude
- **Theme Selection**: Fantasy, GenZ, Meme, Professional, Casual themes
- **Real-time Generation**: Live story creation with loading states
- **Story Management**: Save, edit, and share generated stories
- **Preview Mode**: Rich text rendering with markdown support

### 📱 **Slack Integration**
- **OAuth Connection**: Secure Slack app installation
- **Direct Messages**: Personal story reminders via Slack DMs
- **Integration Status**: Real-time connection monitoring
- **Test Messages**: Verify integration with sample notifications

### 🔐 **Authentication & Security**
- **JWT Authentication**: Secure login with refresh token rotation
- **Protected Routes**: Route-level authentication guards
- **Session Management**: Automatic token refresh and logout
- **Error Boundaries**: Graceful error handling and recovery

### ⚡ **Performance**
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **React Query**: Efficient data fetching with caching
- **Optimized Images**: WebP support with fallbacks
- **Bundle Analysis**: Built-in bundle size monitoring

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm 8+**
- **Backend API** running on port 5004 (see [backend README](../backend/README.md))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URL and OAuth client IDs

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

### Environment Configuration

Create `.env.local` file:
```bash
# Backend API (required)
VITE_API_BASE_URL=http://localhost:5004/api/v1

# OAuth Client IDs (optional - for integrations)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SLACK_CLIENT_ID=your-slack-client-id

# App Settings
VITE_APP_NAME=StoryTime Calendar
VITE_DEFAULT_THEME=system
```

### 🔗 **Integration with Backend**
This frontend requires the backend API to be running. Make sure:
1. Backend is running on `http://localhost:5004`
2. Database is connected and migrated
3. At least one AI provider is configured
4. CORS is enabled for `http://localhost:3000`

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm run start           # Start production preview server
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript type checking
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run quality         # Run all quality checks

# Utilities
npm run analyze         # Analyze bundle size
npm run clean           # Clean build artifacts
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── calendar/       # Calendar-specific components
│   ├── stories/        # Story-related components
│   └── integrations/   # Integration components
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   ├── calendar/       # Calendar pages
│   ├── stories/        # Story pages
│   ├── settings/       # Settings pages
│   └── integrations/   # Integration pages
├── services/           # API services and HTTP clients
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── assets/             # Static assets (images, icons)
```

### Component Architecture

```typescript
// Example component structure
interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Hooks
  const [state, setState] = useState();
  const query = useQuery();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-styles">
      {/* Component JSX */}
    </div>
  );
};
```

## 🎨 Styling

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### CSS Custom Properties

```css
:root {
  --color-primary: 59 130 246;
  --color-secondary: 156 163 175;
  --radius: 0.5rem;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large**: 1440px+

### Mobile-First Approach
```css
/* Mobile styles (default) */
.component {
  @apply p-4 text-sm;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    @apply p-6 text-base;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    @apply p-8 text-lg;
  }
}
```

## 🔧 State Management

### Zustand Store Structure

```typescript
interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // UI state
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  
  // Data state
  events: CalendarEvent[];
  stories: Story[];
  
  // Actions
  setUser: (user: User | null) => void;
  toggleTheme: () => void;
  // ... other actions
}
```

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright for critical user flows
- **Visual Tests**: Chromatic for component visual regression

```bash
# Run tests
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:visual      # Visual regression tests
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build and Run
```bash
# Build Docker image
docker build -t storytime-calendar-frontend .

# Run container
docker run -p 3000:80 storytime-calendar-frontend
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

### Self-hosted
```bash
# Build for production
npm run build

# Serve with any static server
npx serve -s dist -l 3000
```

## 🔧 Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-select', 'lucide-react'],
        },
      },
    },
  },
});
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines
- Use TypeScript for all new code
- Follow the existing component structure
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nakul Jhunjhunwala**
- GitHub: [@nakuljhunjhunwala](https://github.com/nakuljhunjhunwala)
- Email: nakul@example.com

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for blazing fast development
- Tailwind CSS for utility-first styling
- Radix UI for accessible components
- The open-source community

---

Made with ❤️ by [Nakul Jhunjhunwala](https://github.com/nakuljhunjhunwala)
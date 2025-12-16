<p align="center">
  <img src="public/genai-lab-logo.svg" alt="GenAI Lab Logo" width="120" height="120" />
</p>

<h1 align="center">GenAI Lab</h1>

<p align="center">
  <strong>Enterprise-Grade AI Learning Platform for Prompt Engineering Education</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
</p>

---

## 📋 Overview

**GenAI Lab** is a comprehensive, production-ready learning platform designed to teach prompt engineering and provide unified access to multiple AI models. Built for educational institutions, it features real-time AI interactions, intelligent prompt scoring, multi-model comparison, and detailed analytics.

### Why GenAI Lab?

| Challenge | Solution |
|-----------|----------|
| Students need hands-on AI experience | Interactive chat with GPT-4, Claude, Gemini & more |
| No structured prompt engineering curriculum | AI-powered prompt scoring with detailed feedback |
| Expensive API access for students | Unified token budget with cost tracking |
| Hard to compare AI model outputs | Side-by-side multi-model comparison tool |
| Limited visibility into student progress | Comprehensive admin analytics dashboard |

---

## ✨ Features

### 🎓 For Students

| Feature | Description |
|---------|-------------|
| **AI Model Chat** | Real-time streaming conversations with GPT-4, GPT-4o, Claude 3.5, Gemini 2.0 Flash, and more |
| **Prompt Scoring** | AI-powered analysis with scores for Clarity, Specificity, Context, and Goal Orientation |
| **Multi-Model Compare** | Compare responses from multiple models side-by-side in real-time |
| **Custom AI Agents** | Create personalized agents with custom system prompts and knowledge bases |
| **Progress Tracking** | Visual dashboards showing sessions, tokens, scores, and learning trends |
| **Leaderboard** | Gamified learning with peer rankings based on prompt quality |
| **Artifacts** | Save, organize, and export generated content and code snippets |
| **Rich Markdown** | Full markdown rendering with syntax highlighting, LaTeX math, and copy functionality |

### 👨‍💼 For Administrators

| Feature | Description |
|---------|-------------|
| **User Management** | Create, edit, suspend students with batch/course organization |
| **Analytics Dashboard** | Real-time metrics: costs, tokens, sessions, active users by period |
| **API Key Management** | Secure storage and rotation of provider API keys via dashboard |
| **Model Configuration** | Enable/disable models, set pricing, test connectivity |
| **Guardrails** | Content safety rules with AI intent detection |
| **Token Quotas** | Per-student budget limits with automatic enforcement |
| **Password Management** | Force password reset, view exceeded quotas, bulk operations |

---

## 🛠 Tech Stack

### Frontend
```
React 18.3          │  UI Framework with Hooks
TypeScript 5.6      │  Type Safety
Vite 5.4            │  Build Tool & Dev Server
TailwindCSS 3.4     │  Utility-First Styling
Shadcn/UI           │  Accessible Component Library
TanStack Query      │  Server State Management
React Router 6      │  Client-Side Routing
Framer Motion       │  Animations
Recharts            │  Data Visualization
```

### Backend
```
Node.js 18+         │  Runtime Environment
Express.js 4.21     │  Web Framework
Prisma 5.22         │  ORM & Database Toolkit
SQLite/PostgreSQL   │  Database (Dev/Prod)
JWT                 │  Authentication
Zod                 │  Schema Validation
bcryptjs            │  Password Hashing
Helmet              │  Security Headers
```

### AI Integrations
```
OpenAI              │  GPT-4, GPT-4o, GPT-4o-mini, DALL-E 3
Anthropic           │  Claude 3.5 Sonnet, Claude 3 Opus
Google AI           │  Gemini 2.0 Flash, Gemini 2.5 Pro
ElevenLabs          │  Text-to-Speech (Coming Soon)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0+ or **yarn** 1.22+
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tanishksoni90/GenAI-Lab.git
cd GenAI-Lab

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install

# 4. Configure environment
cp env.example .env
# Edit .env with your settings (JWT secrets, etc.)

# 5. Initialize database
npx prisma migrate dev --name init
npx prisma db seed

# 6. Return to root
cd ..
```

### Running the Application

**Development Mode:**

```bash
# Terminal 1: Start backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2: Start frontend (http://localhost:8080)
npm run dev
```

**Production Build:**

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
npm start
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@genailab.com | Admin@123 |
| **Student** | demo@student.com | Demo@123 |

> ⚠️ **Important:** Change default passwords immediately after first login.

### Configuring AI Providers

1. Log in as Admin
2. Navigate to **Admin Dashboard → API Keys**
3. Add your API keys for each provider:
   - OpenAI: https://platform.openai.com/api-keys
   - Google AI: https://aistudio.google.com/apikey
   - Anthropic: https://console.anthropic.com/settings/keys

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React +   │  │  TanStack   │  │    Shadcn/UI + Tailwind │  │
│  │  TypeScript │  │    Query    │  │      Component Library  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         └────────────────┼──────────────────────┘               │
│                          │ HTTP/SSE                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                          ▼                                       │
│                      BACKEND                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Express.js │  │   Prisma    │  │     AI Service Layer    │  │
│  │   Routes    │◄─┤    ORM      │  │  OpenAI/Anthropic/Google│  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                       │               │
│         ▼                ▼                       ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   JWT Auth  │  │  SQLite/    │  │   Streaming (SSE)       │  │
│  │  Middleware │  │  PostgreSQL │  │   Real-time Responses   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
User ─────────┬──────────────┬──────────────┬──────────────┐
              │              │              │              │
              ▼              ▼              ▼              ▼
           Session        Agent       Artifact    ComparisonSession
              │              │                           │
              ▼              ▼                           ▼
           Message    AgentGuardrail            ComparisonExchange
                                                        │
                                                        ▼
                                                ComparisonResponse
```

### Project Structure

```
GenAI-Lab/
├── src/                          # Frontend source
│   ├── components/
│   │   └── ui/                   # Shadcn UI components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── ThemeContext.tsx      # Theme management
│   ├── hooks/                    # Custom React hooks
│   │   ├── useApi.ts             # TanStack Query hooks
│   │   └── useAdminData.ts       # Admin data fetching
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # API client
│   │   └── modelPricing.ts       # Pricing utilities
│   └── pages/
│       ├── admin/                # Admin dashboard
│       └── student/              # Student dashboard
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── migrations/           # Migration history
│   └── src/
│       ├── config/
│       │   ├── index.ts          # App configuration
│       │   └── pricing.ts        # Model pricing
│       ├── controllers/          # Request handlers
│       ├── services/             # Business logic
│       │   ├── ai.service.ts     # AI provider integrations
│       │   ├── session.service.ts
│       │   ├── comparison.service.ts
│       │   └── scoring.service.ts
│       ├── middleware/           # Express middleware
│       └── routes/               # API route definitions
│
├── public/                       # Static assets
└── package.json
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh-token` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/change-password` | Change password |

### Sessions & Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List user's sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id/messages` | Get session messages |
| POST | `/api/sessions/:id/messages` | Send message (non-streaming) |
| POST | `/api/sessions/:id/messages/stream` | Send message (SSE streaming) |

### Multi-Model Comparison

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comparison/categories` | Get model categories |
| GET | `/api/comparison/models/:category` | Get models by category |
| POST | `/api/comparison/start-exchange` | Start comparison session |
| POST | `/api/comparison/stream-model` | Stream single model (SSE) |
| GET | `/api/comparison/sessions` | Get comparison history |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List user's agents |
| POST | `/api/agents` | Create new agent |
| PUT | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | List all students |
| GET | `/api/admin/analytics` | Get platform analytics |
| GET | `/api/admin/api-keys` | Get API key status |
| PUT | `/api/admin/api-keys/:provider` | Update API key |
| GET | `/api/admin/models` | List all models |
| POST | `/api/admin/models/:id/toggle` | Enable/disable model |

---

## 💰 Pricing Model

GenAI Lab uses a **virtual token system** for simplified student billing:

```
┌─────────────────────────────────────────────────────────┐
│                    PRICING MODEL                         │
├─────────────────────────────────────────────────────────┤
│  Student Pays:        ₹2,000 enrollment fee             │
│  Virtual Tokens:      50,000 tokens (display)           │
│  Actual Budget:       $18 USD (~₹1,500) API usage       │
│  Profit Margin:       ₹500 per student                  │
├─────────────────────────────────────────────────────────┤
│  Conversion Formula:                                     │
│  Virtual Tokens = (USD Spent / $18) × 50,000            │
└─────────────────────────────────────────────────────────┘
```

All costs are tracked in USD internally for accuracy, with INR conversion for display.

---

## 🔒 Security

- **JWT Authentication** with access/refresh token rotation
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** (100 requests per 15 minutes per IP)
- **Helmet.js** security headers
- **API Key Encryption** in database
- **Input Validation** with Zod schemas
- **CORS** configured for frontend origin

---

## 🧪 Development

### Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:8080
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npm run db:seed
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

---

## 📊 Performance

- **Streaming Responses**: Server-Sent Events for real-time AI output
- **Query Caching**: TanStack Query with configurable stale times
- **Optimistic Updates**: Immediate UI feedback
- **Lazy Loading**: Route-based code splitting
- **Virtual Token Calculation**: Lightweight cost tracking

---

## 🗺 Roadmap

- [ ] Voice input/output integration
- [ ] Image generation (DALL-E 3)
- [ ] Assignment submission & grading
- [ ] Team collaboration features
- [ ] Mobile responsive improvements
- [ ] Export to PDF/DOCX
- [ ] WebSocket for real-time notifications
- [ ] PostgreSQL production deployment

---

## 🤝 Contributing

This is a proprietary educational platform. For feature requests or bug reports, please contact the development team.

---

## 📄 License

This project is proprietary software developed for educational purposes. All rights reserved.

---

## 👨‍💻 Author

**Tanishk Soni**

- GitHub: [@tanishksoni90](https://github.com/tanishksoni90)

---

<p align="center">
  <sub>Built with ❤️ for the future of AI education</sub>
</p>

<p align="center">
  <img src="public/genai-lab-logo.svg" alt="GenAI Lab Logo" width="120" height="120" />
</p>

<h1 align="center">GenAI Lab</h1>

<p align="center">
  <strong>Enterprise-Grade AI Learning Platform for Prompt Engineering Education</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#architecture--system-design">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Documentation</a> •
  <a href="#testing">Testing</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#troubleshooting--faq">Troubleshooting</a><br><br>
  👉 <strong>Deep Dives:</strong> 
  <a href="ARCHITECTURE.md">System Architecture Guide</a> | 
  <a href="API_REFERENCE.md">Complete API Reference</a>
</p>

---

## 📋 Overview

**GenAI Lab** is a comprehensive, production-ready internal learning platform designed to train internal teams and students on prompt engineering. Built by and for our enterprise engineering team, the platform unifies access to multiple leading AI models (OpenAI, Anthropic, Google) under a single budget-controlled ecosystem.

It provides real-time streaming AI interactions, an intelligent rule-based/LLM-based prompt scoring engine, multi-model synchronous testing, and extensive administrative oversight through a centralized dashboard.

As the repository transitions from initial architecture to a collaborative multi-developer environment, this platform adheres to strict code quality, separation of concerns, rate-limiting, and relational data tracking.

---

## ✨ Key Features

### For Students / Users
- **Unified AI Model Chat:** Real-time Server-Sent Events (SSE) streaming conversations with models like GPT-4o, Claude 3.5 Sonnet, and Gemini 2.0 Flash.
- **Prompt Scoring Engine:** Automated, detailed feedback loops examining *Clarity, Specificity, Context, and Goal Orientation*. Generates tailored "Good" and "Bad" mock prompt examples for user education.
- **Multi-Model Compare (Synchronous Benchmarking):** Capable of running a single prompt through up to 6 different models simultaneously while tracking precise token costs and response latencies.
- **Custom AI Agents (Chatbots):** Create specialized agents armed with custom system instructions, strict guardrails, and retrievable knowledge bases.
- **Artifact Management:** Save, bookmark, and organize model outputs (Code, Text, Image) across sessions.
- **Gamified Leaderboard & Progress Tracking:** Tracks activity streaks, active days, session counts, and ranks users institutionally based on prompt-score averages.

### For Administrators
- **Comprehensive Analytics:** Track real-time metric costs (in USD and INR equivalents), token consumption, and daily active user charts via Recharts.
- **Centralized Guardrails Engine:** Inject 'AI Intent Detection' rules handling content safety and educational integrity. Instruct the LLM gateway to strictly block or guide specific inputs/outputs globally.
- **Budget & Token Quotas:** Protect API budgets with per-student USD/Token limits alongside concurrent AI-endpoint rate limiting per user identity.
- **User & API Management:** Manage course batches, reset passwords securely, track lockouts, and manage external provider API keys securely from the dashboard.

---

## 🏗 Architecture / System Design

> *For a detailed breakdown including sequence diagrams, ERDs, middleware flow, and component relationships, please see our dedicated **[System Architecture Guide](ARCHITECTURE.md)**.*

The application utilizes a **Monorepo-style** internal structure split into a decoupled **React/Vite Frontend** and a **Node.js/Express Backend** with **PostgreSQL**.

### High-Level Topology
1. **Frontend (Vite + React + TanStack Query):** Manages local state aggressively to minimize API round-trips. Splits access strictly between `/student/*` interfaces and `/admin/*` interfaces. UI is built via Tailwind CSS and Shadcn.
2. **Backend Gateway (Express + TypeScript):** Acts as the central orchestrator routing user prompts to proper external APIs. Implements deep JWT-based authentication combined with rigorous security headers (Helmet) and IP/User-based rate limiting.
3. **Database Layer (Prisma + PostgreSQL):** A fully relational state storing configuration, tracking API keys securely, maintaining session histories, and accumulating atomic wallet token transactions to prevent budget over-spending race conditions.
4. **Third-Party AI Services:** Invoked dynamically based on Admin-populated keys and stored configurations. Costing maps dynamically map Input/Output token usage back to platform quotas.

### Database Entity Relational Model (Core)
- **`User`**: (Admin / Student roles) - Manages budget limits and token constraints.
- **`Session` & `Message`**: Encapsulates standard ChatGPT-like interactions and individual token expenditures per request.
- **`Chatbot` & `Guardrail`**: Creates modular isolated bots governed by specific rule combinations.
- **`ComparisonSession` -> `ComparisonExchange` -> `ComparisonResponse`**: Tracks multi-model parallel tracking.
- **`AIModel` & `APIKey`**: Admin controlled registry defining active external capabilities.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18.3, Vite 5.4, TypeScript 5.8
- **Styling:** Tailwind CSS 3.4, Shadcn/UI (Radix UI primitives)
- **Data Fetching:** TanStack Query (React Query) v5
- **Routing:** React Router v6
- **Markdown & Math rendering:** React-Markdown, Remark-Math, Rehype-KaTeX

### Backend
- **Framework:** Node.js, Express 4.21, TypeScript 5.6
- **Database / ORM:** PostgreSQL, Prisma ORM 5.22
- **Validation:** Zod
- **Security:** bcryptjs, jsonwebtoken, express-rate-limit, helmet
- **AI SDKs:** `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** (v9.0+) or **yarn**
- **Git**
- **PostgreSQL** database (Local instance or Docker container)

### Step 1: Clone the repository
```bash
git clone https://github.com/your-org/GenAI-Lab.git
cd GenAI-Lab
```

### Step 2: Frontend Setup
```bash
npm install
```

### Step 3: Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

**Configure `.env` in Backend:**
Update with your active DB URL and configure your strong JWT Secrets.
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/genai_lab?schema=public"
JWT_SECRET=super_secret_dev_key
JWT_REFRESH_SECRET=super_secret_dev_refresh_key
FRONTEND_URL=http://localhost:8080
ADMIN_REGISTRATION_CODE=admin_secret_123
```

### Step 4: Run Database Migrations & Seed
```bash
npx prisma generate
npx prisma migrate dev --name init_postgresql
npx prisma db seed
```
*(The seed script populates default AI Model definitions, initial pricing references, UI states, and baseline Admin accounts).*

### Step 5: Start Servers natively
**Start the Backend API:**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Start the Frontend App (New Terminal):**
```bash
cd GenAI-Lab
npm run dev
# Running on http://localhost:8080
```

---

## 📡 API Documentation

> *For the exhaustive, granular endpoint specifications—including exact JSON Request/Response schemas, error constraints, and deep pagination logic—please refer to the full **[Complete API Reference](API_REFERENCE.md)**.*

Below is the comprehensive API map. The application requires Bearer Token (`Authorization: Bearer <token>`) authentication for protected routes.

### 1. Authentication (`/api/auth/*`)
| Method | Endpoint | Description | Request Structure | Response Structure | Auth |
|---|---|---|---|---|---|
| POST | `/register` | Registers a student. | `email`, `password`, `name`, `registrationId` | `user` object, `tokens` (access/refresh) | None |
| POST | `/admin-register` | Registers an admin. | `email`, `password`, `name`, `adminCode` | `user` object, `tokens` | None (Requires secret) |
| POST | `/login` | Authenticates User/Admin | `email`, `password` | `user` object, `tokens` | None |
| POST | `/refresh-token` | Rotates expiring access tokens | `refreshToken` | `tokens` | None |
| GET | `/me` | Get current user | - | `user` object with quotas | **User/Admin** |

### 2. Conversational Sessions (`/api/sessions/*`)
| Method | Endpoint | Description | Request Structure | Auth |
|---|---|---|---|---|
| GET | `/` | List all user sessions | Query params: `page`, `limit`, `modelId`, `chatbotId` | **User** |
| POST | `/` | Create a clean conversation | `modelId` (UUID), `chatbotId` (Optional UUID) | **User** |
| GET | `/:id` | Fetch specific session metadata | - | **User** |
| GET | `/:id/messages` | Load historical messages | - | **User** |
| POST | `/:id/messages` | Post a standard text message | `content` (string) | **User** |
| POST | `/:id/messages/stream` | Stream AI response output | `content` (string) | **User** |
*Note: Streaming routes return exact HTTP Server-Sent Events (SSE) including `chunk`, `start`, `error`, and `done` payload events.*

### 3. Custom Chatbots & Agents (`/api/chatbots/*`)
| Method | Endpoint | Description | Request Structure | Auth |
|---|---|---|---|---|
| GET | `/` | Fetch active user chatbots | - | **User** |
| POST | `/` | Mint a custom Agent | `name`, `description`, `modelId`, `behaviorPrompt`, `strictMode`, `knowledgeBase[]`, `guardrailIds[]` | **User** |
| GET | `/:id` | Fetch specific chatbot payload | - | **User** |
| PUT | `/:id` | Update Agent parameters | Fields identical to POST | **User** |
| DELETE| `/:id` | Soft-deletes a chatbot | - | **User** |
| GET | `/:id/stats` | Chatbot specific analytics | - | **User** |

### 4. Multi-Model Comparison (`/api/comparison/*`)
| Method | Endpoint | Description | Request Structure | Auth |
|---|---|---|---|---|
| POST | `/start-exchange` | Initiate parallel testing | `category`, `modelIds[]`, `prompt`, `comparisonSessionId` (optional) | **User** |
| POST | `/run-model` | Execute isolated model call | `modelId`, `prompt`, `exchangeId` | **User** |
| POST | `/stream-model` | Stream single comparison output| `modelId`, `prompt`, `exchangeId` (SSE Returns) | **User** |
| GET | `/sessions` | Return all comparisons | - | **User** |

### 5. Artifacts (`/api/artifacts/*`)
| Method | Endpoint | Description | Request Structure | Auth |
|---|---|---|---|---|
| GET | `/` | Fetch all user artifacts | Query: `page`, `type`, `bookmarked` | **User** |
| POST | `/` | Stash a piece of Code/Text/Image | `sessionId`, `type`, `title`, `content` | **User** |
| POST | `/:id/bookmark` | Toggle active bookmark | - | **User** |

### 6. Administration (`/api/admin/*`)
| Method | Endpoint | Description | Notes | Auth |
|---|---|---|---|---|
| GET | `/students` | Enumerate all user metadata | Manage lockouts, quotas, un-enrollments | **Admin** |
| POST | `/students/bulk` | Execute batch operations | Overwrite quotas, Force Reset Passwords | **Admin** |
| POST | `/admin/api-keys` | Adjust external providers (OpenAI, etc.) | Requires highly secure valid `apiKey` inputs | **Admin** |
| GET | `/analytics` | Fetches massive KPI topology | Pulls USD maps, total tokens, streak metrics | **Admin** |
| POST | `/guardrails` | Define System Level Intent-Rules | Applies "Behavior", "Content Safety" | **Admin** |

---

## 🧪 Testing

Currently, the GenAI Lab emphasizes strictly typed endpoints via **Zod integration** on all Express controller routes. 

**Future Roadmap:**
Integration of `Jest` and `Supertest` specifically targeting the Atomic Transaction behavior within budgets (`session.service.ts`). As multiple concurrent requests are generated rapidly on parallel AI testing, validating that the PostgreSQL `prisma.$transaction` actively caps `tokenUsed` guarantees billing security.

---

## 🚀 Deployment (Future Roadmap)

For staging/production environments, consider this Docker-oriented path:
1. **Containerize:** Scaffold `Dockerfile` configurations specifically optimizing layered node_modules for Express and multi-stage Vite builds for React.
2. **Postgres Instances:** Scale DB via managed instances (e.g. AWS RDS / Supabase) bypassing the local developer instances. Note: Be sure to configure connection pooling on Prisma.
3. **CI/CD:** Enforce automated TypeScript checks and eslint before merging MR's to the active branch.

---

## 🐛 Troubleshooting / FAQ

**Q: I get "Insufficient Tokens" or "Account Locked" when testing API limits.**
> You hit the active JWT user ratelimit or token hard-limit! Log in to the Admin Dashboard > Settings Tab. Ensure "Hard Limit Enforcement" is toggled appropriately and use the Admin overview to instantly provide the account an extended limit.

**Q: The AI models aren't responding natively or fall back to "Mock Response".**
> 1. Ensure you have populated your specific API Keys under Admin Dashboard -> API Keys.
> 2. Ensure the specific Model definition is enabled under the "Models" tab.

**Q: Database migration failed with "migration_lock" issues?**
> Manually clear the prisma lock tables or delete your internal `.db` references if utilizing the legacy SQLite builds and trigger: `npx prisma migrate reset` explicitly.

---

## 📄 License & Ownership

**Proprietary Software**
This codebase is an internal training, analytics, and operational deployment framework developed by and strictly assigned to the operating institution. Open-source distribution is prohibited unless explicit, written consent is granted by stakeholders. 

Dependencies managed under `package.json` follow their respective MIT/Apache sub-licenses.
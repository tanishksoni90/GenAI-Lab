# GenAI Learning Platform

A comprehensive AI-powered learning platform for EdTech, featuring prompt engineering education, AI model interactions, and student progress tracking.

## Features

### For Students
- 🤖 **AI Model Chat** - Interact with multiple AI models (GPT-4, Claude, Gemini, etc.)
- 📊 **Prompt Scoring** - Real-time feedback on prompt quality with detailed breakdowns
- 🎯 **Custom AI Agents** - Create personalized AI agents with knowledge bases
- 📈 **Progress Tracking** - Track sessions, tokens used, and learning progress
- 🏆 **Leaderboard** - Compete with peers on prompt engineering skills
- 💾 **Artifacts** - Save and organize generated content

### For Admins
- 👥 **User Management** - Manage students, courses, and batches
- 📊 **Analytics Dashboard** - View platform-wide statistics
- 🔧 **Model Configuration** - Configure available AI models and pricing
- 🛡️ **Guardrails** - Set up content safety rules

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn UI
- React Query (data fetching)
- React Router (navigation)

### Backend
- Node.js + Express.js
- Prisma ORM
- SQLite (development) / PostgreSQL (production)
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tanishksoni90/GenAI-Lab.git
   cd GenAI-Lab
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # In backend folder, copy env.example to .env
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on http://localhost:3001

2. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:8080

### Default Credentials

**Admin:**
- Email: admin@genailab.com
- Password: Admin@123

**Student (demo):**
- Email: demo@student.com
- Password: Demo@123

## Project Structure

```
GenAI-Lab/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API client
│   └── pages/              # Page components
│       ├── admin/          # Admin dashboard pages
│       └── student/        # Student dashboard pages
├── backend/                # Backend source code
│   ├── prisma/             # Database schema and migrations
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── services/       # Business logic
│       ├── middleware/     # Express middleware
│       └── routes/         # API routes
└── public/                 # Static assets
```

## API Documentation

The backend provides RESTful APIs:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/models` - List available AI models
- `POST /api/sessions` - Create chat session
- `POST /api/sessions/:id/messages` - Send message to AI
- `GET /api/agents` - List user's AI agents
- `POST /api/agents` - Create new AI agent

## License

This project is proprietary software for educational purposes.

## Author

Tanishk Soni - [GitHub](https://github.com/tanishksoni90)

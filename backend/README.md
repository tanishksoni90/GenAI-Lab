# GenAI Lab Backend

Backend server for the GenAI Lab learning platform.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** SQLite (local dev) / DynamoDB (production)
- **ORM:** Prisma
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** Zod

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

Copy the example environment file:

```bash
# Windows
copy env.example .env

# Mac/Linux
cp env.example .env
```

Edit `.env` with your settings (defaults work for local development).

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Create database and tables
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

## Demo Credentials

After seeding, you can use these accounts:

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@genailab.com     | Admin@123    |
| Student | student@genailab.com   | Student@123  |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/admin/register` - Admin registration (requires code)
- `POST /api/auth/login` - Login (both roles)
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Coming Soon
- `/api/students/*` - Student dashboard APIs
- `/api/models/*` - AI model management
- `/api/sessions/*` - Chat sessions
- `/api/agents/*` - AI agents CRUD
- `/api/admin/*` - Admin management APIs

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed database with demo data |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Configuration
│   ├── controllers/       # Route handlers
│   ├── lib/               # Shared libraries (Prisma)
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── validators/        # Request validation schemas
│   ├── app.ts             # Express app setup
│   ├── index.ts           # Server entry point
│   └── seed.ts            # Database seeding
├── env.example            # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | SQLite file path | file:./dev.db |
| `JWT_SECRET` | JWT signing secret | (generate one!) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (generate one!) |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8080 |
| `OPENAI_API_KEY` | OpenAI API key | (optional) |
| `GOOGLE_AI_API_KEY` | Google AI API key | (optional) |
| `ANTHROPIC_API_KEY` | Anthropic API key | (optional) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | (optional) |


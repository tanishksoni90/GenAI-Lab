# PostgreSQL Migration Guide

This guide helps you migrate from SQLite (development) to PostgreSQL (production).

## Quick Start (5 Minutes)

### Step 1: Set up PostgreSQL

You can use any PostgreSQL provider:
- **Railway** (recommended for quick setup): https://railway.app
- **Neon** (free tier available): https://neon.tech
- **Supabase**: https://supabase.com
- **AWS RDS**: https://aws.amazon.com/rds/postgresql/
- **Self-hosted**: Docker or local installation

### Step 2: Get your connection string

Your connection string will look like:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Example from Railway:
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

### Step 3: Update your `.env` file

Change this:
```env
DATABASE_URL="file:./dev.db"
```

To this:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### Step 4: Update `schema.prisma`

Change the provider from `sqlite` to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 5: Run migrations

```bash
cd backend

# Generate a fresh migration for PostgreSQL
npx prisma migrate dev --name init_postgresql

# Or in production (no prompt):
npx prisma migrate deploy
```

### Step 6: Seed the database (optional)

```bash
npx ts-node src/seed.ts
```

---

## Production Checklist

### Required Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# Security (MUST change from defaults!)
JWT_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>
ENCRYPTION_KEY=<32-byte hex string>
ADMIN_REGISTRATION_CODE=<strong random string>

# CORS
FRONTEND_URL=https://your-production-domain.com

# Environment
NODE_ENV=production
```

### Generate Secure Values

```bash
# JWT Secrets (use each output for JWT_SECRET and JWT_REFRESH_SECRET)
openssl rand -base64 64

# Encryption Key (32-byte hex = 64 characters)
openssl rand -hex 32

# Admin Code
openssl rand -base64 32
```

---

## Data Migration (Optional)

If you have existing data in SQLite that you want to migrate:

### Option A: Fresh Start (Recommended)
Just run migrations on PostgreSQL - data will be empty.

### Option B: Export/Import
1. Export SQLite data to JSON
2. Import to PostgreSQL using Prisma

```bash
# Export (create a script or use a tool like sqlite3)
sqlite3 prisma/dev.db ".dump" > backup.sql

# For complex migrations, use Prisma's db seed with exported JSON
```

---

## PostgreSQL-Specific Considerations

### 1. Case Sensitivity
PostgreSQL is case-sensitive by default for identifiers. Prisma handles this automatically.

### 2. Connection Pooling
For production, consider using a connection pooler like PgBouncer. Add to your URL:
```
postgresql://...?connection_limit=5&pool_timeout=10
```

### 3. SSL/TLS
Most cloud providers require SSL. Add `sslmode=require`:
```
postgresql://...?sslmode=require
```

### 4. Prisma Accelerate (Optional)
For better performance, consider Prisma Accelerate:
https://www.prisma.io/data-platform/accelerate

---

## Rollback Plan

If something goes wrong:

1. Keep SQLite `dev.db` as backup
2. Revert `schema.prisma` provider to `sqlite`
3. Revert `DATABASE_URL` to `file:./dev.db`
4. Run `npx prisma generate`

---

## Troubleshooting

### Error: "Database does not exist"
Create the database first:
```sql
CREATE DATABASE your_database_name;
```

### Error: "Connection refused"
- Check your PostgreSQL server is running
- Verify host/port in connection string
- Check firewall rules (allow port 5432)

### Error: "Authentication failed"
- Verify username and password
- Check user has permissions on the database

### Error: "Migration failed"
```bash
# Reset and retry
npx prisma migrate reset
npx prisma migrate dev
```

---

## Need Help?

- Prisma Docs: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- PostgreSQL Docs: https://www.postgresql.org/docs/

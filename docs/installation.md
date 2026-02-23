# Fresh Installation Walkthrough for Developers

## Table of Contents
- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Minimum Version | Download Link |
|----------|----------------|---------------|
| **Node.js** | v18.17.0 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0 or higher | (Comes with Node.js) |
| **PostgreSQL** | v14.0 or higher | [postgresql.org](https://www.postgresql.org/) |
| **Git** | v2.30.0 or higher | [git-scm.com](https://git-scm.com/) |

### Optional Tools

- **Docker** - For containerized PostgreSQL setup
- **pgAdmin** or **DBeaver** - Database management GUI
- **Postman** or **Insomnia** - API testing

### Verify Prerequisites

Run these commands to verify your installations:

```bash
# Check Node.js version
node --version
# Should output: v18.17.0 or higher

# Check npm version
npm --version
# Should output: v9.0.0 or higher

# Check PostgreSQL version
psql --version
# Should output: psql (PostgreSQL) 14.0 or higher

# Check Git version
git --version
# Should output: git version 2.30.0 or higher
```

## System Requirements

### Minimum Hardware Requirements

- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 500 MB free space (1 GB recommended)
- **CPU**: Dual-core processor (Quad-core recommended)

### Supported Operating Systems

- ✅ **Windows** 10/11
- ✅ **macOS** 11.0 (Big Sur) or higher
- ✅ **Linux** Ubuntu 20.04+, Debian 11+, Fedora 35+

## Installation Steps

### Step 1: Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/sutharpratik10/BookEase.git

# Or using SSH
git clone git@github.com:sutharpratik10/BookEase.git

# Navigate to project directory
cd BookEase
```

**Expected Output**:
```
Cloning into 'BookEase'...
remote: Enumerating objects: 1234, done.
remote: Counting objects: 100% (1234/1234), done.
remote: Compressing objects: 100% (567/567), done.
Receiving objects: 100% (1234/1234), 5.67 MiB | 2.34 MiB/s, done.
Resolving deltas: 100% (890/890), done.
```

### Step 2: Checkout Development Branch (if applicable)

```bash
# Switch to development branch
git checkout Dev

# Or create your own feature branch
git checkout -b feature/your-feature-name
```

### Step 3: Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install:
# - Next.js and React
# - TypeScript and related types
# - Drizzle ORM
# - NextAuth.js
# - Tailwind CSS
# - And all other dependencies listed in package.json
```

**Expected Output**:
```
added 1234 packages, and audited 1235 packages in 45s

234 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Note**: If you encounter permission errors on macOS/Linux, do NOT use `sudo`. Instead, fix npm permissions:
```bash
# Fix npm permissions (macOS/Linux)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Step 4: Environment Configuration

#### 4.1 Create Environment File

```bash
# Copy the example environment file
cp env.example .env.local

# Or manually rename it
# Windows: ren env.example .env.local
# macOS/Linux: mv env.example .env.local
```

#### 4.2 Configure Environment Variables

Open `.env.local` in your code editor and update the following variables:

```bash
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/BookEase_db"

# Format: postgresql://[user]:[password]@[host]:[port]/[database]
# Example: postgresql://postgres:mysecretpassword@localhost:5432/BookEase_db

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Generate a secure secret with:
# openssl rand -base64 32
# Or visit: https://generate-secret.vercel.app/32

# ============================================
# OAuth Providers (Optional)
# ============================================

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# ============================================
# Email Configuration (Optional)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourapp.com"

# ============================================
# Payment Gateway (Razorpay)
# ============================================
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Get test credentials from: https://dashboard.razorpay.com/app/keys

# ============================================
# Application Configuration
# ============================================
NODE_ENV="development"
PORT="3000"
```

#### 4.3 Generate Secure Secrets

**For NEXTAUTH_SECRET**:

```bash
# Using OpenSSL (macOS/Linux)
openssl rand -base64 32

# Using Node.js (All platforms)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or visit: https://generate-secret.vercel.app/32
```

**Copy the output and paste it as your `NEXTAUTH_SECRET` value.**

## Database Setup

### Option 1: Local PostgreSQL Installation

#### 1.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE BookEase_db;

# Create user (optional)
CREATE USER BookEase_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE BookEase_db TO BookEase_user;

# Exit psql
\q
```

#### 1.2 Update DATABASE_URL

```bash
# In .env.local
DATABASE_URL="postgresql://BookEase_user:secure_password@localhost:5432/BookEase_db"
```

### Option 2: Docker PostgreSQL Setup

#### 2.1 Create Docker Compose File

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: BookEase_postgres
    restart: always
    environment:
      POSTGRES_USER: BookEase_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: BookEase_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 2.2 Start Docker Container

```bash
# Start PostgreSQL container
docker-compose up -d

# Check if container is running
docker ps

# View logs
docker-compose logs -f postgres
```

#### 2.3 Update DATABASE_URL

```bash
# In .env.local
DATABASE_URL="postgresql://BookEase_user:secure_password@localhost:5432/BookEase_db"
```

### Option 3: Cloud Database (Recommended for Production)

Popular cloud PostgreSQL providers:

- **Supabase** - [supabase.com](https://supabase.com) (Free tier available)
- **Neon** - [neon.tech](https://neon.tech) (Free tier available)
- **Railway** - [railway.app](https://railway.app)
- **Heroku Postgres** - [heroku.com](https://heroku.com)

After creating your database, copy the connection string to `DATABASE_URL`.

### Step 5: Database Migration

#### 5.1 Generate Migration Files

```bash
# Generate migration files based on schema
npx drizzle-kit generate

# This creates migration files in drizzle/ directory
```

**Expected Output**:
```
Reading config file '/path/to/drizzle.config.ts'
✅ Generating migrations...
✅ Migrations generated successfully!

📁 drizzle/
  └── 0000_initial_schema.sql
```

#### 5.2 Apply Migrations to Database

```bash
# Push schema changes to database
npx drizzle-kit push

# This will:
# - Connect to your database
# - Create all tables
# - Set up relationships
# - Apply constraints and indexes
```

**Expected Output**:
```
Reading config file '/path/to/drizzle.config.ts'
✅ Connecting to database...
✅ Connected successfully!
✅ Pushing schema changes...

📦 Tables created:
  ✅ users
  ✅ roles
  ✅ permissions
  ✅ user_roles
  ✅ role_permissions
  ✅ sessions
  ✅ payment_orders
  ✅ payment_transactions
  ✅ subscription_plans
  ✅ user_subscriptions
  ... and more

✅ Schema push completed successfully!
```

**Troubleshooting Migration Issues**:

```bash
# If migration fails, check database connection
npx tsx scripts/test-connection.ts

# Drop and recreate database (⚠️ WARNING: Deletes all data!)
# psql -U postgres -c "DROP DATABASE BookEase_db;"
# psql -U postgres -c "CREATE DATABASE BookEase_db;"
# npx drizzle-kit push
```

### Step 6: Seed Database

```bash
# Seed database with initial data
npx tsx scripts/db-seed.ts

# This will create:
# - Default roles (admin, user)
# - Admin user (admin@example.com / admin)
# - Regular user (user@example.com / user)
# - Subscription plans (Free, Pro, Enterprise)
# - Subscription statuses and renewal types
```

**Expected Output**:
```
🌱 Starting database seeding...

🔐 Seeding roles...
✅ Roles seeded successfully

👥 Seeding users and assigning roles...
  ✅ Admin user created (admin@example.com) with admin role
  ✅ Regular user created (user@example.com) with user role
✅ Users and role assignments completed

🔄 Seeding subscription renewal types...
✅ Subscription renewal types seeded

📊 Seeding subscription statuses...
✅ Subscription statuses seeded

💳 Seeding subscription plans...
✅ Subscription plans seeded

🎉 Database seeding completed successfully!

📝 Default credentials:
   Admin: admin@example.com / admin
   User:  user@example.com / user
```

**Re-run Seeding (Safe)**:
The seeding script is idempotent and can be run multiple times without duplicating data.

## Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# Or with turbopack (faster)
npm run dev -- --turbo
```

**Expected Output**:
```
   ▲ Next.js 15.0.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.5s
 ○ Compiling / ...
 ✓ Compiled / in 3.2s
```

**Open your browser and navigate to**: [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Expected Output**:
```
   ▲ Next.js 15.0.0

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (10/10)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /api/auth/[...nextauth]             0 B             0 B
├ ○ /auth/login                         3.8 kB         93.9 kB
└ ○ /protected/dashboard                4.5 kB         94.6 kB

○  (Static)  prerendered as static content

   ▲ Next.js 15.0.0
   - Local:        http://localhost:3000
```

## Verification

### Step 1: Check Application Health

Visit these URLs to verify installation:

1. **Homepage**: [http://localhost:3000](http://localhost:3000)
   - Should display landing page

2. **Login Page**: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
   - Should display login form

3. **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - Should return `{ "status": "ok" }`

### Step 2: Test Authentication

#### Login as Admin

1. Navigate to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Enter credentials:
   - **Email**: `admin@example.com`
   - **Password**: `admin`
3. Click "Sign In"
4. You should be redirected to the admin dashboard

#### Login as Regular User

1. Sign out
2. Login with:
   - **Email**: `user@example.com`
   - **Password**: `user`
3. You should be redirected to the user dashboard

### Step 3: Verify Database Connection

```bash
# Run database connection test
npx tsx scripts/test-connection.ts
```

**Expected Output**:
```
✅ Database connection successful!
📊 Database info:
   - Database: BookEase_db
   - Tables: 25
   - Version: PostgreSQL 15.3
```

### Step 4: Check Available Routes

Test these API endpoints:

```bash
# Using curl (macOS/Linux)
curl http://localhost:3000/api/health

# Using PowerShell (Windows)
Invoke-WebRequest -Uri http://localhost:3000/api/health

# Expected response: {"status":"ok"}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port 3000 Already in Use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find and kill process using port 3000

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use a different port
PORT=3001 npm run dev
```

#### Issue 2: Database Connection Failed

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:

1. **Check if PostgreSQL is running**:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   
   # Windows
   # Check Services app for PostgreSQL
   ```

2. **Verify DATABASE_URL** in `.env.local`:
   ```bash
   # Format should be:
   postgresql://username:password@localhost:5432/database_name
   ```

3. **Test database connection**:
   ```bash
   psql -U postgres -d BookEase_db
   ```

#### Issue 3: Migration Errors

**Error**:
```
Error: relation "users" already exists
```

**Solution**:
```bash
# Option 1: Drop and recreate database
psql -U postgres -c "DROP DATABASE BookEase_db;"
psql -U postgres -c "CREATE DATABASE BookEase_db;"
npx drizzle-kit push

# Option 2: Use introspection to sync
npx drizzle-kit introspect
```

#### Issue 4: Module Not Found

**Error**:
```
Error: Cannot find module '@/lib/auth'
```

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### Issue 5: TypeScript Errors

**Error**:
```
Type error: Cannot find name 'xxx'
```

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Press: Ctrl+Shift+P (or Cmd+Shift+P)
# Type: "TypeScript: Restart TS Server"

# Or rebuild TypeScript
npm run build
```

#### Issue 6: Environment Variables Not Loading

**Error**:
```
Error: NEXTAUTH_SECRET is not defined
```

**Solution**:

1. Ensure file is named `.env.local` (not `.env`)
2. Restart development server after changing env vars
3. Check for typos in variable names
4. Ensure no spaces around `=` sign:
   ```bash
   # ❌ Wrong
   NEXTAUTH_SECRET = "your-secret"
   
   # ✅ Correct
   NEXTAUTH_SECRET="your-secret"
   ```

#### Issue 7: Razorpay Integration Issues

**Error**:
```
Missing Razorpay credentials
```

**Solution**:

1. Get test keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Add to `.env.local`:
   ```bash
   RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
   ```
3. Restart server

### Getting Help

If you encounter issues not covered here:

1. **Check Documentation**: Review [README.md](../README.md) and docs folder
2. **Search Issues**: Look for similar issues on GitHub
3. **Enable Debug Logging**:
   ```bash
   # Add to .env.local
   DEBUG=true
   LOG_LEVEL=debug
   ```
4. **Check Logs**:
   - Next.js logs in terminal
   - Browser console (F12)
   - Database logs
5. **Create Issue**: [GitHub Issues](https://github.com/sutharpratik10/Jobs/issues)

## Next Steps

### 1. Explore the Application

- **Authentication**: Try login, signup, password reset
- **RBAC System**: Explore role-based access control
- **Payment Gateway**: Test Razorpay integration (test mode)
- **Subscription Plans**: View and manage plans

### 2. Read Documentation

- [Overview](./01-OVERVIEW.md) - System architecture
- [Authentication](./02-AUTHENTICATION.md) - Auth system details
- [RBAC](./03-RBAC.md) - Role-based access control
- [Database](./04-DATABASE.md) - Database schema
- [API Routes](./05-API-ROUTES.md) - API documentation
- [Routing](./06-ROUTING.md) - Routing system
- [Payment Gateway](./07-PAYMENT-GATEWAY.md) - Payment integration

### 3. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production
npm run build

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature
```

### 4. Configure OAuth Providers

#### Google OAuth Setup

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Copy Client ID and Secret to `.env.local`

#### GitHub OAuth Setup

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add authorization callback URL:
   ```
   http://localhost:3000/api/auth/callback/github
   ```
4. Copy Client ID and Secret to `.env.local`

### 5. Configure Email Service

#### Using Gmail

1. Enable 2-Factor Authentication
2. Generate App Password
3. Update `.env.local`:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   ```

### 6. Set Up Development Tools

#### VS Code Extensions (Recommended)

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **ESLint**
- **PostgreSQL**
- **GitLens**

#### Configure VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Production Deployment

### Environment Variables for Production

```bash
# Update .env.production
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="your-production-database-url"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-live-secret"
```

### Deployment Platforms

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Railway**
- **AWS**
- **DigitalOcean**

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Use production database credentials
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use live Razorpay keys
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Review security headers

## Summary

You should now have a fully functional BookEase application running locally! 🎉

**Quick Command Reference**:

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript types

# Database
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit push        # Apply migrations
npx tsx scripts/db-seed.ts  # Seed database

# Testing
npm test                # Run tests (if configured)
npm run test:e2e        # Run E2E tests (if configured)
```

**Default Credentials**:
- Admin: `admin@example.com` / `admin`
- User: `user@example.com` / `user`

**Important Links**:
- Application: [http://localhost:3000](http://localhost:3000)
- API Docs: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Admin Panel: [http://localhost:3000/protected/admin](http://localhost:3000/protected/admin)

**Happy Coding! 🚀**
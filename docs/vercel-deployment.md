# Deploying AuthPay to Vercel

Vercel is the creator of Next.js and provides the most seamless hosting experience. Unlike a traditional VPS deployment, Vercel uses a **Serverless** architecture. 

Because of this, there are a few important differences:
1. You do not need PM2, HAProxy, or PgBouncer.
2. Vercel automatically creates serverless functions for your API routes.
3. You **MUST** use a cloud-hosted Postgres database (like Supabase, Neon, or Railway).

## Prerequisites

1. A Vercel account (linked to your GitHub).
2. A Cloud Postgres Database (e.g., Supabase or Neon).
3. The AuthPay codebase pushed to a GitHub repository.

## Step 1: Database Setup (Crucial for Vercel)

Vercel serverless functions scale up and down rapidly. If they connect directly to your database, they will exhaust all available connections quickly. 
**You must use a connection-pooling URL.**

- **If using Supabase:** Go to Database Settings -> Connection Pooling. Use the "Transaction" mode connection string (usually port 6543) for your `DATABASE_URL`.
- **If using Neon:** Neon inherently supports connection pooling. Copy the pooled connection string.

## Step 2: Import Project to Vercel

1. Log in to your Vercel Dashboard.
2. Click **Add New... -> Project**.
3. Select your AuthPay GitHub repository and click **Import**.
4. Leave the Framework Preset as **Next.js**.
5. Leave the Root Directory as `/`.

## Step 3: Configure Environment Variables

Before clicking Deploy, expand the **Environment Variables** section. You must add all the production secrets from your `.env.production` file. 

At a minimum, ensure you add:

| Variable Name | Value |
| --- | --- |
| `DATABASE_URL` | Your pooled cloud Postgres URL. |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | The production domain (e.g., `https://authpay.vercel.app`) |
| `NEXTAUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| `AUTH_SECRET` | A 32+ character random string |
| `NEXTAUTH_SECRET` | A 32+ character random string |
| `TOTP_ENCRYPTION_KEY` | A 64 character hex string |
| `RAZORPAY_KEY_ID` | Your live Razorpay Key ID (if using) |
| `RAZORPAY_KEY_SECRET` | Your live Razorpay Key Secret |
| `EMAIL_*` | Your SMTP credentials for sending emails |

> **Tip:** You can bulk-copy the contents of your `.env.production` file and paste it into the first variable name field on Vercel; it will automatically extract all keys and values.

## Step 4: Deploy

Click the **Deploy** button.

### What happens during deployment?
Because we added a `vercel.json` file to the repository, Vercel will run:
1. `npm install`
2. `npm run db:migrate` (This pushes your Drizzle database schema to your cloud database)
3. `next build` (Builds the frontend and API routes)

Once finished, your application will be live and fully functional!

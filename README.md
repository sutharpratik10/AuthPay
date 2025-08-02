# AccessLayer – Next.js Authentication & Multi‑Tenant API Layer

AccessLayer is a modular authentication and API layer built on **Next.js** and **NextAuth.js**.  
It supports email/password authentication, multiple OAuth providers (Google, GitHub, Facebook, Microsoft Azure AD, Apple), and robust features like 2FA, email verification, password reset, and flexible session management.

Built with a scalable **multi-tenant architecture**, this solution is ideal for SaaS applications needing isolated tenant data and granular access control.

---

## 🔑 Features

- ✅ **Email/Password Login**
- 🔐 **Two-Factor Authentication (2FA)** using TOTP
- 💌 **Email Verification** & **Password Reset**
- 🌐 **OAuth Support**:
  - Google
  - GitHub
  - Facebook
  - Azure AD
- 👥 **Multi-Tenant Architecture** with route-level tenant resolution
- 🏷️ **Role-Based Access Control** (RBAC)
- 🌙 **User Preferences** like theme & session info
- 🔁 **Session Management** using JWT with expiration & refresh support
- 🔧 Modular route management defined in `ROUTES-ARCHITECTURE.md`

---

## 🏗️ Project Structure
```
/src
  ├── auth.config.ts         # Auth providers, session strategy, callbacks
  ├── lib/auth-context.tsx   # User session context & preferences
  ├── routes/ROUTES-ARCHITECTURE.md  # Logical routing architecture
  ├── app/                   # Next.js App Directory
  ├── components/            # UI components (e.g., OTPInput)
  └── utils/                 # Helper functions

⚙️ Installation Guide

    1. Clone the Repository
        git clone https://github.com/sutharpratik10/AccessLayer.git
        cd AccessLayer

    2. Install Dependencies
        npm install
        # or
        yarn install

    3. Set Up Environment Variables
        Create a .env.local file based on the provided .env.example.
        cp .env.example .env.local

        Edit the file to include your credentials:
        DATABASE_URL=postgresql://user:pass@localhost:5432/db
        NEXTAUTH_SECRET=your_random_secret
        NEXTAUTH_URL=http://localhost:3000

        # OAuth Provider credentials
        GITHUB_ID=...
        GITHUB_SECRET=...
        GOOGLE_ID=...
        GOOGLE_SECRET=...
        FACEBOOK_ID=...
        FACEBOOK_SECRET=...
        AZURE_AD_CLIENT_ID=...
        AZURE_AD_CLIENT_SECRET=...

    4. Run the Application Locally
        npm run dev
        Visit: http://localhost:3000


🚀 Deployment Guide (Production)

    1. Set Up a Production Server
        Use a VPS or cloud VM (e.g., AWS EC2, DigitalOcean Droplet).
        Ensure Node.js (v18+), npm/yarn, and PostgreSQL are installed.
        Secure the server with a firewall and SSH keys.

    2. Clone and Build the Project
        git clone https://github.com/sutharpratik10/AccessLayer.git
        cd AccessLayer
        npm install

    3. Configure Production Environment
        cp .env.example .env.production

        Edit .env.production:
            NODE_ENV=production
            DATABASE_URL=postgresql://user:pass@your-prod-host/db
            NEXTAUTH_URL=https://yourdomain.com
            NEXTAUTH_SECRET=your_strong_secret_key
    
    4. Build and Start
        npm run build
        npm start
        #Tip: Use a process manager like PM2 to keep the app running:

        npm install -g pm2
        pm2 start npm --name accesslayer -- start
        pm2 save

    5. Reverse Proxy with Nginx (optional but recommended)
        Sample Nginx config:
        ```  server {
                listen 80;
                server_name yourdomain.com;

                location / {
                    proxy_pass http://localhost:3000;
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection 'upgrade';
                    proxy_set_header Host $host;
                    proxy_cache_bypass $http_upgrade;
                }
            }```

        Enable SSL using Let's Encrypt with Certbot.

📁 OAuth Provider Setup
    Register and configure the app with:
        GitHub Developer
        Google Cloud Console
        Facebook Developers
        Microsoft Azure


🔐 Optional: Enable 2FA
    To enable Two-Factor Authentication:
        Navigate to the Profile or Security settings page.
        Enter the 6-digit OTP to verify and enable 2FA.

📁 OAuth Provider Setup
    You'll need to register your app with the following providers:
        GitHub: Developer Settings
        Google: Google Cloud Console
        Facebook: Facebook Developers
        Apple: Apple Developer
        Azure AD: Microsoft Azure Portal


👤 Author
    Developed by Pratik Suthar





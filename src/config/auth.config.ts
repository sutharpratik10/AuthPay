import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import AzureAD from "next-auth/providers/azure-ad";
import Apple from "next-auth/providers/apple";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";
import { SessionService } from "@/server/services/session";

const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        skipPasswordCheck: { label: "Skip Password Check", type: "text" }, // For 2FA completion
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;
          const skipPasswordCheck = credentials.skipPasswordCheck === 'true';

          const user = await db.query.users.findFirst({
            where: (usersTable) => eq(usersTable.email, email),
            with: {
              userPreferences: true
            }
          });

          if (!user) {
            return null;
          }

          // If the user has no password and we aren't skipping the check, reject
          if (!user.password && !skipPasswordCheck) {
            return null;
          }

          // Check if account is locked
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            throw new Error("Account is temporarily locked due to multiple failed login attempts. Please try again later.");
          }

          // Note: We allow unverified users to log in, but they'll see a verification banner
          // This provides better UX than blocking them completely

          // Skip password check if this is a 2FA completion or Passwordless
          if (!skipPasswordCheck) {
            if (!user.password) {
              return null; // Should not happen due to above check, but TypeScript safety
            }

            const isPasswordValid = await bcrypt.compare(
              password,
              user.password
            );

            if (!isPasswordValid) {
              // Increment failed login attempts
              const failedAttempts = (user.failedLoginAttempts || 0) + 1;
              let lockedUntil: string | null = null;

              if (failedAttempts >= 5) {
                // Lock for 15 minutes
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                console.log(`Account locked for user: ${email}`);
              }

              await db.update(users)
                .set({
                  failedLoginAttempts: failedAttempts,
                  lockedUntil: lockedUntil
                })
                .where(eq(users.id, user.id));

              return null;
            }

            // Reset failed login attempts on successful password match
            if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
              await db.update(users)
                .set({
                  failedLoginAttempts: 0,
                  lockedUntil: null
                })
                .where(eq(users.id, user.id));
            }

            // Check if user has 2FA enabled
            const has2FA = user.userPreferences?.twoFactorAuth === true;
            if (has2FA) {
              // Return null to indicate failed authentication (2FA required)
              // The frontend will handle checking 2FA status and redirecting
              return null;
            }
          }

          // Create a session record for tracking
          try {
            await SessionService.createSession({
              userId: user.id,
              userAgent: "NextAuth Session", // You could pass actual user agent here
              ipAddress: undefined, // You could pass actual IP here
            });
          } catch (sessionError) {
            console.error("Failed to create session record:", sessionError);
            // Don't fail authentication just because session creation failed
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified ?? false
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  // Configure security settings
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};

export default authConfig;

import NextAuth from "next-auth";
import { db } from "@/db";
import authConfig from "./auth.config";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { randomUUID } from "crypto";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
  basePath: "/api/auth",
  callbacks: {    async signIn({ user, account }) {
      // Allow credentials provider to handle its own logic
      if (account?.provider === "credentials") {
        return true;
      }

      // Handle OAuth providers
      if (account?.provider && ["google", "github", "facebook", "azure-ad", "apple"].includes(account.provider)) {
        try {
          const { users } = await import("@/db/schema");
          const { eq } = await import("drizzle-orm");

          // Check if user already exists
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          });          if (existingUser) {
            // User exists, update their information and mark email as verified
            await db.update(users)
              .set({
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                isEmailVerified: true, // OAuth users don't need email verification
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .where(eq(users.id, existingUser.id));

            // Check if account record exists for this provider
            const { accounts } = await import("@/db/schema");
            const existingAccount = await db.query.accounts.findFirst({
              where: (accountsTable, { and }) => and(
                eq(accountsTable.userId, existingUser.id),
                eq(accountsTable.provider, account.provider!)
              ),
            });            if (!existingAccount) {
              // Create account record for this OAuth provider
              await db.insert(accounts).values({
                userId: existingUser.id,
                type: account.type!,
                provider: account.provider!,
                providerAccountId: account.providerAccountId!,
                refresh_token: account.refresh_token ? String(account.refresh_token) : null,
                access_token: account.access_token ? String(account.access_token) : null,
                expires_at: account.expires_at ? Number(account.expires_at) : null,
                token_type: account.token_type ? String(account.token_type) : null,
                scope: account.scope ? String(account.scope) : null,
                id_token: account.id_token ? String(account.id_token) : null,
                session_state: account.session_state ? String(account.session_state) : null,
              });
            }

            // Update the user object for the session
            user.id = existingUser.id;
            return true;
          } else {

            // Create new user with email verified
            const newUserId = randomUUID();

            await db.insert(users).values({
              id: newUserId,
              email: user.email!,
              name: user.name || "",
              image: user.image || null,
              isEmailVerified: true, // OAuth users don't need email verification
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            });            
            // Create default user preferences
            const { userPreferences, accounts } = await import("@/db/schema");
            await db.insert(userPreferences).values({
              userId: newUserId,
              emailNotifications: true,
              securityAlerts: true,
              productUpdates: false,
              profileVisibility: true,
              theme: 'system',
              twoFactorAuth: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });            
            // Create account record for OAuth provider
            await db.insert(accounts).values({
              userId: newUserId,
              type: account.type!,
              provider: account.provider!,
              providerAccountId: account.providerAccountId!,
              refresh_token: account.refresh_token ? String(account.refresh_token) : null,
              access_token: account.access_token ? String(account.access_token) : null,
              expires_at: account.expires_at ? Number(account.expires_at) : null,
              token_type: account.token_type ? String(account.token_type) : null,
              scope: account.scope ? String(account.scope) : null,
              id_token: account.id_token ? String(account.id_token) : null,
              session_state: account.session_state ? String(account.session_state) : null,
            });

            // Update the user object for the session
            user.id = newUserId;
            return true;
          }
        } catch (error) {
          console.error("Error handling OAuth sign in:", error);
          return false;
        }
      }
      
      return true;
    },    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.isEmailVerified !== undefined && session.user) {
        session.user.isEmailVerified = token.isEmailVerified;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (token.name && session.user) {
        session.user.name = token.name;
      }

      return session;
    },    async jwt({ token, user, trigger, session }: { token: JWT; user?: { isEmailVerified?: boolean; role?: string }; trigger?: string; session?: { name?: string } }) {
      if (!token.sub) return token;

      // Handle session update trigger (when update() is called)
      if (trigger === 'update' && session) {
        if (session.name !== undefined) {
          token.name = session.name;
        }
        return token;
      }

      // Get user from database to check if email is verified and other data
      if (user) {
        token.isEmailVerified = user.isEmailVerified;
        token.role = user.role;
      } else {
        // Only query database if we don't have the verification status or it's been a while
        const shouldRefresh = !token.isEmailVerified || 
          !token.role ||
          !token.lastVerifiedCheck || 
          (Date.now() - (token.lastVerifiedCheck as number)) > 5 * 60 * 1000; // 5 minutes

        if (shouldRefresh) {
          try {
            const userRecord = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, token.sub as string),
              columns: { isEmailVerified: true, name: true, roleId: true },
            });

            if (userRecord) {
              token.isEmailVerified = userRecord.isEmailVerified ?? false;
              token.name = userRecord.name;
              if (userRecord.roleId != null) {
                const roleRecord = await db.query.roles.findFirst({
                  where: (roles, { eq }) => eq(roles.id, userRecord.roleId as string),
                  columns: { name: true },
                });
                token.role = roleRecord?.name ?? 'user';
              } else {
                token.role = 'user';
              }
              token.lastVerifiedCheck = Date.now();
            }
          } catch (error) {
            console.error('Error in jwt callback:', error);
            // Don't block the token if there's a database error
          }
        }
      }

      return token;
    }
  },
  ...authConfig,
});

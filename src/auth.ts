import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import authConfig from "./auth.config";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },  pages: {
    signIn: "/auth/login",
    // Note: NextAuth v5 beta doesn't support 'signup' in PagesOptions
    // The signIn page should handle the signup flow as well
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },  events: {
    async linkAccount({ user }) {
      // When an account is linked (OAuth sign-in), automatically verify the email
      if (user && user.id) {
        await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, user.id as string)
        }).then(async (dbUser) => {
          if (dbUser && !dbUser.isEmailVerified) {
            await db
              .update(users)
              .set({ isEmailVerified: true })
              .where(eq(users.id, user.id as string));
          }
        });
      }
    }
  },callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.isEmailVerified !== undefined && session.user) {
        session.user.isEmailVerified = token.isEmailVerified;
      }

      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: { isEmailVerified?: boolean } }) {
      if (!token.sub) return token;

      // Get user from database to check if email is verified
      if (user) {
        token.isEmailVerified = user.isEmailVerified;
      } else {        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, token.sub as string)
        });

        if (dbUser) {
          // Convert null to false to satisfy type checking
          token.isEmailVerified = dbUser.isEmailVerified ?? false;
        }
      }

      return token;
    }
  },
  ...authConfig,
});

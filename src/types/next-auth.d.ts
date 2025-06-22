import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in User interface with isEmailVerified
   */
  interface User extends DefaultUser {
    isEmailVerified?: boolean;
  }

  /**
   * Extend the built-in Session interface
   */
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isEmailVerified?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT interface with isEmailVerified
   */
  interface JWT {
    isEmailVerified?: boolean;
  }
}

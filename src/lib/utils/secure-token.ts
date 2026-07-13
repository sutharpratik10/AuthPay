import jwt from 'jsonwebtoken';

const VERIFICATION_TOKEN_PURPOSE = 'email-verification';
const TOKEN_EXPIRES_IN = '1h';
const ALGORITHM = 'HS256';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('Missing authentication secret: AUTH_SECRET or NEXTAUTH_SECRET must be set');
  }
  return secret;
}

export interface VerificationTokenPayload {
  email: string;
  userId: string;
}

export function createVerificationToken(payload: VerificationTokenPayload): string {
  const secret = getSecret();

  return jwt.sign(
    {
      email: payload.email,
      userId: payload.userId,
      purpose: VERIFICATION_TOKEN_PURPOSE,
    },
    secret,
    { expiresIn: TOKEN_EXPIRES_IN, algorithm: ALGORITHM }
  );
}

export function verifyVerificationToken(token: string): VerificationTokenPayload | null {
  try {
    const secret = getSecret();
    const decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] }) as jwt.JwtPayload;

    if (decoded.purpose !== VERIFICATION_TOKEN_PURPOSE) {
      return null;
    }

    if (typeof decoded.email !== 'string' || typeof decoded.userId !== 'string') {
      return null;
    }

    return { email: decoded.email, userId: decoded.userId };
  } catch {
    return null;
  }
}

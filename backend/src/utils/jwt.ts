import jwt, { JwtPayload } from 'jsonwebtoken';

// Read lazily so the secret is always loaded from .env first
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '7d', algorithm: 'HS256' });
};

export const verifyToken = (token: string): { userId: string } => {
  const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] }) as JwtPayload;
  if (typeof decoded.userId !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { userId: decoded.userId };
};
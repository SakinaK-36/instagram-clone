import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._]{3,30}$/;

const toPublicUser = (user: {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
});

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002';

export const register = async (req: Request, res: Response) => {
  const { email, username, password, fullName } = req.body ?? {};

  if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email, username and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();
  const cleanFullName = typeof fullName === 'string' ? fullName.trim().slice(0, 100) : '';

  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (!USERNAME_RE.test(cleanUsername)) {
    return res.status(400).json({
      message: 'Username must be 3-30 characters: letters, numbers, dots or underscores',
    });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'Password must be between 8 and 72 characters' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { username: { equals: cleanUsername, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        fullName: cleanFullName || null,
      },
    });

    const token = generateToken(user.id);
    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    // Two signups with the same email/username at the same moment
    if (isUniqueViolation(error)) {
      return res.status(400).json({ message: 'User or email already exists' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    return res.status(200).json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
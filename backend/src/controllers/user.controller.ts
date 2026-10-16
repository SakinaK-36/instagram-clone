import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getIO } from '../socket';

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002';

// Get User Profile details & posts
export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const username = (req.params.username as string).trim();
  const currentUserId = req.userId!;

  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
            likes: { select: { userId: true } },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            },
          },
        },
        followedBy: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send counts only, never the raw follower/following lists
    const { followedBy, following, ...profile } = user;

    return res.status(200).json({
      ...profile,
      followersCount: followedBy.length,
      followingCount: following.length,
      isFollowing: followedBy.some((f) => f.followerId === currentUserId),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// Toggle Follow / Unfollow
export const toggleFollow = async (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = req.params.userId as string;
  const currentUserId = req.userId!;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Try to unfollow first; if nothing was deleted, follow instead
    const removed = await prisma.follows.deleteMany({
      where: { followerId: currentUserId, followingId: targetUserId },
    });

    if (removed.count > 0) {
      return res.status(200).json({ success: true, following: false, message: 'Unfollowed user' });
    }

    try {
      await prisma.follows.create({
        data: { followerId: currentUserId, followingId: targetUserId },
      });
    } catch (e) {
      // A double-click can race; the unique key means we are already following
      if (!isUniqueViolation(e)) throw e;
    }

    // Notify the followed user (once per follower)
    try {
      const alreadyNotified = await prisma.notification.findFirst({
        where: { type: 'FOLLOW', issuerId: currentUserId, receiverId: targetUserId },
        select: { id: true },
      });

      if (!alreadyNotified) {
        const notification = await prisma.notification.create({
          data: { type: 'FOLLOW', issuerId: currentUserId, receiverId: targetUserId },
          include: {
            issuer: { select: { id: true, username: true, avatarUrl: true } },
          },
        });
        getIO().to(targetUserId).emit('new_notification', notification);
      }
    } catch (notifErr) {
      console.error('Failed to create follow notification:', notifErr);
    }

    return res.status(201).json({ success: true, following: true, message: 'Followed user' });
  } catch (error) {
    console.error('Error toggling follow:', error);
    return res.status(500).json({ message: 'Failed to process follow request' });
  }
};

// Get basic info for one user by id (used by the chat header)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, username: true, avatarUrl: true, fullName: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Search users by username or full name
export const searchUsers = async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';

  if (!query) {
    return res.status(200).json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
      orderBy: { username: 'asc' },
      take: 10,
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Search failed' });
  }
};
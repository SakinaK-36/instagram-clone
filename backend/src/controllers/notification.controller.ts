import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      include: {
        issuer: { select: { id: true, username: true, avatarUrl: true } },
        post: { select: { id: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { receiverId: req.userId!, read: false },
    });
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    return res.status(500).json({ message: 'Failed to count notifications' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { receiverId: req.userId!, read: false },
      data: { read: true },
    });
    return res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark notifications' });
  }
};
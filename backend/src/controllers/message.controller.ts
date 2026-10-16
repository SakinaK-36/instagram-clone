import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getIO } from '../socket';

const userSelect = { id: true, username: true, avatarUrl: true } as const;

// Get list of recent chat conversations for the sidebar
export const getConversationsList = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    // NOTE: this loads the full history. Fine for now; later, a Conversation
    // table or a raw "DISTINCT ON" query will scale better.
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    const unread = await prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, read: false },
      _count: { _all: true },
    });
    const unreadBySender = new Map(unread.map((u) => [u.senderId, u._count._all]));

    const contactsMap = new Map<string, unknown>();
    messages.forEach((msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!contactsMap.has(otherUser.id)) {
        contactsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          unreadCount: unreadBySender.get(otherUser.id) ?? 0,
        });
      }
    });

    return res.status(200).json(Array.from(contactsMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ message: 'Failed to fetch conversation list' });
  }
};

// Get conversation between current user and target user
// Optional query params: ?limit=50 (max 200, default 100) and ?before=<ISO date> for older pages
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const targetUserId = req.params.userId as string;

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const beforeRaw = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
  const before = beforeRaw && !isNaN(beforeRaw.getTime()) ? beforeRaw : undefined;

  try {
    // Opening the chat marks the other person's messages as read
    await prisma.message.updateMany({
      where: { senderId: targetUserId, receiverId: userId, read: false },
      data: { read: true },
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Newest-first from the DB, returned oldest-first for display
    return res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Save new message to DB and emit Socket event
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  const senderId = req.userId!;
  const receiverId = req.params.userId as string;
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!content) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ message: 'Message cannot be longer than 2000 characters' });
  }
  if (receiverId === senderId) {
    return res.status(400).json({ message: 'You cannot message yourself' });
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    // Broadcast live message to the recipient's socket room
    getIO().to(receiverId).emit('receive_message', message);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
};
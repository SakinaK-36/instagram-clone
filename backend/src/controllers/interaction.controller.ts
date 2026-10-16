import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getIO } from '../socket';

const issuerSelect = { id: true, username: true, avatarUrl: true } as const;
const postSelect = { id: true, imageUrl: true } as const;

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002';

// Toggle Like / Unlike
export const toggleLike = async (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Try to remove an existing like; if there was none, create one
    const removed = await prisma.like.deleteMany({ where: { userId, postId } });
    let isLiked = false;

    if (removed.count === 0) {
      try {
        await prisma.like.create({ data: { userId, postId } });
      } catch (e) {
        // A double-click can race; the unique constraint means it is already liked
        if (!isUniqueViolation(e)) throw e;
      }
      isLiked = true;

      // Notify the author (not for your own posts, and only once per liker per post)
      if (post.authorId !== userId) {
        try {
          const alreadyNotified = await prisma.notification.findFirst({
            where: { type: 'LIKE', issuerId: userId, receiverId: post.authorId, postId },
            select: { id: true },
          });

          if (!alreadyNotified) {
            const notification = await prisma.notification.create({
              data: { type: 'LIKE', issuerId: userId, receiverId: post.authorId, postId },
              include: {
                issuer: { select: issuerSelect },
                post: { select: postSelect },
              },
            });
            getIO().to(post.authorId).emit('new_notification', notification);
          }
        } catch (notifErr) {
          console.error('Failed to create notification for like:', notifErr);
        }
      }
    }

    const likesCount = await prisma.like.count({ where: { postId } });

    // Broadcast updated like count to all connected users
    getIO().emit('post_liked', { postId, userId, liked: isLiked, likesCount });

    return res.status(200).json({ liked: isLiked, likesCount });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ message: 'Failed to process like' });
  }
};

// Add Comment
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!content) {
    return res.status(400).json({ message: 'Comment text cannot be empty' });
  }
  if (content.length > 500) {
    return res.status(400).json({ message: 'Comment cannot be longer than 500 characters' });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: { content, postId, userId },
      include: { user: { select: issuerSelect } },
    });

    // Notify the author (not for your own posts)
    if (post.authorId !== userId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            type: 'COMMENT',
            issuerId: userId,
            receiverId: post.authorId,
            postId,
            commentId: comment.id,
          },
          include: {
            issuer: { select: issuerSelect },
            post: { select: postSelect },
          },
        });
        getIO().to(post.authorId).emit('new_notification', notification);
      } catch (notifErr) {
        console.error('Failed to create notification for comment:', notifErr);
      }
    }

    // Broadcast new comment to all active feeds
    getIO().emit('new_comment', { postId, comment });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};
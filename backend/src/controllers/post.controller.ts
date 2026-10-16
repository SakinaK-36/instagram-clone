import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { deleteImageByUrl } from '../config/cloudinary';

const authorSelect = { id: true, username: true, avatarUrl: true } as const;

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file as { path?: string } | undefined;
    const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';

    if (!file?.path) {
      return res.status(400).json({ message: 'Image file is required' });
    }
    if (caption.length > 2200) {
      return res.status(400).json({ message: 'Caption cannot be longer than 2200 characters' });
    }

    const post = await prisma.post.create({
      data: {
        caption,
        imageUrl: file.path, // Cloudinary secure URL
        authorId: req.userId!,
      },
      include: { author: { select: authorSelect } },
    });

    // Same shape as the feed, so the UI can render it straight away
    return res.status(201).json({ ...post, likes: [], comments: [] });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

// Optional query params: ?limit=50 (max 100) and ?before=<ISO date> to load older posts
export const getPosts = async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const beforeRaw = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
  const before = beforeRaw && !isNaN(beforeRaw.getTime()) ? beforeRaw : undefined;

  try {
    const posts = await prisma.post.findMany({
      where: before ? { createdAt: { lt: before } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: authorSelect },
        likes: { select: { userId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: authorSelect } },
        },
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// Delete a post if owned by the current user
export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, imageUrl: true },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.authorId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await prisma.post.delete({ where: { id: postId } });
    await deleteImageByUrl(post.imageUrl);
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};
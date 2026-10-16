import { Router } from 'express';
import { createPost, getPosts, deletePost } from '../controllers/post.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../config/cloudinary';

const router = Router();

router.post('/', authenticateToken, upload.single('image'), createPost);
router.get('/', authenticateToken, getPosts);
router.delete('/:postId', authenticateToken, deletePost); // <--- Ensure this route exists

export default router;
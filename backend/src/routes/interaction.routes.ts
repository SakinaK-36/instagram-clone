import { Router } from 'express';
import { toggleLike, addComment } from '../controllers/interaction.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/like/:postId', authenticateToken, toggleLike);
router.post('/comment/:postId', authenticateToken, addComment);

export default router;
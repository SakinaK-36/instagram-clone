import { Router } from 'express';
import {
  getUserById,
  getUserProfile,
  searchUsers,
  toggleFollow,
} from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile/:username', authenticateToken, getUserProfile);
router.post('/follow/:userId', authenticateToken, toggleFollow);
router.get('/id/:id', authenticateToken, getUserById);
router.get('/search', authenticateToken, searchUsers);

export default router;
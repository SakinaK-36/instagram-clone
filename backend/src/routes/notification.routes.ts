import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from '../controllers/notification.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/read', authenticateToken, markAsRead);

export default router;
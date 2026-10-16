import { Router } from 'express';
import { getMessages, sendMessage, getConversationsList } from '../controllers/message.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/conversations', authenticateToken, getConversationsList);
router.get('/:userId', authenticateToken, getMessages);
router.post('/:userId', authenticateToken, sendMessage);

export default router;
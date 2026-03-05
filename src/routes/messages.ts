import { Router } from 'express';
import { getRecipients, sendMessage } from '../controllers/messages';

const router = Router();

router.get('/recipients', getRecipients);
router.post('/send', sendMessage);

export default router;

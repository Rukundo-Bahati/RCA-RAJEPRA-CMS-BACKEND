import { Router } from 'express';
import { getRecipients, sendMessage, getMessages, saveDraft } from '../controllers/messages';

const router = Router();

router.get('/recipients', getRecipients);
router.get('/', getMessages);
router.post('/send', sendMessage);
router.post('/draft', saveDraft);

export default router;

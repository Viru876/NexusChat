import { Router } from 'express';
import {
  sendMessage,
  getThreadReplies,
  searchMessages,
  deleteMessage,
  pinMessage,
  getPinnedMessages,
  getSharedFiles,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingle, sendMessage);
router.get('/search', searchMessages);
router.get('/pinned', getPinnedMessages);
router.get('/files', getSharedFiles);
router.get('/:id/thread', getThreadReplies);
router.post('/:id/pin', pinMessage);
router.delete('/:id', deleteMessage);

export default router;

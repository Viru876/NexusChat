import { Router } from 'express';
import {
  createChannel,
  getChannels,
  getChannel,
  getChannelMessages,
  joinChannel,
  deleteChannel,
} from '../controllers/channelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createChannel);
router.get('/workspace/:workspaceId', getChannels);
router.get('/:id', getChannel);
router.get('/:id/messages', getChannelMessages);
router.post('/:id/join', joinChannel);
router.delete('/:id', deleteChannel);

export default router;

import { Router } from 'express';
import { getOrCreateDM, getDMMessages, getMyDMs } from '../controllers/dmController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', getOrCreateDM);
router.get('/', getMyDMs);
router.get('/:id/messages', getDMMessages);

export default router;

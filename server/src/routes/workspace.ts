import { Router } from 'express';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  getWorkspacePreview,
  joinWorkspace,
  leaveWorkspace,
  deleteWorkspace,
  removeMember,
  inviteMember,
} from '../controllers/workspaceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createWorkspace);
router.get('/', getMyWorkspaces);
router.get('/:id/preview', getWorkspacePreview);
router.get('/:id', getWorkspace);
router.post('/:id/join', joinWorkspace);
router.post('/:id/leave', leaveWorkspace);
router.delete('/:id', deleteWorkspace);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/invite', inviteMember);

export default router;

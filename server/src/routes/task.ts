import { Router } from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  assignTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/workspace/:workspaceId', getTasks);
router.put('/:id', updateTask);
router.post('/:id/assign', assignTask);
router.delete('/:id', deleteTask);

export default router;

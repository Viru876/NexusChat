import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  searchUsers,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, uploadAvatar, updateProfile);
router.get('/users/search', authenticate, searchUsers);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;

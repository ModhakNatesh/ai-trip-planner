import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  // If there's a token, try to authenticate
  authenticateToken(req, res, next);
};

// Auth routes
router.post('/verify-token', AuthController.verifyToken);
router.get('/user', authenticateToken, AuthController.getUser);
router.put('/user', optionalAuth, AuthController.updateUser);

export default router;
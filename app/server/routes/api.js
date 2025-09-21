import express from 'express';
import { ApiController } from '../controllers/apiController.js';

const router = express.Router();

// Sample hello endpoint
router.get('/hello', ApiController.hello);

// Health check endpoint
router.get('/status', ApiController.status);

export default router;
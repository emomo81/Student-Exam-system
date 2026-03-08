import express from 'express';
import { generateQuestions } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateQuestions);

export default router;

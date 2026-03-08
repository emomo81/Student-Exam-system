import express from 'express';
import { getExamSessions, createExamSession, updateExamSession } from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getExamSessions)
    .post(protect, createExamSession);

router.route('/:id')
    .put(protect, updateExamSession);

export default router;

import express from 'express';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, createBulkQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getQuestions)
    .post(protect, createQuestion);

router.post('/bulk', protect, createBulkQuestions);

router.route('/:id')
    .put(protect, updateQuestion)
    .delete(protect, deleteQuestion);

export default router;

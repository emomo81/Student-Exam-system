import express from 'express';
import { getLogs, createLog } from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getLogs)
    .post(protect, createLog);

export default router;

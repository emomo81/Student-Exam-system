import MalpracticeLog from '../models/MalpracticeLog.js';

// @desc    Get logs (all or by session_id/user_email)
// @route   GET /api/logs
export const getLogs = async (req, res) => {
    try {
        const filter = {};
        if (req.query.session_id) {
            filter.session_id = req.query.session_id;
        }
        if (req.query.user_email) {
            filter.user_email = req.query.user_email;
        }
        const logs = await MalpracticeLog.find(filter).sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create log
// @route   POST /api/logs
export const createLog = async (req, res) => {
    try {
        const log = await MalpracticeLog.create(req.body);
        res.status(201).json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

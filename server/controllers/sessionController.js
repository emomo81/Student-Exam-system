import ExamSession from '../models/ExamSession.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';

// @desc    Get exam sessions (all or by student_email)
// @route   GET /api/exam-sessions
export const getExamSessions = async (req, res) => {
    try {
        const filter = {};
        if (req.query.student_email) {
            filter.student_email = req.query.student_email;
        }
        const sessions = await ExamSession.find(filter).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create exam session
// @route   POST /api/exam-sessions
export const createExamSession = async (req, res) => {
    try {
        const sessionBody = { ...req.body };
        // If auth is provided in req.user, override student_email
        if (req.user) {
            sessionBody.student_email = req.user.email;
        }
        const session = await ExamSession.create(sessionBody);
        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update exam session
// @route   PUT /api/exam-sessions/:id
export const updateExamSession = async (req, res) => {
    try {
        const session = await ExamSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        // Auto calculate score if submitted
        const updates = { ...req.body };
        if (updates.status === 'submitted' || updates.status === 'timed_out' || updates.status === 'terminated') {
            if (!updates.end_time) updates.end_time = new Date();

            if (updates.answers && !updates.score) {
                const questions = await Question.find({ exam_id: session.exam_id });
                const exam = await Exam.findById(session.exam_id);
                let totalMarks = exam?.total_marks || 0;
                if (totalMarks === 0) {
                    totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
                }

                let score = 0;
                questions.forEach(q => {
                    const studentAnswer = updates.answers[q._id.toString()] || updates.answers[q.id];
                    if (studentAnswer === q.correct_answer) {
                        score += (q.marks || 1);
                    }
                });

                updates.score = score;
                updates.percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
            }
        }

        const updatedSession = await ExamSession.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updatedSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamSession from '../models/ExamSession.js';

// @desc    Get all exams
// @route   GET /api/exams
export const getExams = async (req, res) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
export const getExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (exam) {
            res.json(exam);
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create exam
// @route   POST /api/exams
export const createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.status(201).json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
export const updateExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedExam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
export const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        await Exam.findByIdAndDelete(req.params.id);
        // Cascade delete questions
        await Question.deleteMany({ exam_id: req.params.id });
        // Cascade delete sessions
        await ExamSession.deleteMany({ exam_id: req.params.id });
        res.json({ message: 'Exam removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

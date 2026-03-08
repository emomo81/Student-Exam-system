import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import { generateQuestionsWithAI } from '../services/aiService.js';

// @desc    Get questions (all or by exam_id)
// @route   GET /api/questions
export const getQuestions = async (req, res) => {
    try {
        const filter = {};
        if (req.query.exam_id) {
            filter.exam_id = req.query.exam_id;
        }
        const questions = await Question.find(filter).sort({ order_index: 1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create question
// @route   POST /api/questions
export const createQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);
        // Update Exam total marks
        if (question.exam_id) {
            await updateExamTotalMarks(question.exam_id);
        }
        res.status(201).json(question);
    } catch (error) {
        console.error("DEBUG: Detailed Question Creation Error:", error);
        res.status(400).json({ message: error.message, details: error.errors });
    }
};

// @desc    Update question
// @route   PUT /api/questions/:id
export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Update exam total marks
        if (updatedQuestion.exam_id) {
            await updateExamTotalMarks(updatedQuestion.exam_id);
        }

        res.json(updatedQuestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const examId = question.exam_id;
        await Question.findByIdAndDelete(req.params.id);

        // Update exam total marks
        if (examId) {
            await updateExamTotalMarks(examId);
        }

        res.json({ message: 'Question removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create bulk questions
// @route   POST /api/questions/bulk
export const createBulkQuestions = async (req, res) => {
    try {
        const { examId, questions } = req.body;

        let lastOrderIndex = 0;
        const existingGenQuestions = await Question.find({ exam_id: examId }).sort({ order_index: -1 }).limit(1);
        if (existingGenQuestions.length > 0) {
            lastOrderIndex = existingGenQuestions[0].order_index + 1;
        }

        const newQuestions = questions.map(q => ({
            ...q,
            exam_id: examId,
            order_index: lastOrderIndex++
        }));

        await Question.insertMany(newQuestions);
        await updateExamTotalMarks(examId);

        res.status(201).json({ message: 'Questions added successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updateExamTotalMarks = async (examId) => {
    try {
        const questions = await Question.find({ exam_id: examId });
        const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
        await Exam.findByIdAndUpdate(examId, { total_marks: totalMarks });
    } catch (error) {
        console.error('Error updating exam total marks:', error);
    }
};

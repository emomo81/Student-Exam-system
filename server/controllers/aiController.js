import { generateQuestionsWithAI } from '../services/aiService.js';

// @desc    Generate questions using AI
// @route   POST /api/ai/generate
export const generateQuestions = async (req, res) => {
    try {
        const { mode, numQuestions, questionType, marksPerQuestion, additionalContext } = req.body;

        // req.file would be available here if we used multer for file upload
        const fileStr = req.file ? req.file.buffer.toString('utf8') : null;

        const generatedQuestions = await generateQuestionsWithAI(
            mode,
            numQuestions,
            questionType,
            marksPerQuestion,
            additionalContext,
            fileStr
        );

        res.json({ questions: generatedQuestions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

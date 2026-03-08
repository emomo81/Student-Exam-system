import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student_email: { type: String, required: true },
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date },
    status: { type: String, enum: ['in_progress', 'submitted', 'timed_out', 'terminated'], default: 'in_progress' },
    score: { type: Number },
    percentage: { type: Number },
    answers: { type: Object, default: {} }, // Store answers as a dictionary { questionId: answer }
    focus_lost_count: { type: Number, default: 0 },
    fullscreen_violations: { type: Number, default: 0 }
}, {
    timestamps: true
});

examSessionSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

export default ExamSession;

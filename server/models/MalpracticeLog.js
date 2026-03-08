import mongoose from 'mongoose';

const malpracticeLogSchema = new mongoose.Schema({
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    user_email: { type: String, required: true },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    event_type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
}, {
    timestamps: true
});

malpracticeLogSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const MalpracticeLog = mongoose.model('MalpracticeLog', malpracticeLogSchema);

export default MalpracticeLog;

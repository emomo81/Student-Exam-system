import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    duration_minutes: { type: Number, required: true, default: 60 },
    randomize_questions: { type: Boolean, default: true },
    passing_percentage: { type: Number, default: 40 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    teacher_email: { type: String, required: true }, // Referencing who created it
    total_marks: { type: Number, default: 0 }
}, {
    timestamps: true
});

// To easily return transformed object representation without _id & __v
examSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Exam = mongoose.model('Exam', examSchema);

export default Exam;

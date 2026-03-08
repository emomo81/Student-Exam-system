import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    question_text: { type: String, required: true },
    question_type: { type: String, enum: ['mcq', 'theory'], default: 'mcq' },
    options: [{
        label: { type: String },
        text: { type: String }
    }],
    correct_answer: { type: String, required: true },
    marks: { type: Number, required: true, default: 1 },
    order_index: { type: Number, default: 0 }
}, {
    timestamps: true
});

questionSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Question = mongoose.model('Question', questionSchema);

export default Question;

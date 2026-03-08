import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer'], default: 'multiple_choice' },
    options: [{ type: String }],
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

const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['Manual', 'AI_Generated'],
        default: 'Manual',
    },
    dueDate: {
        type: Date,
    },
    maxPoints: {
        type: Number,
        default: 100,
    },
    attachments: {
        type: [String],
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Adaptive'],
        default: 'Medium',
    },
    questions: {
        type: [Object], // Structured questions if AI generated
    },
    visibility: {
        type: Object,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Assignment', AssignmentSchema);

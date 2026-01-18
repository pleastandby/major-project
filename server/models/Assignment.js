const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false
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
    valuationMode: {
        type: String,
        enum: ['Liberal', 'Strict'],
        default: 'Liberal'
    },
    visibility: {
        type: Object,
    },
    syllabusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syllabus',
        required: false,
    },
    topics: {
        type: String,
    },
    numQuestions: {
        type: Number,
    },
    marksPerQuestion: {
        type: Number,
    },
    regenerationCount: {
        type: Number,
        default: 0,
    },
    lastRegenerated: {
        type: Date,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Assignment', AssignmentSchema);

const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
        index: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        index: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    files: {
        type: [Object], // { url, name, type, path }
    },
    ocrText: {
        type: String, // Extracted text from images/PDFs
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    grade: {
        type: Number,
    },
    gradingMode: {
        type: String,
        enum: ['AI', 'Manual'],
        default: 'Manual'
    },
    feedback: {
        type: String, // Final feedback (editable by faculty)
    },
    aiAnalysis: {
        type: String, // Raw AI feedback for reference
    },
    status: {
        type: String,
        enum: ['submitted', 'late', 'graded', 'resubmit_required'],
        default: 'submitted',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Submission', SubmissionSchema);

const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    roleInCourse: {
        type: String,
        enum: ['student', 'ta', 'observer'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'dropped', 'pending'],
        default: 'active',
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
    joinedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // who enrolled them (self or faculty)
    },
    meta: {
        type: Object, // gradeOptions, section, seatNumber
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);

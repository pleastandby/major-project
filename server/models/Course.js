const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    visibility: {
        type: Object, // Control specific viewing rights if needed
    },
    meta: {
        type: Map,
        of: String, // department, semester, tags, syllabus link etc.
    },
    stats: {
        type: Object, // enrolledCount, activeAssignments
    },
});

module.exports = mongoose.model('Course', CourseSchema);

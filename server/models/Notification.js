const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['assignment', 'announcement', 'grade', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
    },
    related: {
        type: Object, // { courseId, assignmentId, url }
    },
    read: {
        type: Boolean,
        default: false,
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true, // createdAt, updatedAt
});

module.exports = mongoose.model('Notification', NotificationSchema);

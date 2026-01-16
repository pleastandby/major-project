const mongoose = require('mongoose');

const RefreshSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true,
    },
    userAgent: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RefreshSession', RefreshSessionSchema);

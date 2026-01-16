const mongoose = require('mongoose');

const AuthLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Can be null if login fails for unknown user
    },
    event: {
        type: String,
        enum: ['login_success', 'login_failed', 'token_refresh', 'logout', 'password_reset', 'register'],
        required: true,
    },
    email: {
        type: String, // Capture email even if user doesn't exist
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    meta: {
        type: Object, // Error details etc
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true, // Append only
    },
});

module.exports = mongoose.model('AuthLog', AuthLogSchema);

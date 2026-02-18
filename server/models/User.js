const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    name: {
        type: String,
        required: false, // Optional for backward compatibility, but we should make it required for new users
    },
    passwordHash: {
        type: String,
        required: true,
    },
    roles: {
        type: [String],
        enum: ['student', 'faculty', 'admin'],
        default: ['student'],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLoginAt: {
        type: Date,
    },
    profileVersion: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);

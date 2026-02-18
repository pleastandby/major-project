const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String, // URL or path
    },
    bio: {
        type: String,
        maxLength: 500,
    },
    type: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        required: true,
    },
    data: {
        rollNumber: String,
        semester: mongoose.Schema.Types.Mixed, // integer or string
        department: String,
        registrationNo: Number, // integer
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Profile', ProfileSchema);

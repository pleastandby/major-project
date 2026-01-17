const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = await Profile.findOne({ userId: req.user.id });

        res.json({
            user,
            profile: profile || {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, bio, phone, department, location } = req.body;

        // Update User Model (Name)
        if (name) {
            await User.findByIdAndUpdate(req.user.id, { name });
        }

        // Update Profile Model
        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            // Create if doesn't exist (legacy users)
            profile = new Profile({
                userId: req.user.id,
                type: req.user.roles[0], // Default to first role
                name: name || 'User',
                data: {}
            });
        }

        if (name) profile.name = name;
        if (bio) profile.bio = bio;

        // Update extended data
        if (!profile.data) profile.data = {};
        if (phone) profile.data.phone = phone;
        if (department) profile.data.department = department;
        if (location) profile.data.location = location;

        await profile.save();

        res.json({
            message: 'Profile updated successfully',
            profile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload profile picture
// @route   POST /api/user/profile-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            // Should exist usually
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Delete old picture if exists and is local
        if (profile.profilePicture && !profile.profilePicture.startsWith('http')) {
            const oldPath = path.join(__dirname, '../', profile.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Save new path relative to server root
        // req.file.path is absolute or relative depending on config, let's normalize
        // We want 'uploads/profiles/filename'
        const relativePath = 'uploads/profiles/' + req.file.filename;

        profile.profilePicture = relativePath;
        await profile.save();

        res.json({
            message: 'Profile picture uploaded',
            profilePicture: relativePath
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture
};

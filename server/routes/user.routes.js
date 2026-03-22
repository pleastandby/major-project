const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, changePassword, uploadProfilePicture } = require('../controllers/user.controller');

const { storage } = require('../config/multer');

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// @route   GET /api/user/profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT /api/user/change-password
// @access  Private
router.put('/change-password', protect, changePassword);

// @route   POST /api/user/profile-picture
// @access  Private
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;

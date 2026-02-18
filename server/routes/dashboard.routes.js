const express = require('express');
const router = express.Router();
const { protect, faculty } = require('../middleware/authMiddleware');
const { getStudentOverview, getFacultyOverview } = require('../controllers/dashboard.controller');

// @route   GET /api/dashboard/student/overview
// @desc    Get calculated stats and suggestions for student
// @access  Private
router.get('/student/overview', protect, getStudentOverview);

// @route   GET /api/dashboard/faculty/overview
// @desc    Get calculated stats and suggestions for faculty
// @access  Private (Faculty)
router.get('/faculty/overview', protect, faculty, getFacultyOverview);

module.exports = router;

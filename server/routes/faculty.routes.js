const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadSyllabus, getSyllabusList, deleteSyllabus, generateAssignmentFromSyllabus, saveGeneratedAssignment, getAssignmentsList, getAssignmentById, updateAssignment, regenerateAllQuestions, regenerateQuestion, regeneratePreviewQuestion, deleteAssignment } = require('../controllers/faculty.controller');
const { protect } = require('../middleware/authMiddleware');

const { storage } = require('../config/multer');

// File Filter (Accept PDF and Images)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/faculty/syllabus
// @access  Private
router.post('/syllabus', protect, upload.single('syllabus'), uploadSyllabus);

// @route   GET /api/faculty/syllabus
// @access  Private
router.get('/syllabus', protect, getSyllabusList);

// @route   DELETE /api/faculty/syllabus/:id
// @access  Private
router.delete('/syllabus/:id', protect, deleteSyllabus);

// @route   POST /api/faculty/assignments/generate
// @access  Private
router.post('/assignments/generate', protect, generateAssignmentFromSyllabus);

// @route   POST /api/faculty/assignments/save
// @access  Private
router.post('/assignments/save', protect, saveGeneratedAssignment);

// @route   GET /api/faculty/assignments
// @access  Private
router.get('/assignments', protect, getAssignmentsList);

// @route   GET /api/faculty/assignments/:id
// @access  Private
router.get('/assignments/:id', protect, getAssignmentById);

// @route   PATCH /api/faculty/assignments/:id
// @access  Private
router.patch('/assignments/:id', protect, updateAssignment);

// @route   POST /api/faculty/assignments/:id/regenerate-all
// @access  Private
router.post('/assignments/:id/regenerate-all', protect, regenerateAllQuestions);

// @route   POST /api/faculty/assignments/:id/regenerate-question
// @access  Private
router.post('/assignments/:id/regenerate-question', protect, regenerateQuestion);

// @route   POST /api/faculty/assignments/regenerate-preview
// @access  Private
router.post('/assignments/regenerate-preview', protect, regeneratePreviewQuestion);

// @route   DELETE /api/faculty/assignments/:id
// @access  Private
router.delete('/assignments/:id', protect, deleteAssignment);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadSyllabus, getSyllabusList, deleteSyllabus, generateAssignmentFromSyllabus, saveGeneratedAssignment, getAssignmentsList, getAssignmentById, updateAssignment, regenerateQuestion } = require('../controllers/faculty.controller');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/faculty');

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename: syllabus-timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'syllabus-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

// @route   POST /api/faculty/assignments/:id/regenerate-question
// @access  Private
router.post('/assignments/:id/regenerate-question', protect, regenerateQuestion);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadSubmission, gradeSubmissionAI, getSubmission, getMySubmission } = require('../controllers/submission.controller');

// Multer Setup
const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, upload.single('file'), uploadSubmission);
router.post('/:id/grade-ai', protect, gradeSubmissionAI);
router.get('/:id', protect, getSubmission);
router.get('/assignment/:assignmentId', protect, getMySubmission);

module.exports = router;

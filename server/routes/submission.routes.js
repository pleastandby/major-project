const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
    uploadSubmission,
    gradeSubmissionAI,
    getSubmission,
    getMySubmission,
    getStudentSubmissions,
    approveSubmission,
    overrideGrade,
    getSubmissionsByAssignment,
    deleteSubmission,
    requestResubmission
} = require('../controllers/submission.controller');

// Multer Setup

const { storage } = require('../config/multer');
const upload = multer({ storage: storage });

router.get('/test-connectivity', (req, res) => {
    console.log('[DEBUG] Connectivity Test Hit!');
    res.json({ message: 'Connected' });
});

router.post('/upload', protect, upload.single('file'), uploadSubmission);
router.post('/:id/grade-ai', protect, gradeSubmissionAI);
router.put('/:id/approve', protect, approveSubmission);
router.put('/:id/override', protect, overrideGrade);
// Specific routes MUST come before generic /:id route
router.get('/my-results', protect, getStudentSubmissions);
router.get('/assignment/:assignmentId', protect, getMySubmission);
router.get('/list/:assignmentId', protect, getSubmissionsByAssignment);
router.get('/:id', protect, getSubmission);
router.delete('/:id', protect, deleteSubmission);
router.post('/:id/request-resubmit', protect, requestResubmission);

module.exports = router;

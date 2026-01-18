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
    getSubmissionsByAssignment
} = require('../controllers/submission.controller');

// Multer Setup
// const upload = multer({ dest: 'uploads/' }); // OLD
const fs = require('fs');

// Multer Disk Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'anonymous'; // specific to user
        const uploadPath = `uploads/students/${userId}`;

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use original name as requested
        cb(null, file.originalname);
    }
});

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

module.exports = router;

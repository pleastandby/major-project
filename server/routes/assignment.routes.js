const express = require('express');
const router = express.Router();
const { createAssignment, getAssignmentsByCourse, getAssignment } = require('../controllers/assignment.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createAssignment);
router.get('/course/:courseId', protect, getAssignmentsByCourse);
router.get('/:id', protect, getAssignment);

module.exports = router;

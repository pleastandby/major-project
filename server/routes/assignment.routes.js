const express = require('express');
const router = express.Router();
const { createAssignment, getAssignmentsByCourse, getAssignment, getStudentAssignments } = require('../controllers/assignment.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createAssignment);
router.get('/student/all', protect, getStudentAssignments);
router.get('/course/:courseId', protect, getAssignmentsByCourse);
router.get('/:id', protect, getAssignment);

module.exports = router;

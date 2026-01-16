const express = require('express');
const router = express.Router();
const { createCourse, getCourses, getCourse, joinCourse, getMyCourses } = require('../controllers/course.controller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCourses);
router.post('/', protect, createCourse);
router.get('/my', protect, getMyCourses);
router.post('/join', protect, joinCourse);
router.get('/:id', protect, getCourse); // Place :id last to avoid conflicts

module.exports = router;

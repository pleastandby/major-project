const express = require('express');
const router = express.Router();
const { createCourse, getCourses, getCourse, joinCourse, getMyCourses, updateCourse, deleteCourse } = require('../controllers/course.controller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCourses);
router.post('/', protect, createCourse);
router.get('/my', protect, getMyCourses);
router.post('/join', protect, joinCourse);
router.route('/:id')
    .get(protect, getCourse)
    .patch(protect, updateCourse)
    .delete(protect, deleteCourse);

module.exports = router;

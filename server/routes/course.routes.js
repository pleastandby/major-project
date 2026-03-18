const express = require('express');
const router = express.Router();
const {
    createCourse,
    getCourses,
    getCourse,
    joinCourse,
    getMyCourses,
    updateCourse,
    deleteCourse,
    getFacultyStudents,
    removeStudentFromCourse,
    leaveCourse,
    getCourseStudents,
    getSuggestedCourses,
    joinMultipleCourses
} = require('../controllers/course.controller');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { storage } = require('../config/gridfs');

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    }
});

router.get('/', protect, getCourses);
router.post('/', protect, upload.single('logo'), createCourse);
router.get('/my', protect, getMyCourses);
router.get('/students/all', protect, getFacultyStudents);
router.get('/suggestions', protect, getSuggestedCourses);
router.post('/join-multiple', protect, joinMultipleCourses);
router.post('/join', protect, joinCourse);
router.delete('/:courseId/students/:studentId', protect, removeStudentFromCourse);
router.delete('/:id/leave', protect, leaveCourse);
router.get('/:id/students', protect, getCourseStudents);

router.route('/:id')
    .get(protect, getCourse)
    .patch(protect, upload.single('logo'), updateCourse)
    .delete(protect, deleteCourse);

module.exports = router;

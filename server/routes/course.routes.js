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
    getCourseStudents
} = require('../controllers/course.controller');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/courses');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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
router.post('/join', protect, joinCourse);
router.delete('/:courseId/students/:studentId', protect, removeStudentFromCourse);
router.delete('/:id/leave', protect, leaveCourse);
router.get('/:id/students', protect, getCourseStudents);

router.route('/:id')
    .get(protect, getCourse)
    .patch(protect, upload.single('logo'), updateCourse)
    .delete(protect, deleteCourse);

module.exports = router;

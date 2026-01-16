const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Faculty only)
const createCourse = async (req, res) => {
    try {
        const { title, code, description, department, semester } = req.body;

        // Check if course code exists
        const courseExists = await Course.findOne({ code });
        if (courseExists) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        const course = await Course.create({
            title,
            code,
            description,
            createdBy: req.user.id, // from auth middleware
            meta: {
                department,
                semester
            }
        });

        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all courses (public or for user)
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('createdBy', 'email');
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('createdBy', 'name email');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Verify access? (Anyone can view details if they have ID? Or only enrolled?)
        // For now, let's allow viewing details
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Join a course via code
// @route   POST /api/courses/join
// @access  Private (Student)
const joinCourse = async (req, res) => {
    try {
        const { code } = req.body;
        const course = await Course.findOne({ code });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        const alreadyEnrolled = await Enrollment.findOne({
            userId: req.user.id,
            courseId: course._id
        });

        if (alreadyEnrolled) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        const enrollment = await Enrollment.create({
            userId: req.user.id,
            courseId: course._id,
            roleInCourse: 'student'
        });

        res.status(200).json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get My Courses
// @route GET /api/courses/my
// @access Private
const getMyCourses = async (req, res) => {
    try {
        // If faculty, find courses created by them
        // If student, find enrollments

        // 1. Get Enrollments (Student view) & populate inner course + faculty details
        const enrollments = await Enrollment.find({ userId: req.user.id })
            .populate({
                path: 'courseId',
                populate: { path: 'createdBy', select: 'name email' }
            });

        // Filter out any enrollments where courseId is null (orphaned)
        const enrolledCourses = enrollments
            .filter(e => e.courseId) // keep only valid
            .map(e => e.courseId);

        // 2. Get Created Courses (Faculty view)
        const createdCourses = await Course.find({ createdBy: req.user.id })
            .populate('createdBy', 'name email');

        res.json({ enrolled: enrolledCourses, created: createdCourses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCourse,
    joinCourse,
    getMyCourses
};

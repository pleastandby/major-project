const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Faculty)
const createAssignment = async (req, res) => {
    try {
        const { courseId, title, description, dueDate, maxPoints, type, difficulty } = req.body;

        // Verify course ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to add assignments to this course' });
        }

        const assignment = await Assignment.create({
            courseId,
            createdBy: req.user.id,
            title,
            description,
            dueDate,
            maxPoints,
            type: type || 'Manual',
            difficulty: difficulty || 'Medium'
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getAssignmentsByCourse = async (req, res) => {
    try {
        const assignments = await Assignment.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createAssignment,
    getAssignmentsByCourse,
    getAssignment
};

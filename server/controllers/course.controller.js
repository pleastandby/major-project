const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Profile = require('../models/Profile');

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
            instructors: [req.user.id], // Add creator as first instructor
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
        const courses = await Course.find().populate('createdBy', 'name email');
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
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('instructors', 'name email')
            .lean(); // Use lean to modify plain object

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Manual Profile Lookup for Name if User.name is missing
        if (course.createdBy && !course.createdBy.name) {
            const profile = await Profile.findOne({ userId: course.createdBy._id });
            if (profile) course.createdBy.name = profile.name;
        }

        if (course.instructors && course.instructors.length > 0) {
            const instructorIds = course.instructors.map(i => i._id);
            const profiles = await Profile.find({ userId: { $in: instructorIds } });
            course.instructors.forEach(inst => {
                if (!inst.name) {
                    const p = profiles.find(prof => prof.userId.toString() === inst._id.toString());
                    if (p) inst.name = p.name;
                }
            });
        }

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
        // 1. Get Enrollments
        const enrollments = await Enrollment.find({ userId: req.user.id })
            .populate({
                path: 'courseId',
                populate: { path: 'createdBy', select: 'name email' }
            })
            .lean();

        const enrolledCourses = [];
        for (let e of enrollments) {
            if (e.courseId) {
                // Populate name if missing
                if (e.courseId.createdBy && !e.courseId.createdBy.name) {
                    const profile = await Profile.findOne({ userId: e.courseId.createdBy._id });
                    if (profile) e.courseId.createdBy.name = profile.name;
                }
                enrolledCourses.push(e.courseId);
            }
        }

        // 2. Get Created/Instructing Courses (Faculty view)
        const createdCourses = await Course.find({
            $or: [
                { instructors: req.user.id },
                { createdBy: req.user.id }
            ]
        })
            .populate('createdBy', 'name email')
            .populate('instructors', 'name email')
            .lean();

        // Populate names from Profile if missing
        const userIdsToFetch = new Set();
        createdCourses.forEach(c => {
            if (c.createdBy && !c.createdBy.name) userIdsToFetch.add(c.createdBy._id);
            if (c.instructors) {
                c.instructors.forEach(i => {
                    if (i && !i.name) userIdsToFetch.add(i._id);
                });
            }
        });

        if (userIdsToFetch.size > 0) {
            const profiles = await Profile.find({ userId: { $in: Array.from(userIdsToFetch) } });
            const profileMap = {};
            profiles.forEach(p => profileMap[p.userId.toString()] = p.name);

            createdCourses.forEach(c => {
                if (c.createdBy && !c.createdBy.name && profileMap[c.createdBy._id.toString()]) {
                    c.createdBy.name = profileMap[c.createdBy._id.toString()];
                }
                if (c.instructors) {
                    c.instructors.forEach(i => {
                        if (i && !i.name && profileMap[i._id.toString()]) {
                            i.name = profileMap[i._id.toString()];
                        }
                    });
                }
            });
        }

        res.json({ enrolled: enrolledCourses, created: createdCourses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update course details
// @route   PATCH /api/courses/:id
// @access  Private (Owner only)
const updateCourse = async (req, res) => {
    try {
        const { title, description, semester, department } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership (Only creator can update settings/add instructors)
        if (course.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Handle Adding Instructor by Email
        if (req.body.addInstructorEmail) {
            const newInstructor = await User.findOne({ email: req.body.addInstructorEmail.toLowerCase() });
            if (!newInstructor) {
                return res.status(404).json({ message: 'User with this email not found' });
            }
            if (!newInstructor.roles.includes('faculty')) {
                return res.status(400).json({ message: 'User is not a faculty member' });
            }
            // Add if not already present
            if (!course.instructors.includes(newInstructor._id)) {
                course.instructors.push(newInstructor._id);
            }
        }

        // Handle Removing Instructor by ID
        if (req.body.removeInstructorId) {
            // Prevent removing creator
            if (req.body.removeInstructorId === course.createdBy.toString()) {
                return res.status(400).json({ message: 'Cannot remove the course creator' });
            }
            course.instructors = course.instructors.filter(id => id.toString() !== req.body.removeInstructorId);
        }

        course.title = title || course.title;
        course.description = description || course.description;
        if (course.meta) {
            course.meta.semester = semester || course.meta.semester;
            course.meta.department = department || course.meta.department;
        }

        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Owner only)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership
        if (course.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await course.deleteOne();
        res.json({ message: 'Course removed' });
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
    getMyCourses,
    updateCourse,
    deleteCourse
};

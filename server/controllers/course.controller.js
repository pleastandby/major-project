const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Faculty only)
const createCourse = async (req, res) => {
    try {
        const { title, code, description, department, semester, themeColor, themeIcon } = req.body;

        // Check if course code exists
        const courseExists = await Course.findOne({ code });
        if (courseExists) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        let logoPath = null;
        if (req.file) {
            logoPath = 'uploads/courses/' + req.file.filename;
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
            },
            theme: {
                color: themeColor || 'blue',
                icon: themeIcon || 'text', // Default to 'text' for first letter
                logo: logoPath
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

        if (req.body.themeColor) course.theme.color = req.body.themeColor;
        if (req.body.themeIcon) course.theme.icon = req.body.themeIcon;

        if (req.file) {
            // Delete old logo if it exists
            if (course.theme && course.theme.logo) {
                const fs = require('fs');
                const path = require('path');
                const oldPath = path.join(__dirname, '../', course.theme.logo);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            course.theme.logo = 'uploads/courses/' + req.file.filename;
            course.theme.icon = 'image'; // Set icon type to image when logo is uploaded
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

// @desc    Get all students enrolled in faculty's courses
// @route   GET /api/courses/students/all
// @access  Private (Faculty)
const getFacultyStudents = async (req, res) => {
    try {
        // 1. Find all courses created by or instructed by this user
        const courses = await Course.find({
            $or: [
                { createdBy: req.user.id },
                { instructors: req.user.id }
            ]
        }).select('_id title code theme');

        if (courses.length === 0) {
            return res.json([]);
        }

        const courseIds = courses.map(c => c._id);

        // 2. Find all enrollments for these courses
        const enrollments = await Enrollment.find({
            courseId: { $in: courseIds },
            roleInCourse: 'student'
        })
            .populate('userId', 'name email')
            .populate('courseId', 'title code theme')
            .lean();

        // 3. Aggregate by Student
        const studentMap = new Map();

        // Fetch profiles for names if missing in User object
        const userIdsToFetch = new Set();
        enrollments.forEach(e => {
            if (e.userId && !e.userId.name) {
                userIdsToFetch.add(e.userId._id);
            }
        });

        let profileMap = {};
        if (userIdsToFetch.size > 0) {
            const profiles = await Profile.find({ userId: { $in: Array.from(userIdsToFetch) } });
            profiles.forEach(p => profileMap[p.userId.toString()] = p.name);
        }

        enrollments.forEach(enrollment => {
            if (!enrollment.userId) return; // Skip if user deleted

            const studentId = enrollment.userId._id.toString();

            // Fix name if missing
            if (!enrollment.userId.name && profileMap[studentId]) {
                enrollment.userId.name = profileMap[studentId];
            }

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    _id: studentId,
                    name: enrollment.userId.name || 'Unknown User',
                    email: enrollment.userId.email,
                    enrolledCourses: []
                });
            }

            const student = studentMap.get(studentId);
            // Add course info
            if (enrollment.courseId) {
                student.enrolledCourses.push({
                    _id: enrollment.courseId._id,
                    title: enrollment.courseId.title,
                    code: enrollment.courseId.code,
                    theme: enrollment.courseId.theme,
                    joinedAt: enrollment.joinedAt
                });
            }
        });

        const students = Array.from(studentMap.values());
        res.json(students);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove a student from a course
// @route   DELETE /api/courses/:courseId/students/:studentId
// @access  Private (Faculty)
const removeStudentFromCourse = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        // 1. Verify Course Ownership/Instructorship
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isInstructor = course.createdBy.toString() === req.user.id ||
            course.instructors.includes(req.user.id);

        if (!isInstructor) {
            return res.status(401).json({ message: 'Not authorized to manage this course' });
        }

        // 2. Remove Enrollment
        const deleted = await Enrollment.findOneAndDelete({
            courseId: courseId,
            userId: studentId
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Student not enrolled in this course' });
        }

        res.json({ message: 'Student removed from course' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Leave a course
// @route   DELETE /api/courses/:id/leave
// @access  Private (Student)
const leaveCourse = async (req, res) => {
    try {
        const courseId = req.params.id;

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            courseId: courseId,
            userId: req.user.id,
            roleInCourse: 'student'
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'You are not enrolled in this course' });
        }

        await enrollment.deleteOne();

        res.json({ message: 'Successfully left the course' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all students enrolled in a course (for Student view)
// @route   GET /api/courses/:id/students
// @access  Private (Enrolled Students & Faculty)
const getCourseStudents = async (req, res) => {
    try {
        const courseId = req.params.id;

        // 1. Verify Enrollment or Instructorship
        const isInstructor = await Course.exists({ _id: courseId, $or: [{ createdBy: req.user.id }, { instructors: req.user.id }] });

        let isEnrolled = false;
        if (!isInstructor) {
            isEnrolled = await Enrollment.exists({
                courseId: courseId,
                userId: req.user.id,
                roleInCourse: 'student'
            });
        }

        if (!isInstructor && !isEnrolled) {
            return res.status(401).json({ message: 'Not authorized to view classmates' });
        }

        // 2. Fetch Enrolled Students
        const enrollments = await Enrollment.find({
            courseId: courseId,
            roleInCourse: 'student'
        })
            .populate('userId', 'name email') // Minimal info
            .select('userId joinedAt');

        // Filter out if user is null (deleted) and map
        const students = enrollments
            .filter(e => e.userId)
            .map(e => ({
                _id: e.userId._id,
                name: e.userId.name,
                email: e.userId.email, // Consider hiding email if privacy needed
                joinedAt: e.joinedAt
            }));

        // Fetch profiles for avatars/bios
        const userIds = students.map(s => s._id);
        const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId bio name');

        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p);

        // Merge profile info
        students.forEach(s => {
            const profile = profileMap[s._id.toString()];
            if (profile) {
                if (!s.name) s.name = profile.name;
                s.bio = profile.bio;
            }
        });

        res.json(students);

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
    deleteCourse,
    getFacultyStudents,
    removeStudentFromCourse,
    leaveCourse,
    getCourseStudents
};

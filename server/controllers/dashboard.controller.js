const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Get Student Smart Overview
// @route   GET /api/dashboard/student/overview
// @access  Private (Student)
const getStudentOverview = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Enrolled Courses
        const enrollments = await Enrollment.find({ userId });
        const courseIds = enrollments.map(e => e.courseId);

        // 2. Get All Assignments for these courses
        const assignments = await Assignment.find({
            courseId: { $in: courseIds }
        }).select('_id title courseId dueDate maxPoints topics type');

        // 3. Get Student Submissions
        const submissions = await Submission.find({
            studentId: userId
        }).populate('assignmentId', 'title topics maxPoints');

        // --- CALCULATION LOGIC ---

        // A. Average Grade & Best Assignments
        let totalScore = 0;
        let gradedCount = 0;
        const gradedSubmissions = [];

        submissions.forEach(sub => {
            if (sub.grade !== undefined && sub.grade !== null) {
                // Normalize score to percentage
                const max = sub.assignmentId?.maxPoints || 100;
                const percentage = (sub.grade / max) * 100;

                totalScore += percentage;
                gradedCount++;
                gradedSubmissions.push({ ...sub.toObject(), percentage });
            }
        });

        const avgGrade = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : 0;

        // B. Best Assignments (Top 3)
        const bestAssignments = gradedSubmissions
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3)
            .map(s => ({
                title: s.assignmentId?.title || 'Unknown',
                grade: s.grade,
                maxPoints: s.assignmentId?.maxPoints,
                percentage: s.percentage.toFixed(1)
            }));

        // C. Weekly Performance (Activity)
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfLastWeek = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() - 7));

        let thisWeekCount = 0;
        let lastWeekCount = 0;

        submissions.forEach(sub => {
            const date = new Date(sub.submittedAt);
            if (date >= startOfWeek) thisWeekCount++;
            else if (date >= startOfLastWeek && date < startOfWeek) lastWeekCount++;
        });

        // D. Upcoming Deadlines
        const submittedAssignmentIds = submissions.map(s => s.assignmentId?._id?.toString());
        const pendingAssignments = assignments.filter(a => {
            const isSubmitted = submittedAssignmentIds.includes(a._id.toString());
            const isFuture = new Date(a.dueDate || 0) > new Date(); // Only future due dates
            return !isSubmitted && isFuture;
        });

        const upcomingDeadlines = pendingAssignments
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
            .map(a => ({
                _id: a._id,
                title: a.title,
                dueDate: a.dueDate,
                courseId: a.courseId
            }));

        // --- SMART SUGGESTIONS ---
        const suggestions = [];

        // 1. Weak Areas
        const lowScoreSubmissions = gradedSubmissions.filter(s => s.percentage < 60);
        const weakTopics = new Set();
        lowScoreSubmissions.forEach(s => {
            if (s.assignmentId?.topics) {
                // Split comma separated topics
                s.assignmentId.topics.split(',').forEach(t => weakTopics.add(t.trim()));
            }
        });
        if (weakTopics.size > 0) {
            suggestions.push({
                type: 'improvement',
                title: 'Focus Areas',
                message: `Review materials for: ${Array.from(weakTopics).slice(0, 3).join(', ')}`,
                priority: 'high'
            });
        }

        // 2. Risk Alert (Late assignments)
        // Need to check if submission date > due date. Assuming we have dueDate populated or available.
        // Simplified: Check if grade is low consistently
        if (gradedCount > 3 && avgGrade < 50) {
            suggestions.push({
                type: 'risk',
                title: 'Academic Risk',
                message: 'Your average grade is below 50%. Consider scheduling a meeting with your instructor.',
                priority: 'critical'
            });
        }

        // 3. Engagement (No assignments this week?)
        if (thisWeekCount === 0 && pendingAssignments.length > 0) {
            suggestions.push({
                type: 'engagement',
                title: 'Weekly Goal',
                message: 'You haven\'t submitted anything this week. Try to complete one assignment today!',
                priority: 'medium'
            });
        }

        res.json({
            metrics: {
                enrolledCourses: courseIds.length,
                avgGrade,
                submissionsThisWeek: thisWeekCount,
                submissionsLastWeek: lastWeekCount,
                completionRate: assignments.length > 0 ? ((submissions.length / assignments.length) * 100).toFixed(0) : 0
            },
            bestAssignments,
            upcomingDeadlines,
            suggestions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Faculty Smart Overview
// @route   GET /api/dashboard/faculty/overview
// @access  Private (Faculty)
const getFacultyOverview = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Created Courses
        const courses = await Course.find({
            $or: [{ createdBy: userId }, { instructors: userId }]
        }).select('_id title code');
        const courseIds = courses.map(c => c._id);

        // 2. Get Total Students (Unique)
        const enrollments = await Enrollment.find({
            courseId: { $in: courseIds },
            roleInCourse: 'student'
        }).distinct('userId');
        const totalStudents = enrollments.length;

        // 3. Get Assignments
        const assignments = await Assignment.find({
            courseId: { $in: courseIds }
        });

        // 4. Get All Submissions for these assignments
        // Used for analytics
        const assignmentIds = assignments.map(a => a._id);
        const submissions = await Submission.find({
            assignmentId: { $in: assignmentIds }
        }).populate('studentId', 'name email');

        // --- CALCULATION LOGIC ---

        // A. Scheduled & Activity
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        const scheduledAssignments = assignments.filter(a => new Date(a.dueDate) > new Date()).length;
        const assignmentsCreatedThisWeek = assignments.filter(a => new Date(a.createdAt) >= startOfWeek).length;

        const pendingGrading = submissions.filter(s => s.status === 'submitted' && s.gradingMode !== 'AI').length;

        // B. Class Performance (Assignments with low averages)
        const assignmentPerformance = {}; // { assignId: { total: 0, count: 0, title: '' } }

        submissions.forEach(s => {
            if (s.grade !== undefined) {
                if (!assignmentPerformance[s.assignmentId]) {
                    const assign = assignments.find(a => a._id.toString() === s.assignmentId.toString());
                    assignmentPerformance[s.assignmentId] = {
                        total: 0,
                        count: 0,
                        totalMax: 0,
                        title: assign ? assign.title : 'Unknown'
                    };
                }
                const assign = assignments.find(a => a._id.toString() === s.assignmentId.toString());
                const max = assign ? assign.maxPoints : 100;

                assignmentPerformance[s.assignmentId].total += s.grade;
                assignmentPerformance[s.assignmentId].totalMax += max;
                assignmentPerformance[s.assignmentId].count++;
            }
        });

        // Calculate Average % for each assignment
        const alerts = [];
        let globalTotalPercent = 0;
        let globalCount = 0;

        Object.values(assignmentPerformance).forEach(item => {
            const avgPercent = (item.total / item.totalMax) * 100;
            globalTotalPercent += avgPercent;
            globalCount++;

            if (avgPercent < 50) {
                alerts.push({
                    type: 'performance',
                    title: 'Low Performance',
                    message: `Class average for "${item.title}" is ${avgPercent.toFixed(1)}%. Consider reviewing the topic.`,
                    priority: 'high'
                });
            }
        });

        const averageClassPerformance = globalCount > 0 ? (globalTotalPercent / globalCount).toFixed(1) : 0;

        // C. At-Risk Students
        const studentStats = {}; // { studentId: { totalPercent: 0, count: 0, name: '' } }

        submissions.forEach(s => {
            if (s.grade !== undefined && s.studentId) {
                const sid = s.studentId._id.toString();
                if (!studentStats[sid]) {
                    studentStats[sid] = {
                        totalPercent: 0,
                        count: 0,
                        name: s.studentId.name || 'Student'
                    };
                }
                const assign = assignments.find(a => a._id.toString() === s.assignmentId.toString());
                const max = assign ? (assign.maxPoints || 100) : 100;

                // Ensure grade doesn't exceed max (data integrity)
                const safeGrade = Math.min(s.grade, max);
                studentStats[sid].totalPercent += (safeGrade / max) * 100;
                studentStats[sid].count++;
            }
        });

        const atRiskStudents = [];
        Object.values(studentStats).forEach(stat => {
            const avg = stat.count > 0 ? (stat.totalPercent / stat.count) : 0;

            // Only flag if they have at least 1 graded assignment and avg < 50
            // Or if they have a decent amount of data (>2) and avg < 60
            const isCritical = avg < 50;
            const isWarning = stat.count >= 3 && avg < 60;

            if (isCritical || isWarning) {
                atRiskStudents.push({
                    name: stat.name,
                    average: avg.toFixed(1),
                    gradedCount: stat.count,
                    status: isCritical ? 'Critical' : 'Warning'
                });
            }
        });

        // Add At-Risk Alert
        if (atRiskStudents.length > 0) {
            atRiskStudents.sort((a, b) => parseFloat(a.average) - parseFloat(b.average));
            const criticalCount = atRiskStudents.filter(s => s.status === 'Critical').length;

            alerts.push({
                type: 'risk',
                title: criticalCount > 0 ? 'Students Requiring Attention' : 'Academic Warnings',
                message: `${atRiskStudents.length} student${atRiskStudents.length === 1 ? '' : 's'} falling behind impact class performance.`,
                data: atRiskStudents, // UI will need to handle extra fields
                priority: criticalCount > 0 ? 'critical' : 'high'
            });
        }

        res.json({
            metrics: {
                totalStudents,
                scheduledAssignments,
                assignmentsThisWeek: assignmentsCreatedThisWeek,
                pendingGrading,
                averageClassPerformance
            },
            alerts,
            atRiskCount: atRiskStudents.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStudentOverview,
    getFacultyOverview
};

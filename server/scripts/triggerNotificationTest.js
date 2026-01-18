const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Assuming running from server root:
dotenv.config();
const connectDB = require('../config/db');
const { checkUpcomingAssignments, checkOverdueAssignments } = require('../cron/notificationScheduler');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const runTest = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // 1. Find a student
        const student = await User.findOne({ roles: 'student' });
        if (!student) throw new Error('No student found in DB');
        console.log(`Found Student: ${student.name} (${student.email})`);

        // 2. Find a course they are enrolled in
        const enrollment = await Enrollment.findOne({ userId: student._id, status: 'active' });
        if (!enrollment) throw new Error('Student is not enrolled in any course');

        const course = await Course.findById(enrollment.courseId);
        console.log(`Found Course: ${course.title}`);

        // 3. Create a test assignment due in 23.5 hours (Upcoming)
        const upcomingDueDate = new Date(Date.now() + 23.5 * 60 * 60 * 1000);
        const upcomingAssignment = await Assignment.create({
            title: `Test Upcoming Assignment ${Date.now()}`,
            description: 'This is a test assignment for notification system.',
            courseId: course._id,
            dueDate: upcomingDueDate,
            maxPoints: 100,
            type: 'Manual',
            difficulty: 'Medium',
            createdBy: course.createdBy
        });
        console.log(`Created Upcoming Assignment: ${upcomingAssignment.title}`);

        // 4. Create a test assignment due 10 minutes ago (Overdue)
        const overdueDueDate = new Date(Date.now() - 10 * 60 * 1000);
        const overdueAssignment = await Assignment.create({
            title: `Test Overdue Assignment ${Date.now()}`,
            description: 'This is a test assignment for notification system.',
            courseId: course._id,
            dueDate: overdueDueDate,
            maxPoints: 100,
            type: 'Manual',
            difficulty: 'Medium',
            createdBy: course.createdBy
        });
        console.log(`Created Overdue Assignment: ${overdueAssignment.title}`);

        // 5. Trigger Checks
        console.log('Running Check: Upcoming Assignments...');
        await checkUpcomingAssignments();

        console.log('Running Check: Overdue Assignments...');
        await checkOverdueAssignments();

        console.log('--------------------------------------------------');
        console.log('Checks Complete!');
        console.log(`Please log in as ${student.email} and check the Student Dashboard.`);
        console.log('You should see:');
        console.log('1. Yellow Alert: "Assignment Due Soon"');
        console.log('2. Red Alert: "Assignment Overdue"');
        console.log('--------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

runTest();

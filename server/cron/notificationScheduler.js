const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const User = require('../models/User');

const scheduleNotifications = () => {
    console.log('Initializing Notification Scheduler...');

    // Run every hour: '0 * * * *'
    // For tighter testing we could use every minute: '* * * * *'
    // Let's use every hour for production-like behavior
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled notification checks...');
        await checkUpcomingAssignments();
        await checkOverdueAssignments();
    });
};

const checkUpcomingAssignments = async () => {
    try {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find assignments due between now and 24 hours from now
        // We can optimize to check for assignments due in exactly the 23-24h window to avoid repeat notifications
        // But for robustenss, let's look for assignments due < 24h away
        // To prevent spamming, we should ideally check if a notification was already sent.
        // For this MVP, we will try to target a specific window (e.g. due in 23-24 hours) OR use a flag in DB.
        // Simplified approach: Find assignments due in the next 24 hours.
        // Better approach for MVP without schema change: Find assignments due between 23h and 24h from now.

        // Let's widen the window slightly to ensuring we don't miss it if the cron runs slightly off 
        // Window: Due between 23 hours from now and 24 hours from now.
        const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const windowEnd = twentyFourHoursFromNow;

        const assignments = await Assignment.find({
            dueDate: {
                $gte: windowStart,
                $lte: windowEnd
            }
        });

        for (const assignment of assignments) {
            // Get all students enrolled in the course
            const enrollments = await Enrollment.find({
                courseId: assignment.courseId,
                roleInCourse: 'student',
                status: 'active'
            });

            for (const enrollment of enrollments) {
                // Check if already submitted
                const submission = await Submission.findOne({
                    assignmentId: assignment._id,
                    studentId: enrollment.userId
                });

                if (!submission) {
                    // Create Notification
                    await Notification.create({
                        userId: enrollment.userId,
                        type: 'system',
                        alertLevel: 'yellow',
                        title: 'Assignment Due Soon',
                        body: `Assignment "${assignment.title}" is due in less than 24 hours.`,
                        related: {
                            assignmentId: assignment._id,
                            courseId: assignment.courseId
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in checkUpcomingAssignments:', error);
    }
};

const checkOverdueAssignments = async () => {
    try {
        const now = new Date();
        // Check for assignments that became overdue in the last hour
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const assignments = await Assignment.find({
            dueDate: {
                $gte: oneHourAgo,
                $lt: now
            }
        });

        for (const assignment of assignments) {
            const enrollments = await Enrollment.find({
                courseId: assignment.courseId,
                roleInCourse: 'student',
                status: 'active'
            });

            for (const enrollment of enrollments) {
                const submission = await Submission.findOne({
                    assignmentId: assignment._id,
                    studentId: enrollment.userId
                });

                // If no submission, or submitted LATE (after due date) - strictly speaking if no submission yet
                if (!submission) {
                    await Notification.create({
                        userId: enrollment.userId,
                        type: 'system',
                        alertLevel: 'red',
                        title: 'Assignment Overdue',
                        body: `Assignment "${assignment.title}" is now overdue. Please submit as soon as possible.`,
                        related: {
                            assignmentId: assignment._id,
                            courseId: assignment.courseId
                        }
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error in checkOverdueAssignments:', error);
    }
};

module.exports = {
    scheduleNotifications,
    checkUpcomingAssignments,
    checkOverdueAssignments
};

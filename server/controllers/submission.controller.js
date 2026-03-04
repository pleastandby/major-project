const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const fs = require('fs');
const path = require('path');
const { extractText } = require('../services/ocr.service');
const { generateJSON } = require('../services/gemini.service');
const { createNotificationInternal } = require('./notification.controller');

// @desc    Upload submission and run OCR
// @route   POST /api/submissions/upload
// @access  Private (Student)
// Helper to perform AI grading
const evaluateSubmissionAI = async (submission, assignment) => {
    // Construct a detailed context for the AI
    let assignmentContext = `Title: ${assignment.title}\nDescription: ${assignment.description}\nMax Points: ${assignment.maxPoints}\n`;

    if (assignment.questions && assignment.questions.length > 0) {
        assignmentContext += `\nSPECIFIC QUESTIONS:\n${JSON.stringify(assignment.questions, null, 2)}\n`;
    }

    if (assignment.answerKey) {
        assignmentContext += `\nANSWER KEY:\n${assignment.answerKey}\n`;
    }

    // Calculate dynamic max points if questions exist
    let dynamicMaxPoints = assignment.maxPoints;
    if (assignment.questions && assignment.questions.length > 0) {
        const questionsTotal = assignment.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
        if (questionsTotal > 0) {
            dynamicMaxPoints = questionsTotal;
        }
    }

    // Update context with true max points
    assignmentContext = assignmentContext.replace(`Max Points: ${assignment.maxPoints}`, `Max Points: ${dynamicMaxPoints}`);

    // Set Grading Persona based on Valuation Mode
    const valuationMode = assignment.valuationMode || 'Liberal';
    let gradingPersona = "";
    if (valuationMode === 'Strict') {
        gradingPersona = `
        Your valuation mode is **STRICT**. 
        - Deduct marks for minor errors, spelling mistakes, and lack of clarity. 
        - Be critical of the depth and precision of the answer. 
        - Do not award full marks unless the answer is perfect.`;
    } else {
        gradingPersona = `
        Your valuation mode is **LIBERAL**. 
        - Be lenient and award marks for partial correctness. 
        - Focus on the core understanding rather than minor details or grammar. 
        - If the student gets the main idea right, be generous with points.`;
    }

    const prompt = `
        You are an expert academic grader. Your task is to grade a student submission based on the provided assignment details and extracted text.
        
        ${gradingPersona}

        === ASSIGNMENT DETAILS ===
        ${assignmentContext}
        (Note: Grade strictly out of ${dynamicMaxPoints} points)

        === STUDENT SUBMISSION (OCR EXTRACTED TEXT) ===
        "${submission.ocrText}"

        === GRADING INSTRUCTIONS ===
        1. Compare the student's answers against the assignment questions/description.
        2. Assign a specific numerical grade respecting the **${valuationMode}** mode. The grade MUST be less than or equal to ${dynamicMaxPoints}.
        3. Provide **short, simple, and concise feedback** using Markdown formatting (bullet points, bold text).
        4. Highlight correct answers and point out errors briefly. Do NOT provide lengthy explanations.

        output strictly in valid JSON format:
        {
            "grade": number,
            "feedback": "string (markdown allowed, keep it short)",
            "analysis": "string (markdown allowed, keep it short)"
        }
    `;

    console.log('[DEBUG] AI Grading Prompt:', prompt);

    const result = await generateJSON(prompt);
    console.log('[DEBUG] AI Grading Result:', result);

    if (!result || typeof result.grade !== 'number') {
        throw new Error('AI Grading failed to generate valid result');
    }

    return result;
};

// @desc    Upload submission and run OCR
// @route   POST /api/submissions/upload
// @access  Private (Student)
const uploadSubmission = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Run OCR
        // Pass the mimetype from multer
        const text = await extractText(req.file.path, req.file.mimetype);

        // Save Submission to DB
        const submission = await Submission.create({
            assignmentId: req.body.assignmentId,
            courseId: req.body.courseId,
            studentId: req.user.id,
            files: [{
                path: req.file.path,
                name: req.file.originalname,
                type: req.file.mimetype
            }],
            ocrText: text,
            gradingMode: 'Manual', // Default
            status: 'submitted'
        });

        // Trigger Auto-Grading (Background, or await if fast enough - let's await to populate generic)
        try {
            const assignment = await Assignment.findById(req.body.assignmentId);
            if (assignment && text) {
                console.log(`[AUTO-GRADE] Triggering AI grading for submission ${submission._id}`);
                const aiResult = await evaluateSubmissionAI(submission, assignment);

                submission.grade = aiResult.grade;
                submission.feedback = aiResult.feedback;
                submission.aiAnalysis = aiResult.analysis;
                submission.gradingMode = 'AI';
                // Auto-publish: Set status to 'graded' immediately so student sees it
                submission.status = 'graded';
                await submission.save();
                console.log(`[AUTO-GRADE] Submission ${submission._id} graded successfully`);

                // Notify Student
                await createNotificationInternal(
                    submission.studentId,
                    'grade',
                    'Assignment Graded (AI)',
                    `Your submission for "${assignment.title}" has been graded by AI.`,
                    { submissionId: submission._id, assignmentId: assignment._id },
                    'green'
                );
            }
        } catch (gradError) {
            console.error("[AUTO-GRADE] Failed to auto-grade:", gradError);
            // Non-blocking error, we still return success for upload
        }

        res.json({
            message: 'File processed successfully',
            extractedText: text,
            submission
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Processing failed' });
    }
};

// @desc    Grade submission with AI
// @route   POST /api/submissions/:id/grade-ai
// @access  Private (Faculty Only)
const gradeSubmissionAI = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('assignmentId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (!submission.ocrText) {
            return res.status(400).json({ message: 'No OCR text available for this submission' });
        }

        const result = await evaluateSubmissionAI(submission, submission.assignmentId);

        // Update Submission
        submission.grade = result.grade;
        submission.feedback = result.feedback;
        submission.aiAnalysis = result.analysis;
        submission.gradingMode = 'AI';

        // If manually triggered by faculty, we might want to set to 'graded' or keep 'submitted'?
        // The UI flow suggests "Generate Grade" -> Review -> "Approve". 
        // So we keep it as is, waiting for approval, OR if they click "Generate" they see it.
        // Current UI doesn't auto-approve. It just fills the fields.

        await submission.save();

        res.json(submission);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during grading' });
    }
};

// @desc    Approve AI Grade
// @route   PUT /api/submissions/:id/approve
// @access  Private (Faculty Only)
const approveSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        submission.status = 'graded';
        await submission.save();

        // Notify Student
        // Need to populate or fetch title first preferably, or just generic message
        const fullSubmission = await Submission.findById(submission._id).populate('assignmentId');

        await createNotificationInternal(
            submission.studentId,
            'grade',
            'Assignment Verified (Faculty)',
            `Your assignment "${fullSubmission.assignmentId.title}" has been verified by the faculty.`,
            { submissionId: submission._id, assignmentId: fullSubmission.assignmentId._id },
            'green'
        );

        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Manually Override Grade
// @route   PUT /api/submissions/:id/override
// @access  Private (Faculty Only)
const overrideGrade = async (req, res) => {
    try {
        const { grade, feedback } = req.body;
        const submission = await Submission.findById(req.params.id).populate('assignmentId');
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        // Calculate Max Points
        const assignment = submission.assignmentId;
        let maxPoints = assignment.maxPoints || 100;

        if (assignment.questions && assignment.questions.length > 0) {
            const questionsTotal = assignment.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
            if (questionsTotal > 0) maxPoints = questionsTotal;
        }

        if (Number(grade) > maxPoints) {
            return res.status(400).json({ message: `Grade cannot exceed maximum marks of ${maxPoints}` });
        }

        submission.grade = grade;
        submission.feedback = feedback;
        submission.gradingMode = 'Manual';
        submission.status = 'graded';
        await submission.save();

        const fullSubmission = await Submission.findById(submission._id).populate('assignmentId');

        await createNotificationInternal(
            submission.studentId,
            'grade',
            'Assignment Verified (Updated)',
            `Your grade for "${fullSubmission.assignmentId.title}" has been updated and verified by your instructor.`,
            { submissionId: submission._id, assignmentId: fullSubmission.assignmentId._id },
            'blue'
        );

        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/submissions/list/:assignmentId
// @access  Private (Faculty Only)
const getSubmissionsByAssignment = async (req, res) => {
    try {
        console.log(`[DEBUG] API CALL: getSubmissionsByAssignment`);
        console.log(`[DEBUG] Requested Assignment ID: "${req.params.assignmentId}"`);

        if (!req.params.assignmentId || !req.params.assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`[DEBUG] Invalid assignmentId: ${req.params.assignmentId}`);
            return res.status(400).json({ message: 'Invalid assignment ID' });
        }

        const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
            .populate('studentId', 'name email')
            .sort({ submittedAt: -1 });

        console.log(`[DEBUG] DB Query Result: Found ${submissions.length} submissions`);
        if (submissions.length > 0) {
            console.log(`[DEBUG] First submission ID: ${submissions[0]._id}`);
        } else {
            // Debug: check if any submissions exist for this assignment without population
            const count = await Submission.countDocuments({ assignmentId: req.params.assignmentId });
            console.log(`[DEBUG] Raw count without populate: ${count}`);
        }

        res.json(submissions);
    } catch (error) {
        console.error('[DEBUG] Error in getSubmissionsByAssignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get details of a submission
// @route GET /api/submissions/:id
// @access Private
const getSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('studentId', 'name email')
            .populate({
                path: 'assignmentId',
                select: '+answerKey' // Explicitly select the hidden field
            });
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

// @desc Get submission by Assignment for viewing status
// @route GET /api/submissions/assignment/:assignmentId
// @access Private
const getMySubmission = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            assignmentId: req.params.assignmentId,
            studentId: req.user.id
        });

        if (!submission) {
            // It's okay to return null/404 if not submitted yet, usually we just return empty
            return res.json(null);
        }
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get all submissions for the logged-in student
// @route GET /api/submissions/my-results
// @access Private (Student)
const getStudentSubmissions = async (req, res) => {
    try {
        console.log('[DEBUG] getStudentSubmissions called');
        if (!req.user || !req.user.id) {
            console.error('[DEBUG] req.user is missing!');
            return res.status(401).json({ message: 'User not authenticated' });
        }
        console.log(`[DEBUG] Fetching submissions for student: ${req.user.id}`);

        const submissions = await Submission.find({
            studentId: req.user.id,
            // Fetch all statuses so student sees pending work too
        })
            .populate({
                path: 'assignmentId',
                select: 'title courseTitle maxPoints questions'
            })
            .sort({ updatedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

// @desc    Delete a submission (allowed if within 2 hours or if resubmission requested)
// @route   DELETE /api/submissions/:id
// @access  Private (Student)
const deleteSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.studentId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this submission' });
        }

        const now = Date.now();
        const submittedAt = new Date(submission.submittedAt).getTime();
        const isWithinTwoHours = (now - submittedAt) <= (2 * 60 * 60 * 1000);

        if (!isWithinTwoHours && !submission.resubmissionRequested) {
            return res.status(403).json({ message: 'Cannot delete submission after 2 hours unless resubmission is requested by faculty.' });
        }

        // Delete physical files
        if (submission.files && submission.files.length > 0) {
            submission.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (err) {
                    console.error('Failed to delete file:', file.path, err);
                }
            });
        }

        await Submission.deleteOne({ _id: submission._id });

        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ message: 'Server error while deleting submission' });
    }
};

// @desc    Request a student to resubmit their assignment
// @route   POST /api/submissions/:id/request-resubmit
// @access  Private (Faculty)
const requestResubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('assignmentId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.resubmissionRequested = true;
        submission.status = 'resubmit_required';
        await submission.save();

        // Notify student
        await createNotificationInternal(
            submission.studentId,
            'alert', // Using 'alert' for high priority
            'Resubmission Requested',
            `Your instructor has requested a resubmission for "${submission.assignmentId.title}". Please check the assignment feedback.`,
            { submissionId: submission._id, assignmentId: submission.assignmentId._id },
            'red'
        );

        res.json({ message: 'Resubmission requested successfully', submission });
    } catch (error) {
        console.error('Request resubmission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    uploadSubmission,
    gradeSubmissionAI,
    getSubmission,
    getMySubmission,
    getStudentSubmissions,
    approveSubmission,
    overrideGrade,
    getSubmissionsByAssignment,
    deleteSubmission,
    requestResubmission
};

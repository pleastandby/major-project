const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { extractText } = require('../services/ocr.service');
const { generateJSON } = require('../services/gemini.service');

// @desc    Upload submission and run OCR
// @route   POST /api/submissions/upload
// @access  Private (Student)
const uploadSubmission = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Run OCR
        const text = await extractText(req.file.path);

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

        const assignment = submission.assignmentId;

        const prompt = `
            You are an expert academic grader. 
            
            ASSIGNMENT DETAILS:
            Title: ${assignment.title}
            Instructions: ${assignment.description}
            Max Points: ${assignment.maxPoints}
            Difficulty: ${assignment.difficulty}

            STUDENT SUBMISSION (OCR EXTRACTED TEXT):
            "${submission.ocrText}"

            TASK:
            1. Analyze the student submission against the assignment instructions.
            2. Assign a grade out of ${assignment.maxPoints}.
            3. Provide detailed feedback.
            4. Suggest areas for improvement.

            OUTPUT FORMAT (JSON ONLY):
            {
                "grade": number,
                "feedback": "string",
                "analysis": "string"
            }
        `;

        const result = await generateJSON(prompt);

        if (!result) {
            return res.status(500).json({ message: 'AI Grading failed to generate valid result' });
        }

        // Update Submission
        submission.grade = result.grade;
        submission.feedback = result.feedback;
        submission.aiAnalysis = result.analysis;
        submission.gradingMode = 'AI';
        submission.status = 'graded';
        await submission.save();

        res.json(submission);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during grading' });
    }
};

// @desc Get details of a submission
// @route GET /api/submissions/:id
// @access Private
const getSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
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
}

module.exports = {
    uploadSubmission,
    gradeSubmissionAI,
    getSubmission,
    getMySubmission
};

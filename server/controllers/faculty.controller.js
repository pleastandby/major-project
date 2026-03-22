const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Syllabus = require('../models/Syllabus');
const Assignment = require('../models/Assignment');
const { generateJSON, generateJSONWithFile, generateMultipleQuestions, regenerateSingleQuestion } = require('../services/gemini.service');
const { uploadToSupabase, streamFromSupabase, downloadFromSupabase, deleteFromSupabase } = require('../config/supabase');

// @desc    Upload syllabus
// @route   POST /api/faculty/syllabus
// @access  Private
const uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }        // Extract Text from PDF
        let extractedText = '';
        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
        } catch (error) {
            console.error('PDF Extraction Error:', error.message);
        }

        // Upload to Supabase
        let driveFileId;
        try {
            driveFileId = await uploadToSupabase(req.file.path, req.file.originalname, req.file.mimetype);
        } catch(e) {
            if(fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            throw e;
        }

        // Clean up temp
        if(fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        // Save to DB
        const syllabus = await Syllabus.create({
            filename: req.file.originalname,
            originalName: req.file.originalname,
            path: '/api/files/' + driveFileId,
            uploadedBy: req.user.id,
            size: req.file.size,
            content: extractedText,
            course: courseId
        });

        // Return file info
        res.status(200).json({
            message: 'Syllabus uploaded successfully',
            syllabus
        });
    } catch (error) {
        console.error('Error in uploadSyllabus:', error);
        res.status(500).json({ message: 'Server error during file upload' });
    }
};

// @desc    Generate Assignment from Syllabus
// @route   POST /api/faculty/assignments/generate
// @access  Private
const generateAssignmentFromSyllabus = async (req, res) => {
    const { syllabusId, title, description, topics, numQuestions, marksPerQuestion } = req.body;

    try {
        const syllabus = await Syllabus.findById(syllabusId);
        if (!syllabus) {
            return res.status(404).json({ message: 'Syllabus not found' });
        }

        const prompt = `
            You are an expert educational assistant. Create an assignment based on the provided syllabus content.
            
            **Configuration:**
            - **Title:** ${title}
            - **Description:** ${description}
            - **Focus Topics:** ${topics || "Entire Syllabus"}
            - **Number of Questions:** ${numQuestions || 5}
            - **Marks per Question:** ${marksPerQuestion || 10}

            **Instructions:**
            Generate a list of questions that test the student's understanding of the syllabus, specifically focusing on the topics mentioned if ANY.
            The questions should be suitable for a written assignment.
            
            **Output Format:**
            Return a purely JSON object with the following structure:
            {
                "title": "${title}",
                "description": "${description}",
                "questions": [
                    {
                        "questionText": "Question 1...",
                        "marks": ${marksPerQuestion || 10},
                        "type": "long_answer"
                    },
                     ...
                ],
                "answerKey": "## Answer Key\n\n### Q1: [Question Text]\n**Answer:** [Detailed Answer]\n\n### Q2: ... (Format as standard markdown with headers)"
            }
        `;

        let generatedAssignment;

        // CHECK: Do we have extracted text content?
        if (syllabus.content && syllabus.content.length > 50) {
            // Case 1: Use Extracted Text
            const fullPrompt = `
               ${prompt}

               **Syllabus Content:**
               ${syllabus.content.substring(0, 20000)}
           `;
            generatedAssignment = await generateJSON(fullPrompt);

        } else if (syllabus.path) {
            console.log('No text content found. Downloading PDF from Drive temporarily...');
            const fileId = syllabus.path.split('/').pop();
            const tempFilePath = path.join(__dirname, '../tmp', 'temp-' + fileId + '.pdf');
            await downloadFromSupabase(fileId, tempFilePath);
            
            console.log('Uploading temp PDF directly to Gemini 2.5 Flash...');
            try {
                generatedAssignment = await generateJSONWithFile(tempFilePath, 'application/pdf', prompt);
            } finally {
                // Always clean up temp file
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }

        } else {
            return res.status(400).json({ message: 'Syllabus file not found.' });
        }

        if (!generatedAssignment) {
            return res.status(500).json({ message: 'Failed to generate assignment from AI' });
        }

        res.json(generatedAssignment);

    } catch (error) {
        console.error('Assignment Generation Error:', error);
        res.status(500).json({ message: 'Server error during generation' });
    }
};

// @desc    Get all syllabus uploads for the faculty
// @route   GET /api/faculty/syllabus
// @access  Private
const getSyllabusList = async (req, res) => {
    try {
        const syllabusList = await Syllabus.find({ uploadedBy: req.user.id })
            .populate('course', 'title')
            .sort({ createdAt: -1 });
        res.json(syllabusList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete syllabus
// @route   DELETE /api/faculty/syllabus/:id
// @access  Private
const deleteSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.findById(req.params.id);

        if (!syllabus) {
            return res.status(404).json({ message: 'Syllabus not found' });
        }

        // Verify ownership
        if (syllabus.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Delete from Supabase
        if (syllabus.path && syllabus.path.startsWith('/api/files/')) {
            const fileId = syllabus.path.split('/').pop();
            await deleteFromSupabase(fileId);
        }

        // Delete from DB
        await syllabus.deleteOne();

        res.json({ message: 'Syllabus removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save generated assignment
// @route   POST /api/faculty/assignments/save
// @access  Private
const saveGeneratedAssignment = async (req, res) => {
    const { title, description, questions, syllabusId, topics, numQuestions, marksPerQuestion, courseId, dueDate, answerKey } = req.body;

    try {
        const assignment = await Assignment.create({
            title,
            description,
            questions,
            syllabusId,
            courseId: courseId || null, // Optional Association
            createdBy: req.user.id,
            type: 'AI_Generated',
            topics,
            numQuestions,
            marksPerQuestion,
            dueDate,
            answerKey
        });

        res.status(201).json({
            message: 'Assignment saved successfully',
            assignment
        });
    } catch (error) {
        console.error('Save Assignment Error:', error);
        res.status(500).json({ message: 'Server error saving assignment' });
    }
};

// @desc    Get all assignments for faculty
// @route   GET /api/faculty/assignments
// @access  Private
const getAssignmentsList = async (req, res) => {
    try {
        const assignments = await Assignment.aggregate([
            {
                $match: {
                    createdBy: new mongoose.Types.ObjectId(req.user.id)
                }
            },
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'assignmentId',
                    as: 'submissions'
                }
            },
            {
                $lookup: {
                    from: 'enrollments',
                    localField: 'courseId',
                    foreignField: 'courseId',
                    pipeline: [
                        { $match: { status: 'active' } }
                    ],
                    as: 'enrollments'
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    createdAt: 1,
                    questions: 1,
                    type: 1,
                    dueDate: 1,
                    courseId: 1,
                    submissionCount: { $size: '$submissions' },
                    totalStudents: { $size: '$enrollments' }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get assignment by ID
// @route   GET /api/faculty/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update assignment
// @route   PATCH /api/faculty/assignments/:id
// @access  Private
const updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields
        const { title, description, questions, dueDate, maxPoints } = req.body;
        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (questions) assignment.questions = questions;
        if (dueDate) assignment.dueDate = dueDate;
        if (maxPoints) assignment.maxPoints = maxPoints;

        await assignment.save();

        res.json({
            message: 'Assignment updated successfully',
            assignment
        });
    } catch (error) {
        console.error('Update Assignment Error:', error);
        res.status(500).json({ message: 'Server error updating assignment' });
    }
};

// @desc    Regenerate all questions in an assignment
// @route   POST /api/faculty/assignments/:id/regenerate-all
// @access  Private
const regenerateAllQuestions = async (req, res) => {
    try {
        const { syllabusId, topics, numQuestions, marksPerQuestion } = req.body;
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Use existing question count if not provided
        const totalQuestions = numQuestions || assignment.questions?.length || 5;
        const marks = marksPerQuestion || (assignment.questions?.[0]?.marks) || 10;

        let syllabusContent = '';
        let tempFilePath = null;
        let mimeType = null;

        if (syllabusId) {
            const syllabus = await Syllabus.findById(syllabusId);
            if (syllabus) {
                if (syllabus.content && syllabus.content.length > 50) {
                    syllabusContent = syllabus.content;
                } else if (syllabus.filename) {
                    const fileId = syllabus.path.split('/').pop();
                    tempFilePath = path.join(__dirname, '../tmp', 'temp-' + fileId + '.pdf');
                    await downloadFromSupabase(fileId, tempFilePath);
                    mimeType = 'application/pdf';
                }
            }
        }

        let newQuestions;
        try {
            // Generate all questions at once for efficiency
            newQuestions = await generateMultipleQuestions(
                syllabusContent,
                tempFilePath,
                mimeType,
                totalQuestions,
                topics,
                marks
            );
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }

        if (!newQuestions || !Array.isArray(newQuestions) || newQuestions.length === 0) {
            return res.status(500).json({ message: 'Failed to generate questions' });
        }

        // Update assignment with new questions and metadata
        assignment.questions = newQuestions;
        assignment.regenerationCount = (assignment.regenerationCount || 0) + 1;
        assignment.lastRegenerated = new Date();
        await assignment.save();

        res.json({
            message: 'All questions regenerated successfully',
            assignment
        });

    } catch (error) {
        console.error('Regenerate All Questions Error:', error);
        res.status(500).json({ message: 'Server error regenerating questions' });
    }
};

// @desc    Regenerate a single question
// @route   POST /api/faculty/assignments/:id/regenerate-question
// @access  Private
const regenerateQuestion = async (req, res) => {
    try {
        const { questionIndex, syllabusId, topics, marksPerQuestion } = req.body;
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Validate question index
        if (questionIndex !== undefined && (questionIndex < 0 || questionIndex >= assignment.questions.length)) {
            return res.status(400).json({ message: 'Invalid question index' });
        }

        const oldQuestion = assignment.questions[questionIndex].questionText;

        // Get syllabus content if available
        let syllabusContent = '';
        let tempFilePath = null;
        if (syllabusId) {
            const syllabus = await Syllabus.findById(syllabusId);
            if (syllabus) {
                if (syllabus.content && syllabus.content.length > 50) {
                    syllabusContent = syllabus.content;
                } else if (syllabus.filename) {
                    const fileId = syllabus.path.split('/').pop();
                    tempFilePath = path.join(__dirname, '../tmp', 'temp-' + fileId + '.pdf');
                    await downloadFromSupabase(fileId, tempFilePath);
                }
            }
        }

        let newQuestion;
        try {
            // Call dedicated service method
            newQuestion = await regenerateSingleQuestion(
                syllabusContent,
                tempFilePath,
                topics,
                marksPerQuestion || assignment.questions[questionIndex].marks,
                oldQuestion
            );
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }

        if (!newQuestion || !newQuestion.questionText) {
            console.error('Gemini Regeneration Failed for Single Question');
            return res.status(500).json({ message: 'Failed to regenerate question from AI service' });
        }

        console.log('Question Regenerated Successfully:', newQuestion.questionText);
        res.json(newQuestion);

    } catch (error) {
        console.error('Regenerate Question Controller Error:', error);
        res.status(500).json({ message: 'Server error regenerating question' });
    }
};

// @desc    Delete assignment
// @route   DELETE /api/faculty/assignments/:id
// @access  Private
const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify ownership
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await assignment.deleteOne();

        res.json({ message: 'Assignment removed' });
    } catch (error) {
        console.error('Delete Assignment Error:', error);
        res.status(500).json({ message: 'Server error deleting assignment' });
    }
};

// @desc    Regenerate a single question (Preview Mode - not saved yet)
// @route   POST /api/faculty/assignments/regenerate-preview
// @access  Private
const regeneratePreviewQuestion = async (req, res) => {
    try {
        const { syllabusId, topics, marks, currentQuestionText } = req.body;

        if (!syllabusId) {
            return res.status(400).json({ message: 'Syllabus ID is required' });
        }

        // Get syllabus content if available
        let syllabusContent = '';
        let tempFilePath = null;

        const syllabus = await Syllabus.findById(syllabusId);
        if (syllabus) {
            if (syllabus.content && syllabus.content.length > 50) {
                syllabusContent = syllabus.content;
            } else if (syllabus.filename) {
                const fileId = syllabus.path.split('/').pop();
                    tempFilePath = path.join(__dirname, '../tmp', 'temp-' + fileId + '.pdf');
                    await downloadFromSupabase(fileId, tempFilePath);
            }
        } else {
            return res.status(404).json({ message: 'Syllabus not found' });
        }

        let newQuestion;
        try {
            // Call dedicated service method
            newQuestion = await regenerateSingleQuestion(
                syllabusContent,
                tempFilePath,
                topics,
                marks,
                currentQuestionText
            );
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }

        if (!newQuestion || !newQuestion.questionText) {
            console.error('Gemini Regeneration Failed for Preview Question');
            return res.status(500).json({ message: 'Failed to regenerate question' });
        }

        res.json(newQuestion);

    } catch (error) {
        console.error('Regenerate Preview Question Error:', error);
        res.status(500).json({ message: 'Server error regenerating question' });
    }
};

module.exports = {
    uploadSyllabus,
    getSyllabusList,
    deleteSyllabus,
    generateAssignmentFromSyllabus,
    saveGeneratedAssignment,
    getAssignmentsList,
    getAssignmentById,
    updateAssignment,
    regenerateAllQuestions,
    regenerateQuestion,
    regeneratePreviewQuestion,
    deleteAssignment
};

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Syllabus = require('../models/Syllabus');
const Assignment = require('../models/Assignment');
const { generateJSON, generateJSONWithFile } = require('../services/gemini.service');

// @desc    Upload syllabus
// @route   POST /api/faculty/syllabus
// @access  Private
const uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Extract Text from PDF
        let extractedText = '';
        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
            console.log('PDF Parse Success. Text Length:', extractedText ? extractedText.length : 0);
        } catch (error) {
            console.error('PDF Extraction Error:', error.message);
        }

        console.log('Final Extracted Text Length before DB Save:', extractedText ? extractedText.length : 0);

        // Save to DB
        const syllabus = await Syllabus.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            uploadedBy: req.user.id,
            size: req.file.size,
            content: extractedText
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
                ]
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

        } else if (fs.existsSync(syllabus.path)) {
            // Case 2: No Text Extracted - Upload PDF directly to Gemini
            console.log('No text content found. Uploading PDF directly to Gemini 2.5 Flash...');
            generatedAssignment = await generateJSONWithFile(syllabus.path, 'application/pdf', prompt);

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
        const syllabusList = await Syllabus.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
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

        // Delete from File System
        if (fs.existsSync(syllabus.path)) {
            fs.unlinkSync(syllabus.path);
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
    const { title, description, questions, syllabusId, topics, numQuestions, marksPerQuestion } = req.body;

    try {
        const assignment = await Assignment.create({
            title,
            description,
            questions,
            syllabusId,
            createdBy: req.user.id,
            type: 'AI_Generated',
            topics,
            numQuestions,
            marksPerQuestion
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
        const assignments = await Assignment.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 })
            .select('title description createdAt questions type');
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

module.exports = {
    uploadSyllabus,
    getSyllabusList,
    deleteSyllabus,
    generateAssignmentFromSyllabus,
    saveGeneratedAssignment,
    getAssignmentsList,
    getAssignmentById
};

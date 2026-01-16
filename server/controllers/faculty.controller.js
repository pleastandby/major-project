const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Syllabus = require('../models/Syllabus');
const { generateJSON } = require('../services/gemini.service');

// @desc    Upload syllabus
// @route   POST /api/faculty/syllabus
// @access  Private
const uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Extract Text from PDF (Optional / Best Effort)
        let extractedText = '';
        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
        } catch (pdfError) {
            console.error('PDF Extraction Warning:', pdfError.message);
            // We continue without text if extraction fails
        }

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

        if (!syllabus.content) {
            // Need to handle cases where old syllabus doesn't have content or extraction failed.
            // For now, fail. Ideally, we could attempt re-extraction here.
            return res.status(400).json({ message: 'Syllabus content text not available. Please re-upload.' });
        }

        const prompt = `
            You are an expert educational assistant. Create an assignment based on the provided syllabus content.
            
            **Configuration:**
            - **Title:** ${title}
            - **Description:** ${description}
            - **Focus Topics:** ${topics || "Entire Syllabus"}
            - **Number of Questions:** ${numQuestions || 5}
            - **Marks per Question:** ${marksPerQuestion || 10}

            **Syllabus Content:**
            ${syllabus.content.substring(0, 15000)} // Truncate to avoid context limit if excessively huge

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

        const generatedAssignment = await generateJSON(prompt);

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

module.exports = {
    uploadSyllabus,
    getSyllabusList,
    deleteSyllabus,
    generateAssignmentFromSyllabus
};

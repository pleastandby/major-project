const fs = require('fs');
const path = require('path');

// @desc    Upload syllabus
// @route   POST /api/faculty/syllabus
// @access  Private (Faculty only - to be protected by middleware in routes)
const uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Return file info
        res.status(200).json({
            message: 'Syllabus uploaded successfully',
            filePath: req.file.path,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error in uploadSyllabus:', error);
        res.status(500).json({ message: 'Server error during file upload' });
    }
};

module.exports = {
    uploadSyllabus
};

const Tesseract = require('tesseract.js');
const fs = require('fs');

const extractText = async (filePath) => {
    try {
        const { data: { text } } = await Tesseract.recognize(
            filePath,
            'eng',
            { logger: m => console.log(m) } // Optional: log progress
        );
        return text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text from image');
    } finally {
        // Cleanup temp file if needed, or leave for caller
    }
};

module.exports = {
    extractText,
};

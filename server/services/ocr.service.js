const { generateTextWithFile } = require('./gemini.service');
const fs = require('fs');

const extractText = async (filePath, mimeType = 'image/png') => {
    try {
        // Determine mimeType if possible, or default to image/png (Multer saves without extension usually)
        // ideally we pass the mimetype from the controller
        console.log(`Starting OCR on ${filePath} with type ${mimeType}...`);

        const prompt = "Extract all text from this image/document. Preserve the structure as much as possible. If it is handwritten, transcribed it accurately.";
        const text = await generateTextWithFile(filePath, mimeType, prompt);

        return text;
    } catch (error) {
        console.error('OCR Error:', error);
        // Fallback or rethrow? 
        // For now, let's return a placeholder if it fails so the submission doesn't fail entirely
        return "Error extracting text. Please verify manually.";
    }
};

module.exports = {
    extractText,
};

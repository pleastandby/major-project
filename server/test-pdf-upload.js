require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs');

const run = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

        // Create a test PDF path (use an actual uploaded syllabus)
        const testPdfPath = 'uploads/faculty/syllabus-1768556823854-879088632.pdf';

        if (!fs.existsSync(testPdfPath)) {
            console.log('Test PDF not found. Please provide a valid path.');
            return;
        }

        console.log('1. Uploading PDF to Gemini...');
        const uploadResponse = await fileManager.uploadFile(testPdfPath, {
            mimeType: 'application/pdf',
            displayName: "Test Syllabus",
        });
        console.log('✓ Upload Success. URI:', uploadResponse.file.uri);

        console.log('2. Generating content with gemini-2.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: "Summarize the main topics covered in this syllabus document." }
        ]);

        const response = await result.response;
        console.log('✓ Generation Success!');
        console.log('Response:', response.text());

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
};

run();

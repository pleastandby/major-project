require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const run = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Create a small dummy PDF file (Base64) or just use a text file masquerading?
        // Actually, inline data works best for Images. For PDF, it's supported but let's test.

        // We'll try to generate simple text first with 1.5-flash to verify the MODEL exists.
        console.log('Testing gemini-1.5-flash simple text...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-1.5-flash TEXT:', result.response.text());
        } catch (e) {
            console.log('Failed gemini-1.5-flash TEXT', e.message);
            // If this fails, then 1.5-flash is NOT available at all.
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

run();

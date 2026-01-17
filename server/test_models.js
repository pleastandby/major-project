require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const run = async () => {
    try {
        // Only valid if using the alpha/beta SDK sometimes, but standard way is often just knowing the name.
        // Let's use a known stable model.

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Try gemini-1.5-flash
        console.log('Trying gemini-1.5-flash ...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-1.5-flash');
        } catch (e) { console.log('Failed gemini-1.5-flash', e.message); }

        // Try gemini-1.5-flash-latest
        console.log('Trying gemini-1.5-flash-latest ...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-1.5-flash-latest');
        } catch (e) { console.log('Failed gemini-1.5-flash-latest', e.message); }

        // Try gemini-1.5-flash-001
        console.log('Trying gemini-1.5-flash-001 ...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-1.5-flash-001');
        } catch (e) { console.log('Failed gemini-1.5-flash-001', e.message); }

        // Try gemini-1.5-pro
        console.log('Trying gemini-1.5-pro ...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-1.5-pro');
        } catch (e) { console.log('Failed gemini-1.5-pro', e.message); }

        console.log('Trying gemini-pro ...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello?");
            console.log('Success gemini-pro');
        } catch (e) { console.log('Failed gemini-pro', e.message); }

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

run();

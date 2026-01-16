const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const generateContent = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        // ... (rest is same, but keeping it clean)
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate content");
    }
};

const generateJSON = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt + "\n\nOutput ONLY valid JSON. No markdown code blocks.");
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini JSON Error:", error);
        return null;
    }
}

const generateJSONWithFile = async (filePath, mimeType, prompt) => {
    try {
        console.log('Uploading file to Gemini:', filePath);
        // 1. Upload the file to Google AI
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: mimeType,
            displayName: "Syllabus Upload",
        });
        console.log('File uploaded. URI:', uploadResponse.file.uri);

        // 2. Generate content using the uploaded file with gemini-2.5-flash
        console.log('Generating content with Gemini 2.5 Flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: prompt + "\n\nOutput ONLY valid JSON. No markdown code blocks." }
        ]);

        const response = await result.response;
        let text = response.text();
        console.log('Gemini Raw Response:', text.substring(0, 200) + '...');

        // 3. Cleanup: Delete the file from Google AI to be clean (optional but good practice)
        // await fileManager.deleteFile(uploadResponse.file.name); 

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini File JSON Error:", error);
        return null;
    }
};

module.exports = {
    generateContent,
    generateJSON,
    generateJSONWithFile
};

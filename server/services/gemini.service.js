const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateContent = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
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
        // Enforce JSON structure in the prompt wrapper if needed, but assuming caller handles it for now
        // or we can append "Output purely valid JSON."
        const result = await model.generateContent(prompt + "\n\nOutput ONLY valid JSON. No markdown code blocks.");
        const response = await result.response;
        let text = response.text();

        // Cleanup markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini JSON Error:", error);
        return null; // or throw
    }
}

module.exports = {
    generateContent,
    generateJSON
};

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

const generateMultipleQuestions = async (syllabusContent, filePath, mimeType, numQuestions, topics, marksPerQuestion) => {
    try {
        const prompt = `
            You are an expert educational assistant. Generate ${numQuestions} diverse, high-quality questions for an assignment.
            
            **Configuration:**
            - **Number of Questions:** ${numQuestions}
            - **Topics:** ${topics || "All topics from the syllabus"}
            - **Marks per Question:** ${marksPerQuestion || 10}
            
            **Instructions:**
            Generate ${numQuestions} unique questions that test the student's understanding of the syllabus.
            Each question should be distinct and cover different aspects of the material.
            The questions should be suitable for a written assignment and vary in their focus.
            
            **Output Format:**
            Return a purely JSON array with the following structure:
            [
                {
                    "questionText": "First question...",
                    "marks": ${marksPerQuestion || 10},
                    "type": "long_answer"
                },
                {
                    "questionText": "Second question...",
                    "marks": ${marksPerQuestion || 10},
                    "type": "long_answer"
                }
            ]
        `;

        let result;

        // If we have file path, use file-based generation
        if (filePath && mimeType) {
            console.log('Generating multiple questions with file upload...');
            result = await generateJSONWithFile(filePath, mimeType, prompt);
        }
        // Otherwise use text-based generation
        else if (syllabusContent && syllabusContent.length > 50) {
            console.log('Generating multiple questions with text content...');
            const fullPrompt = `
                ${prompt}
                
                **Syllabus Content:**
                ${syllabusContent.substring(0, 20000)}
            `;
            result = await generateJSON(fullPrompt);
        }
        else {
            throw new Error('No valid syllabus content or file provided');
        }

        // Validate result is an array
        if (!Array.isArray(result)) {
            console.error('Expected array result, got:', typeof result);
            return null;
        }

        return result;

    } catch (error) {
        console.error('Generate Multiple Questions Error:', error);
        return null;
    }
};

const regenerateSingleQuestion = async (syllabusContent, syllabusPath, topic, marks, oldQuestion) => {
    try {
        const prompt = `
            You are an expert educational assistant. Regenerate a SINGLE question for an assignment.
            
            **Configuration:**
            - **Topic:** ${topic || "General"}
            - **Marks:** ${marks || 10}
            
            **Old Question (to replace):**
            "${oldQuestion}"
            
            **Instructions:**
            Generate EXACTLY ONE new and different high-quality question that tests similar concepts.
            Do NOT generate a list of questions.
            Do NOT generate an array.
            Return ONLY a single JSON object.
            
            **Output Format:**
            {
                "questionText": "Your single new question text here...",
                "marks": ${marks || 10},
                "type": "long_answer"
            }
        `;

        let result;

        console.log('Regenerating single question...');

        // 1. Try file-based generation
        if (syllabusPath) {
            console.log('Using file-based generation for regeneration...');
            // Use 1.5-flash or 2.5-flash depending on stability. Using 1.5-flash for JSON mode specifically here.
            // Actually, sticking to the pattern of separate config for reliability.
            // Re-using generateJSONWithFile logic but with specific model config if needed.
            // For simplicity, let's reuse generateJSONWithFile but make sure it uses a model that supports JSON if possible.
            // Since we reverted, generateJSONWithFile uses 2.5-flash.
            result = await generateJSONWithFile(syllabusPath, 'application/pdf', prompt);
        }
        // 2. Text-based generation
        else if (syllabusContent) {
            console.log('Using text-based generation for regeneration...');
            const fullPrompt = `
                ${prompt}
                
                **Syllabus Content:**
                ${syllabusContent.substring(0, 20000)}
            `;
            result = await generateJSON(fullPrompt);
        }
        // 3. Context-free generation (fallback)
        else {
            console.log('Using context-free generation for regeneration...');
            result = await generateJSON(prompt);
        }

        // Safety check: if model returned an array, take the first item
        if (Array.isArray(result)) {
            console.log('Model returned array, picking first item...');
            result = result[0];
        }

        return result;

    } catch (error) {
        console.error('Regenerate Single Question Error:', error);
        return null;
    }
};

module.exports = {
    generateContent,
    generateJSON,
    generateJSONWithFile,
    generateMultipleQuestions,
    regenerateSingleQuestion
};

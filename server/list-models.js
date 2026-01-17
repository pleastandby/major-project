require('dotenv').config();

const run = async () => {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available Gemini Models:');
            data.models
                .filter(m => m.name.toLowerCase().includes('gemini'))
                .forEach(m => console.log(`- ${m.name} (${m.displayName})`));
        } else {
            console.log('No models found or error:', data);
        }
    } catch (error) {
        console.error('Fetch Failed:', error);
    }
};

run();

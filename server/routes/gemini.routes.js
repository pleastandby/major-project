const express = require('express');
const router = express.Router();
const { generateContent } = require('../services/gemini.service');

// @desc    Generate content using Gemini
// @route   POST /api/gemini/generate
// @access  Public (should be protected in prod)
router.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const text = await generateContent(prompt);
        res.json({ result: text });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

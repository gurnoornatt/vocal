const express = require('express');
const router = express.Router();
const { analyzeTone } = require('../services/toneAnalyzer');

router.post('/', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: "Invalid input",
                details: "Must provide text for analysis"
            });
        }

        const toneAnalysis = await analyzeTone(text);
        res.json(toneAnalysis);

    } catch (error) {
        console.error('Route handler error:', error);
        res.status(500).json({
            error: 'Failed to analyze tone',
            details: error.message
        });
    }
});

module.exports = router; 
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store for conversation contexts (in production, use a proper database)
const conversations = new Map();

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [], provider = 'openai', apiKey } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Use the API key from request or environment
        const key = apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

        if (!key && provider !== 'custom') {
            return res.status(400).json({
                error: 'API key is required. Please configure it in the extension settings or .env file'
            });
        }

        let response;

        // Route to appropriate AI provider
        switch (provider) {
            case 'openai':
                response = await callOpenAI(message, conversationHistory, key);
                break;
            case 'gemini':
                response = await callGemini(message, conversationHistory, key);
                break;
            default:
                response = await callOpenAI(message, conversationHistory, key);
        }

        res.json({ response });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({
            error: 'Failed to process request',
            message: error.message
        });
    }
});

// OpenAI API integration
async function callOpenAI(message, history, apiKey) {
    const messages = [
        {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses. Format code with markdown code blocks.'
        },
        ...history,
        { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Google Gemini API integration
async function callGemini(message, history, apiKey) {
    // Convert conversation history to Gemini format
    const contents = [];

    history.forEach(msg => {
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        });
    });

    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Assistant Backend is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port:${PORT}`);

});

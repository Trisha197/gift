require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Configuration, OpenAIApi } = require('openai');
const NodeCache = require('node-cache');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Cache (for session management)
const sessionCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 120 
});

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// System Prompt
const SYSTEM_PROMPT = `You are Gift Finder, a warm, enthusiastic, and helpful AI assistant specialized in finding the perfect gifts. Your goal is to have a natural conversation to understand the recipient and provide personalized gift suggestions.

Key Guidelines:
1. Be conversational and friendly - use emojis occasionally for warmth
2. Ask clarifying questions one at a time
3. Collect these details naturally: recipient's name, age, relationship to user, interests/hobbies, occasion, budget, aesthetic preferences
4. When you have enough information, provide 3-5 specific gift suggestions with brief descriptions
5. Be creative and thoughtful - suggest unique items, not just generic gifts
6. Keep responses concise (2-3 sentences max unless listing suggestions)
7. Format gift suggestions as a bulleted list with emojis
8. If the user seems unsure, offer to ask more questions

Example response with suggestions:
"Based on what you've told me about Sarah, here are some thoughtful gift ideas:

🎨 Personalized Art Print - A custom illustration of her favorite travel destination
📚 Book Subscription Box - Monthly curated books based on her interests in mystery novels
🧘 Yoga Mat with Custom Design - A high-quality mat featuring her favorite motivational quote

Would you like more details about any of these suggestions?"`;

// Helper: Build conversation history
const buildConversation = (sessionData, userMessage) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // Add conversation history
  if (sessionData && sessionData.history) {
    sessionData.history.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  return messages;
};

// Helper: Parse gift suggestions from AI response
const parseSuggestions = (text) => {
  const suggestions = [];
  const lines = text.split('\n');
  
  let currentSuggestion = null;
  
  for (const line of lines) {
    // Check for bullet points or numbered items
    const trimmed = line.trim();
    if (trimmed.match(/^[•\-\*\d+\.]\s*/)) {
      // This is a suggestion
      const cleanLine = trimmed.replace(/^[•\-\*\d+\.]\s*/, '');
      // Try to extract name and description
      const parts = cleanLine.split(' - ');
      if (parts.length >= 2) {
        suggestions.push({
          name: parts[0].trim(),
          description: parts.slice(1).join(' - ').trim()
        });
      } else if (cleanLine.includes(':')) {
        const parts2 = cleanLine.split(':');
        suggestions.push({
          name: parts2[0].trim(),
          description: parts2.slice(1).join(':').trim()
        });
      } else {
        suggestions.push({
          name: cleanLine,
          description: ''
        });
      }
    }
  }
  
  return suggestions;
};

// API Endpoint: Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let sessionData = sessionCache.get(sessionId) || {
      history: [],
      context: {}
    };

    // Build conversation
    const messages = buildConversation(sessionData, message);

    // Call OpenAI
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const aiResponse = completion.data.choices[0].message.content;

    // Update session history
    sessionData.history.push({ role: 'user', content: message });
    sessionData.history.push({ role: 'assistant', content: aiResponse });
    
    // Keep history manageable (last 20 messages)
    if (sessionData.history.length > 20) {
      sessionData.history = sessionData.history.slice(-20);
    }

    sessionCache.set(sessionId, sessionData);

    // Parse for suggestions
    const suggestions = parseSuggestions(aiResponse);

    // Send response
    res.json({
      success: true,
      message: aiResponse,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.response) {
      if (error.response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        });
      }
      if (error.response.status === 401) {
        return res.status(401).json({ 
          error: 'API key error. Please check configuration.' 
        });
      }
    }

    res.status(500).json({ 
      error: 'Failed to generate response. Please try again.' 
    });
  }
});

// API Endpoint: Get suggestions (direct endpoint)
app.post('/api/suggest', async (req, res) => {
  try {
    const { recipient, interests, occasion, budget, sessionId } = req.body;

    if (!recipient || !interests) {
      return res.status(400).json({ 
        error: 'Recipient name and interests are required' 
      });
    }

    const prompt = `Please provide 5 gift suggestions for ${recipient} who is interested in ${interests}.${occasion ? ` The occasion is ${occasion}.` : ''}${budget ? ` The budget is ${budget}.` : ''} Please format as a bulleted list with emojis.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 400
    });

    const aiResponse = completion.data.choices[0].message.content;
    const suggestions = parseSuggestions(aiResponse);

    res.json({
      success: true,
      suggestions: suggestions,
      message: 'Here are some gift suggestions for you!'
    });

  } catch (error) {
    console.error('Suggest API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions. Please try again.' 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong! Please try again later.' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎁 Gift Finder API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// src/services/aiService.js

// System prompt for menstrual health chatbot
const SYSTEM_PROMPT = `You are a helpful and empathetic AI assistant specializing in menstrual health education.
You provide accurate, evidence-based information about menstruation, menstrual cycles, period health, hygiene, symptoms, and related topics.
You are respectful, non-judgmental, and supportive.
If asked about serious medical concerns, you advise consulting a healthcare professional.`;

// Import OpenAI SDK (Groq compatible)
import OpenAI from "openai";

// Groq API key (hardcoded)
const apiKey = "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";

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});

/**
 * Send a message to the AI and get a response
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - AI's response
 */
export const sendMessageToAI = async (message, conversationHistory = []) => {
  if (!apiKey) {
    throw new Error('API key not found. Please add VITE_GROQ_API_KEY to your .env file');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // FIXED: Updated to non-deprecated model
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      stream: false
    });
    return response.choices[0].message.content;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      console.error('Groq API error response:', error.response.status, error.response.statusText);
      try {
        const errorData = await error.response.json();
        console.error('Groq API error details:', errorData);
      } catch (parseErr) {
        console.error('Error parsing Groq error response:', parseErr);
      }
    } else {
      console.error('Error calling Groq API:', error);
    }
    throw error;
  }
};

/**
 * Send a message with streaming response
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages
 * @param {Function} onChunk - Callback for each chunk of response
 * @returns {Promise<string>} - Complete response
 */
export const sendMessageWithStreaming = async (message, conversationHistory = [], onChunk) => {
  if (!apiKey) {
    throw new Error('API key not found. Please add VITE_GROQ_API_KEY to your .env file');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  let fullResponse = '';

  try {
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // FIXED: Updated to non-deprecated model
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        if (onChunk) onChunk(content);
      }
    }
    return fullResponse;
  } catch (error) {
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('Groq API streaming error response:', error.response.status, error.response.statusText);
      try {
        const errorData = await error.response.json();
        console.error('Groq API streaming error details:', errorData);
      } catch (parseErr) {
        console.error('Error parsing Groq streaming error response:', parseErr);
      }
    } else {
      console.error('Error with Groq streaming:', error);
    }
    throw error;
  }
};
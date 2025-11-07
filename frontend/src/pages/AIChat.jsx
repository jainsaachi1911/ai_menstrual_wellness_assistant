import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI } from '../services/aiService';
import '../styles/AIChat.css';

// Utility to format message text: bold for **word** and paragraph spacing
function formatMessageText(text) {
  if (!text) return '';
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n\n+/g, '</p><p>');
  formatted = formatted.replace(/([^.])\n/g, '$1<br/>');
  return `<p>${formatted}</p>`;
}

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Menstrual Health Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const aiResponse = await sendMessageToAI(inputMessage, conversationHistory);
      
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      setMessages(prev => prev.filter(msg => msg.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I am your Menstrual Health Assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  return (
    <div className="ai-chat-page">
      <div className="chat-header">
        <h3>Menstrual Health Assistant</h3>
        <p className="chat-status">
          <span className="status-dot"></span>
          Online
        </p>
        <button 
          className="clear-btn" 
          onClick={clearChat}
          title="Clear chat"
        >
          🗑️
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role}`}
          >
            <div className="message-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <div className="message-text" style={{whiteSpace: 'pre-line'}}>
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: formatMessageText(msg.content) }} />
                  : msg.content}
              </div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          rows="1"
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputMessage.trim()}
          className="send-btn"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </form>

      <div className="chat-disclaimer">
        <small>
          💡 This is an AI assistant. For medical concerns, please consult a healthcare professional.
        </small>
      </div>
    </div>
  );
};

export default AIChat;
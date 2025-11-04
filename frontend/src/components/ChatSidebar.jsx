// src/components/ChatSidebar.jsx
import React, { useState, useRef, useEffect } from 'react';

// Utility to format message text: bold for **word** and paragraph spacing
function formatMessageText(text) {
  if (!text) return '';
  // Replace **text** with <strong>text</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace single *text* with <strong>text</strong> (for cases like *Severe pain*)
  formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Replace double newlines or .\n with paragraph breaks
  formatted = formatted.replace(/\n\n+/g, '</p><p>');
  formatted = formatted.replace(/([^.])\n/g, '$1<br/>');
  // Wrap in <p> for clean spacing
  return `<p>${formatted}</p>`;
}
import { sendMessageToAI, sendMessageWithStreaming } from '../services/aiService';
import './ChatSidebar.css';


const ChatSidebar = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m here to help answer your questions about menstrual health. Feel free to ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = Math.max(320, Math.min(window.innerWidth - 100, window.innerWidth - e.clientX));
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history for API (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Option 1: Regular response (uncomment to use)
      const aiResponse = await sendMessageToAI(inputMessage, conversationHistory);
      
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Option 2: Streaming response (uncomment to use instead of Option 1)
      /*
      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      await sendMessageWithStreaming(
        inputMessage,
        conversationHistory,
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content += chunk;
            return newMessages;
          });
        }
      );
      */

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      
      // Remove the loading message if there was an error
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
        content: 'Hello! I\'m here to help answer your questions about menstrual health. Feel free to ask me anything!',
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-sidebar-overlay">
      <div className="chat-sidebar" style={{ maxWidth: width, width: width, minWidth: 320 }}>
        {/* Resize Handle */}
        <div
          className="chat-resize-handle"
          style={{ position: 'absolute', left: -8, top: 0, bottom: 0, width: 16, cursor: 'ew-resize', zIndex: 10 }}
          onMouseDown={() => setIsResizing(true)}
        />
        {/* Header */}
        <div className="chat-header">
          <div>
            <h3>Menstrual Health Assistant</h3>
            <p className="chat-status">
              <span className="status-dot"></span>
              Online
            </p>
          </div>
          <div className="chat-header-actions">
            <button 
              className="clear-btn" 
              onClick={clearChat}
              title="Clear chat"
            >
              🗑️
            </button>
            <button 
              className="close-btn" 
              onClick={onClose}
              title="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Container */}
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

        {/* Input Form */}
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

        {/* Disclaimer */}
        <div className="chat-disclaimer">
          <small>
            💡 This is an AI assistant. For medical concerns, please consult a healthcare professional.
          </small>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
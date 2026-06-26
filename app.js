import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaGift, FaSpinner, FaRobot, FaUser } from 'react-icons/fa';
import axios from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Theme Colors
const COLORS = {
  pastelGreen: '#B5D8C4',
  pastelBlue: '#A8D5E2',
  pastelLavender: '#D4C5E8',
  primary: '#8EC6D4',
  dark: '#2C3E50',
  light: '#FFFFFF',
  shadow: 'rgba(168, 213, 226, 0.3)'
};

// Initial Bot Message
const INITIAL_MESSAGE = {
  id: '1',
  sender: 'bot',
  text: "🎁 Hi there! I'm Gift Finder! I'll help you find the perfect gift. Just tell me about the person you're buying for - their interests, age, relationship to you, and any special occasion. Let's get started! ✨",
  timestamp: new Date()
};

function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Generate session ID
  useEffect(() => {
    const storedSession = localStorage.getItem('giftFinderSession');
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('giftFinderSession', newSession);
      setSessionId(newSession);
    }
  }, []);

  // Handle sending message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: input.trim(),
        sessionId: sessionId
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.data.message,
        timestamp: new Date(),
        suggestions: response.data.suggestions || []
      };

      setMessages(prev => [...prev, botMessage]);

      // If suggestions are available, show them
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        const giftMessage = {
          id: (Date.now() + 2).toString(),
          sender: 'bot',
          text: "🎉 Here are some gift suggestions I found for you:",
          suggestions: response.data.suggestions,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, giftMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "😅 Oops! I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Chat Message Component
  const ChatMessage = ({ message }) => {
    const isBot = message.sender === 'bot';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          justifyContent: isBot ? 'flex-start' : 'flex-end',
          marginBottom: '16px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          maxWidth: '80%'
        }}>
          {isBot && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelLavender})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(168, 213, 226, 0.3)'
            }}>
              <FaGift color="#FFFFFF" size={18} />
            </div>
          )}
          
          <div style={{
            padding: '12px 16px',
            borderRadius: isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
            background: isBot ? 
              `linear-gradient(135deg, ${COLORS.light}, rgba(255,255,255,0.9))` :
              `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelGreen})`,
            color: isBot ? COLORS.dark : '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            backdropFilter: isBot ? 'blur(10px)' : 'none',
            border: isBot ? '1px solid rgba(255,255,255,0.5)' : 'none'
          }}>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
              {message.text}
            </div>
            
            {message.suggestions && message.suggestions.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {message.suggestions.map((gift, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      padding: '10px 14px',
                      marginTop: '8px',
                      background: 'rgba(168, 213, 226, 0.15)',
                      borderRadius: '10px',
                      border: '1px solid rgba(168, 213, 226, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🎁</span>
                      <div>
                        <div style={{ fontWeight: '600', color: COLORS.dark }}>
                          {gift.name}
                        </div>
                        {gift.description && (
                          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                            {gift.description}
                          </div>
                        )}
                        {gift.price && (
                          <div style={{ fontSize: '13px', color: COLORS.pastelBlue, marginTop: '4px' }}>
                            💰 {gift.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {!isBot && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.pastelGreen}, ${COLORS.pastelBlue})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(181, 216, 196, 0.3)'
            }}>
              <FaUser color="#FFFFFF" size={16} />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '90vh',
          maxHeight: '700px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '30px',
          boxShadow: '0 20px 60px rgba(168, 213, 226, 0.3), 0 0 0 1px rgba(255,255,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelLavender})`,
          borderBottom: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            🎁
          </div>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#FFFFFF',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Gift Finder
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.9)',
              margin: 0
            }}>
              AI-powered gift assistant ✨
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#FFFFFF',
              backdropFilter: 'blur(10px)'
            }}>
              🟢 Online
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.3)'
        }}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelLavender})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaSpinner color="#FFFFFF" size={18} className="spinner" />
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Thinking</span>
                <span style={{ display: 'flex', gap: '4px' }}>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>.</motion.span>
                </span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px'
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the person you're buying for..."
              rows={1}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid rgba(168, 213, 226, 0.3)',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                minHeight: '48px',
                maxHeight: '120px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.pastelBlue;
                e.target.style.boxShadow = `0 0 0 4px ${COLORS.shadow}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(168, 213, 226, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelLavender})`,
                border: 'none',
                borderRadius: '16px',
                color: '#FFFFFF',
                fontSize: '16px',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isLoading ? 0.6 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '48px',
                fontWeight: '600'
              }}
            >
              <FaPaperPlane size={16} />
              Send
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 24px',
          background: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(44, 62, 80, 0.5)',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          ✨ Powered by AI • Find the perfect gift every time
        </div>
      </motion.div>

      {/* Spinner Animation CSS */}
      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        textarea {
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

export default App;

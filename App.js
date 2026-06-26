import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaGift, FaSpinner, FaUser } from 'react-icons/fa';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = {
  pastelGreen: '#B5D8C4',
  pastelBlue: '#A8D5E2',
  pastelLavender: '#D4C5E8',
  dark: '#2C3E50',
};

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      console.error('Error:', error);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
              `linear-gradient(135deg, #FFFFFF, rgba(255,255,255,0.9))` :
              `linear-gradient(135deg, ${COLORS.pastelBlue}, ${COLORS.pastelGreen})`,
            color: isBot ? COLORS.dark : '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: isBot ? '1px solid rgba(255,255,255,0.5)' : 'none'
          }}>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
              {message.text}
            </div>
            
            {message.suggestions && message.suggestions.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {message.suggestions.map((gift, index) => (
                  <div
                    key={index}
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
                      </div>
                    </div>
                  </div>
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
      padding: '20px',
      background: 'linear-gradient(135deg, #E8F4F8 0%, #E6F3F0 50%, #F0EAF8 100%)'
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
          boxShadow: '0 20px 60px rgba(168, 213, 226, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
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
            fontSize: '24px'
          }}>
            🎁
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Gift Finder
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              AI-powered gift assistant ✨
            </p>
          </div>
        </div>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
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
              <div style={{ padding: '12px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.8)' }}>
                <span>Thinking</span>
                <span>...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
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
              minHeight: '48px',
              maxHeight: '120px',
              fontFamily: 'inherit'
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
      </motion.div>

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;

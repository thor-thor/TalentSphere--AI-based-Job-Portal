import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, X, Send, Bot, User, Minimize2, Maximize2, RefreshCw } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QUICK_ACTIONS = [
  { label: '🔍 Find Frontend Jobs', message: 'Find me frontend jobs' },
  { label: '⚙️ Backend Roles', message: 'Show backend developer jobs' },
  { label: '💡 Skill Suggestions', message: 'What skills should I learn?' },
  { label: '🎯 Match My Profile', message: 'Suggest jobs based on my profile' },
];

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 16px',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}
    >
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            background: '#a78bfa',
            borderRadius: '50%',
            display: 'inline-block',
            animation: `bounce 1.2s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

const MessageBubble = ({ msg }) => {
  const isBot = msg.isBot;
  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: '12px' }}>
      {isBot && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0
        }}>
          <Bot size={14} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: isBot ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
        background: isBot
          ? 'rgba(255,255,255,0.07)'
          : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        border: isBot ? '1px solid rgba(255,255,255,0.1)' : 'none',
        color: 'white',
        fontSize: '13.5px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: isBot ? 'none' : '0 4px 15px rgba(124,58,237,0.3)',
      }}>
        {msg.text}
      </div>
      {!isBot && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px', flexShrink: 0
        }}>
          <User size={14} color="white" />
        </div>
      )}
    </div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! 👋 I'm your TalentSphere AI Assistant.\n\nI can help you:\n• Find jobs that match your skills\n• Suggest trending technologies to learn\n• Give you personalized role recommendations\n\nHow can I help you today?",
      isBot: true,
      id: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    setMessages(prev => [...prev, { text: msgText, isBot: false, id: Date.now() }]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        `${API_BASE}/api/chatbot`,
        { message: msgText },
        { headers, timeout: 15000 }
      );

      const botReply = response.data?.response || "I didn't get a response, please try again.";
      setMessages(prev => [...prev, { text: botReply, isBot: true, id: Date.now() + 1 }]);
    } catch (error) {
      const errMsg = error.response?.status === 401
        ? "Please log in to use personalized features like profile-based job recommendations!"
        : "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => [...prev, { text: errMsg, isBot: true, id: Date.now() + 1 }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      text: "Hello! 👋 I'm your TalentSphere AI Assistant.\n\nI can help you:\n• Find jobs that match your skills\n• Suggest trending technologies to learn\n• Give you personalized role recommendations\n\nHow can I help you today?",
      isBot: true,
      id: 0
    }]);
    setShowQuickActions(true);
  };

  const chatWidth = isExpanded ? '420px' : '360px';
  const chatHeight = isExpanded ? '600px' : '500px';

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 0 30px rgba(124,58,237,0.7), 0 0 50px rgba(167,139,250,0.3); }
        }
        .chatbot-fab:hover { transform: scale(1.1) !important; }
        .chatbot-send:hover:not(:disabled) { transform: scale(1.05); background: #6d28d9 !important; }
        .quick-chip:hover { background: rgba(124,58,237,0.3) !important; border-color: rgba(167,139,250,0.6) !important; transform: translateY(-1px); }
      `}</style>

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>

        {/* Floating Action Button */}
        {!isOpen && (
          <button
            id="chatbot-fab"
            className="chatbot-fab"
            onClick={() => setIsOpen(true)}
            style={{
              width: '60px', height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: '2px solid rgba(167,139,250,0.4)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s ease',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }}
            title="Open AI Assistant"
          >
            <Sparkles size={24} color="white" />
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div style={{
            width: chatWidth,
            height: chatHeight,
            borderRadius: '16px',
            background: 'rgba(15,10,30,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            transition: 'width 0.3s ease, height 0.3s ease',
          }}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'white', letterSpacing: '0.3px' }}>
                    TalentSphere AI
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                    Online · Rasa NLP
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleReset}
                  title="Reset conversation"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px', borderRadius: '6px' }}
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setIsExpanded(e => !e)}
                  title={isExpanded ? 'Minimize' : 'Expand'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px', borderRadius: '6px' }}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', padding: '4px', borderRadius: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(124,58,237,0.4) transparent',
            }}>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />

              {/* Quick Actions */}
              {showQuickActions && !isLoading && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick actions
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.label}
                        className="quick-chip"
                        onClick={() => sendMessage(action.message)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid rgba(124,58,237,0.4)',
                          background: 'rgba(124,58,237,0.15)',
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <input
                id="chatbot-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about jobs, skills..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '10px 16px',
                  color: 'white',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                id="chatbot-send"
                className="chatbot-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                    : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={16} color={input.trim() && !isLoading ? 'white' : 'rgba(255,255,255,0.3)'} />
              </button>
            </div>

            {/* Footer hint */}
            <div style={{
              padding: '6px 14px 10px',
              textAlign: 'center',
              fontSize: '10.5px',
              color: 'rgba(255,255,255,0.25)',
            }}>
              Powered by Rasa NLP · TalentSphere AI
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chatbot;

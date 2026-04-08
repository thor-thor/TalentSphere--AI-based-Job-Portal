import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, X, Send } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your TalentSphere AI assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, isBot: false };
    setMessages([...messages, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        message: input
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(msgs => [...msgs, { text: response.data.response, isBot: true }]);
    } catch (error) {
      setMessages(msgs => [...msgs, { text: "Sorry, I'm having trouble connecting to the AI service.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-light text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center border border-white/10"
          style={{ boxShadow: '0 0 20px rgba(138, 43, 226, 0.4)' }}
        >
          <Sparkles className="h-6 w-6" />
        </button>
      ) : (
        <div className="bg-bg-panel backdrop-blur-xl rounded-2xl shadow-2xl w-80 md:w-96 overflow-hidden flex flex-col border border-glass-border transition-all duration-300 transform scale-100">
          <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-bold tracking-tight">TalentSphere AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-white/70 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-black/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.isBot 
                    ? 'bg-white/10 text-white rounded-tl-none border border-white/5' 
                    : 'bg-primary text-white rounded-tr-none shadow-lg'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white p-3 rounded-2xl rounded-tl-none border border-white/5 flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white/5 border-t border-glass-border flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about jobs, resumes..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:ring-2 focus:ring-secondary/50 focus:outline-none placeholder:text-gray-500"
            />
            <button
              onClick={handleSend}
              className="bg-primary text-white p-2 rounded-full hover:bg-primary-light disabled:opacity-50 transition-all shadow-md"
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

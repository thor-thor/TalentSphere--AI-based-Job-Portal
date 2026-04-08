import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, UserCircle, Search } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import { io } from 'socket.io-client';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Need to use the raw axios instance to hit our new route
  // The existing api uses an instance with interceptors for token.
  // Assuming axios is globally configured or there's an instance exported.
  // We'll just define the base URL for here just in case.
  const apiInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    // Initial fetch of conversations
    apiInstance.get('/messages/conversations')
      .then(res => setConversations(res.data.conversations))
      .catch(err => console.error(err));

    // Initialize Socket.io
    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      if(user) newSocket.emit('join', user.id);
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => {
        // Only append if it belongs to the currently active conversation
        return [...prev, message];
      });
      // A more robust app would also update the conversations list with the new last message
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && conversations.length > 0) {
      const convo = conversations.find(c => c.user_id === userId);
      if (convo) {
        setSelectedConvo(convo);
      } else {
        const newConvo = { user_id: userId, first_name: 'User', last_name: '', avatar_url: null };
        setConversations(prev => [...prev, newConvo]);
        setSelectedConvo(newConvo);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConvo) {
      apiInstance.get(`/messages/${selectedConvo.user_id}`)
        .then(res => setMessages(res.data.messages))
        .catch(err => console.error(err));
    }
  }, [selectedConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConvo || !socket) return;

    const messageData = {
      to: selectedConvo.user_id,
      message: inputMessage
    };

    // Emit via socket
    socket.emit('sendMessage', messageData);

    // Optimistically add to UI
    setMessages(prev => [...prev, {
      from: user.id, // we don't have id from DB yet but we fake it
      sender_id: user.id,
      content: inputMessage,
      created_at: new Date().toISOString()
    }]);

    setInputMessage('');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ padding: 0, display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
        
        {/* Left Sidebar - Conversations */}
        <div style={{ width: '320px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="search-box" style={{ padding: '0.5rem', borderRadius: 'var(--radius)' }}>
              <Search size={18} className="text-gray-500" />
              <input type="text" placeholder="Search..." className="search-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} />
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>No conversations yet.</div>
            ) : (
              conversations.map(convo => (
                <div 
                  key={convo.user_id} 
                  onClick={() => setSelectedConvo(convo)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    background: selectedConvo?.user_id === convo.user_id ? 'rgba(138, 43, 226, 0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <UserCircle size={40} className="text-gray-500" />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="font-medium">{convo.first_name} {convo.last_name}</div>
                    <div className="text-sm text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {convo.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <UserCircle size={40} className="text-primary" />
                <div>
                  <div className="font-bold text-lg">{selectedConvo.first_name} {selectedConvo.last_name}</div>
                  <div className="text-sm text-gray-500 capitalize">{selectedConvo.role.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id || msg.from === user.id;
                  return (
                    <div key={idx} style={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      background: isMe ? 'var(--primary)' : 'var(--bg-panel)',
                      border: isMe ? 'none' : '1px solid var(--glass-border)',
                      color: isMe ? '#fff' : 'var(--text-main)',
                      boxShadow: 'var(--glass-shadow)'
                    }}>
                      <div>{msg.content || msg.message}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem', textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Type a message..." 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem', borderRadius: '50%' }}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'rgba(138, 43, 226, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid rgba(138, 43, 226, 0.2)'
              }}>
                <Send size={40} className="text-primary opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Inbox</h3>
              <p style={{ maxWidth: '300px' }}>Select a conversation from the sidebar to start messaging and coordinating applications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

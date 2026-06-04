import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

/**
 * Premium AI Underwriting Assistant Chatbot Component
 * Features floating toggles, glassmorphism layout card, typing animations, suggestion chips,
 * and conversational fallback routing to mock queries offline.
 */
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am FinGenius AI, your credit underwriting assistant. Ask me anything about credit metrics, DTI ratios, FICO tiers, EMI formulas, security compliance, or system processes.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Predefined suggestion chips
  const suggestions = [
    'Explain DTI limits',
    'Calculate EMI formula',
    'CIBIL score tiers',
    'GLBA & SOC2 compliance',
    'Status lifecycle'
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Clear input if sending from text box
    if (!textToSend) {
      setInputText('');
    }

    // 1. Append User Message
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Format chat history for backend (skip initial welcome message)
      const chatHistory = messages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      // 2. Query Chatbot Endpoint
      const response = await api.chat(text, chatHistory);
      
      // 3. Append Assistant Response
      const assistantReply = response.data.reply;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantReply }
      ]);
    } catch (err) {
      console.error('[Chatbot] Failed to send query:', err);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: '⚠️ Failed to connect to underwriting server. Please verify backend status or retry.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Clear active co-pilot conversation logs?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I am FinGenius AI, your credit underwriting assistant. Ask me anything about credit metrics, DTI ratios, FICO tiers, EMI formulas, security compliance, or system processes.'
        }
      ]);
    }
  };

  // Helper function to format basic markdown (bold, lists, code) into React elements safely
  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Replace inline code blocks
    let html = text.replace(/`(.*?)`/g, '<code style="background-color: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #06B6D4;">$1</code>');
    // Replace bold text tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFFFFF; font-weight: 600;">$1</strong>');
    
    const lines = html.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      // Render bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.slice(2);
        return (
          <li 
            key={i} 
            style={{ marginLeft: '16px', listStyleType: 'disc', marginBlock: '4px', fontSize: '13.5px', color: '#E5E7EB' }} 
            dangerouslySetInnerHTML={{ __html: bulletText }}
          />
        );
      }
      
      return (
        <p 
          key={i} 
          style={{ marginBottom: '8px', minHeight: '1.2em', fontSize: '13.5px', color: '#E5E7EB', lineHeight: '1.5' }} 
          dangerouslySetInnerHTML={{ __html: line }}
        />
      );
    });
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.floatingBubble,
          animation: isOpen ? 'none' : 'chat-pulse 2s infinite ease-in-out'
        }}
        className="glass-panel"
        title="Toggle AI Co-Pilot Chatbot"
      >
        {isOpen ? (
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✕</span>
        ) : (
          <div style={styles.bubbleIconWrapper}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <span style={styles.bubbleNotificationDot} />
          </div>
        )}
      </button>

      {/* Expandable Chat Drawer Window */}
      {isOpen && (
        <div style={styles.chatDrawer} className="glass-panel animate-fade-in">
          {/* Header Panel */}
          <div style={styles.drawerHeader}>
            <div style={styles.headerInfo}>
              <div style={styles.onlineBadge}>AI</div>
              <div>
                <h4 style={styles.headerTitle}>FinGenius Co-Pilot</h4>
                <span style={styles.headerTagline}>UNDERWRITING COMPLIANCE AGENT</span>
              </div>
            </div>
            <div style={styles.headerControls}>
              <button 
                onClick={clearHistory}
                style={styles.clearBtn}
                title="Clear Chat Logs"
              >
                🧹
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                style={styles.closeBtn}
                title="Close chat drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Logs Body */}
          <div style={styles.messagesContainer}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={index} 
                  style={{
                    ...styles.messageRow,
                    justifyContent: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div 
                    style={{
                      ...styles.messageBubble,
                      ...(isUser ? styles.userBubble : styles.assistantBubble)
                    }}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* Dynamic Typing Indicator */}
            {loading && (
              <div style={styles.messageRow}>
                <div style={{ ...styles.messageBubble, ...styles.assistantBubble, display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 16px' }}>
                  <span style={styles.typingDot}>●</span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Click Recommendation Suggestions */}
          <div style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                style={styles.suggestionChip}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input control tray */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={styles.inputTray}
          >
            <input 
              type="text" 
              className="form-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about DTI rules, EMI formulas..."
              style={styles.chatInput}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={styles.sendBtn}
              disabled={loading || !inputText.trim()}
            >
              {loading ? '...' : '▶'}
            </button>
          </form>
        </div>
      )}

      {/* Self-contained styling sheet injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes chat-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 15px 4px rgba(6, 182, 212, 0.5); border-color: rgba(6, 182, 212, 0.4); }
        }
        @keyframes chat-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}} />
    </>
  );
};

/* --- Underwriter Co-Pilot UI Inline Styles --- */
const styles = {
  floatingBubble: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(14, 19, 34, 0.9)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    color: '#06B6D4',
    transition: 'all 0.3s ease'
  },
  bubbleIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bubbleNotificationDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#06B6D4',
    boxShadow: '0 0 8px #06B6D4'
  },
  chatDrawer: {
    position: 'fixed',
    bottom: '92px',
    right: '24px',
    width: '380px',
    height: '520px',
    borderRadius: '16px',
    backgroundColor: 'rgba(14, 19, 34, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9999
  },
  drawerHeader: {
    padding: '16px 20px',
    background: 'linear-gradient(90deg, rgba(14, 19, 34, 1) 0%, rgba(22, 30, 50, 0.8) 100%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left'
  },
  onlineBadge: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#030712',
    fontWeight: '800',
    fontSize: '11px',
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#F3F4F6',
    margin: 0
  },
  headerTagline: {
    fontSize: '8px',
    color: '#9CA3AF',
    letterSpacing: '0.08em',
    fontWeight: '700',
    display: 'block'
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    outline: 'none',
    ':hover': { opacity: 1 }
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#9CA3AF',
    padding: '4px',
    lineHeight: '1',
    transition: 'color 0.2s',
    outline: 'none',
    ':hover': { color: '#F3F4F6' }
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  messageRow: {
    display: 'flex',
    width: '100%'
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  userBubble: {
    backgroundColor: '#06B6D4',
    color: '#030712',
    borderRadius: '16px 16px 0 16px',
    border: 'none'
  },
  assistantBubble: {
    backgroundColor: '#161E32',
    color: '#E5E7EB',
    borderRadius: '16px 16px 16px 0',
    border: '1px solid rgba(255,255,255,0.04)'
  },
  typingDot: {
    display: 'inline-block',
    fontSize: '8px',
    color: '#06B6D4',
    animation: 'chat-bounce 1.4s infinite ease-in-out',
  },
  suggestionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '0 20px 12px 20px',
    justifyContent: 'flex-start'
  },
  suggestionChip: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderRadius: '9999px',
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    ':hover': {
      backgroundColor: 'rgba(6, 182, 212, 0.15)',
      borderColor: '#06B6D4'
    }
  },
  inputTray: {
    padding: '12px 20px 20px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    height: '38px',
    fontSize: '14px',
    backgroundColor: '#0E1322',
    padding: '8px 14px'
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    padding: 0,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
};

export default Chatbot;

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiMessageSquare, FiX } from 'react-icons/fi';
import {
  sendChatMessage,
  selectChatMessages,
  selectChatStatus,
} from '../Redux/slices/chatSlice.js';
import './ChatPanel.css';

export default function ChatPanel() {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  const chatStatus = useSelector(selectChatStatus);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function handleSend() {
    const text = input.trim();
    if (!text || chatStatus === 'loading') return;
    setInput('');
    dispatch(sendChatMessage(text));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-panel">
      <button
        className="chat-panel__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle AI chatbot"
      >
        {open ? <FiX size={18} /> : <FiMessageSquare size={18} />}
        <span>{open ? 'Close Chat' : 'AI Assistant'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel__window"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
          <div className="chat-panel__header">
            <FiMessageSquare size={16} />
            <span>AI Field Assistant</span>
          </div>

          <div className="chat-panel__messages">
            {messages.length === 0 && (
              <div className="chat-panel__welcome">
                Ask me about flagged properties, ward statistics, or next steps.
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-panel__bubble chat-panel__bubble--${msg.role}`}
              >
                {msg.role === 'assistant' ? (
                  <div className="chat-panel__markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            ))}
            {chatStatus === 'loading' && (
              <div className="chat-panel__bubble chat-panel__bubble--assistant">
                <div className="chat-panel__typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-panel__input-row">
            <textarea
              className="chat-panel__input"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={chatStatus === 'loading'}
            />
            <button
              className="chat-panel__send"
              onClick={handleSend}
              disabled={!input.trim() || chatStatus === 'loading'}
              aria-label="Send"
            >
              <FiSend size={16} />
            </button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

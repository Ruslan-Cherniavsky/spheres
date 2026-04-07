import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n/useTranslation';

export default function ChatOverlay() {
  const contactState = useWorldStore((s) => s.contactState);
  const chatMessages = useWorldStore((s) => s.chatMessages);
  const chatMessageCount = useWorldStore((s) => s.chatMessageCount);
  const sendChatMessage = useWorldStore((s) => s.sendChatMessage);
  const endChat = useWorldStore((s) => s.endChat);
  const reportUser = useWorldStore((s) => s.reportUser);
  const isPartnerTyping = useWorldStore((s) => s.isPartnerTyping);
  const emitTypingStart = useWorldStore((s) => s.emitTypingStart);
  const emitTypingStop = useWorldStore((s) => s.emitTypingStop);
  const language = useUserStore((s) => s.language);
  const t = useTranslation();

  const [input, setInput] = useState('');
  const [reported, setReported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, isPartnerTyping]);

  useEffect(() => {
    if (contactState === 'chatting') {
      setReported(false);
      setMenuOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [contactState]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [menuOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTypingRef.current && e.target.value.length > 0) {
      isTypingRef.current = true;
      emitTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop();
      }
    }, 2000);
  }, [emitTypingStart, emitTypingStop]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitTypingStop();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendChatMessage(input);
    setInput('');
    inputRef.current?.focus();
  }, [input, sendChatMessage, emitTypingStop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleReport = useCallback(() => {
    if (reported) return;
    reportUser();
    setReported(true);
    setMenuOpen(false);
  }, [reported, reportUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
      }
    };
  }, []);

  if (contactState !== 'chatting') return null;


  return (
    <div className="chat-overlay">
      <div className="chat-panel">
        <div className="chat-header">
          <button
            className="chat-end-btn"
            onClick={endChat}
          >
            {t.chat.endChat}
          </button>

          <div className="chat-menu-wrap" ref={menuRef}>
            <button
              className="chat-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              title="More"
            >
              ···
            </button>
            {menuOpen && (
              <div className="chat-dropdown">
                <button
                  className={`chat-dropdown-item ${reported ? 'reported' : 'danger'}`}
                  onClick={handleReport}
                  disabled={reported}
                >
                  {reported ? t.chat.reported : t.chat.report}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.isOwn ? 'own' : 'other'}`}
            >
              <span className="chat-text">{msg.text}</span>
            </div>
          ))}
          {isPartnerTyping && (
            <div className="chat-bubble other typing-indicator">
              <span className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            maxLength={500}
            autoComplete="off"
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            {t.chat.send}
          </button>
        </div>
      </div>
    </div>
  );
}

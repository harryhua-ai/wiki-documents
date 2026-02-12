import React, { useState, useRef, useEffect, KeyboardEvent, TouchEvent } from 'react';
import { translate } from '@docusaurus/Translate';
import MessageList from './MessageList';
import SuggestionList from './SuggestionList';
import type { ToolCall } from '../../hooks/useChat';
import styles from '../../css/AskAI.module.css';

interface ChatWindowProps {
  isOpen: boolean;
  isLoading: boolean;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{
      title: string;
      section?: string;
      url: string;
    }>;
    timestamp: number;
    feedback?: 'up' | 'down' | null;
  }>;
  streamingContent: string;
  routingPath: 'fast' | 'agent' | 'agent_tools' | null;
  agentStep: string | null;
  toolCalls?: ToolCall[];
  suggestions?: string[];
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onFeedback: (messageId: string, rating: 'up' | 'down', comment?: string) => void;
  onReset: () => void;
  onExport?: (format: 'markdown' | 'json' | 'txt') => void;
  onOverlayClick?: (e: React.MouseEvent) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  isLoading,
  messages,
  streamingContent,
  routingPath,
  agentStep,
  toolCalls,
  suggestions = [],
  onClose,
  onSendMessage,
  onFeedback,
  onReset,
  onExport,
  onOverlayClick,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Touch handling for swipe-to-close
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure render is complete and for mobile keyboard handling
      setTimeout(() => {
        // On mobile, we might not want to auto-focus to avoid keyboard popping up immediately
        // covering the chat content. Only focus on desktop.
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
          textareaRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  // Touch handlers for mobile swipe-to-close
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    setTouchCurrent(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart !== null && touchCurrent !== null) {
      const diff = touchCurrent - touchStart;
      // If dragged down more than 100px, close
      if (diff > 100) {
        onClose();
      }
    }
    setTouchStart(null);
    setTouchCurrent(null);
    setIsDragging(false);
  };

  const hasMessages = messages.length > 0;

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Calculate transform style for dragging effect
  const dragStyle = (isDragging && touchStart !== null && touchCurrent !== null && touchCurrent > touchStart)
    ? { transform: `translateY(${touchCurrent - touchStart}px)`, transition: 'none' }
    : {};

  return (
    <div
      id="ask-ai-chat-window"
      className={`${styles.chatWindow} ${isOpen ? styles.chatWindowOpen : ''} ${isExpanded ? styles.chatWindowExpanded : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Chat"
      onClick={onOverlayClick}
      style={dragStyle}
    >
      {/* Mobile Drag Handle */}
      <div
        className={styles.mobileDragHandle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.dragHandleBar} />
      </div>

      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <img src="/img/icon.jpeg" alt="CamThink" className={styles.chatHeaderLogo} />
          <h3 className={styles.chatTitle}>{translate({message: 'Ask CamThink AI', id: 'askai.title'})}</h3>
        </div>
        <div className={styles.chatHeaderActions}>
          <button
            className={isExpanded ? styles.restoreButton : styles.maximizeButton}
            onClick={toggleExpand}
            aria-label={isExpanded ? "Restore" : "Expand"}
            type="button"
            title={isExpanded ? "Restore" : "Expand"}
          >
            {isExpanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="14" height="14" rx="2" />
                <path d="M15 15l5 5M15 20l5-5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close chat"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        streamingContent={streamingContent}
        routingPath={routingPath}
        agentStep={agentStep}
        toolCalls={toolCalls}
        onFeedback={onFeedback}
      />

      {/* Suggestions - show when no messages OR when dynamic suggestions exist */}
      {(!hasMessages || (suggestions && suggestions.length > 0)) && (
        <SuggestionList
          suggestions={suggestions && suggestions.length > 0 ? suggestions : undefined}
          onSelectSuggestion={handleSuggestionClick}
          isLoading={isLoading}
        />
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.chatInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? ''
                : translate({message: 'Ask a question about CamThink products...', id: 'askai.input.placeholder'})
            }
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`${styles.sendButton} ${!inputValue.trim() || isLoading ? styles.sendButtonDisabled : ''}`}
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            type="button"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className={styles.spinner}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

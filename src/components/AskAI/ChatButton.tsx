import React from 'react';
import styles from '../../css/AskAI.module.css';

export interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * ChatButton - Floating action button for toggling chat
 */
export default function ChatButton({ isOpen, onClick, className }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.chatButton} ${isOpen ? styles.chatButtonOpen : ''} ${className || ''}`}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
      aria-controls="ask-ai-chat-window"
      type="button"
    >
      {isOpen ? (
        // Close icon (X)
        <svg
          width="24"
          height="24"
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
      ) : (
        // Chat/message icon
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}

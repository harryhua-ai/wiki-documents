import React, { useEffect, useRef } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { useChat } from '../../hooks/useChat';
import styles from '../../css/AskAI.module.css';

export interface ChatWidgetProps {
  apiBaseUrl?: string;
}

/**
 * ChatWidget - Main container for the Ask AI feature
 * Floating chat widget that persists across Docusaurus page navigation
 */
export default function ChatWidget({ apiBaseUrl }: ChatWidgetProps) {
  const {
    isOpen,
    isLoading,
    messages,
    streamingContent,
    routingPath,
    agentStep,
    toolCalls,
    suggestions,
    toggleChat,
    closeChat,
    sendMessage,
    submitFeedback,
    resetSession,
    exportChat,
  } = useChat();

  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeChat]);

  return (
    <div className={styles.chatWidget}>
      <ChatButton
        isOpen={isOpen}
        onClick={toggleChat}
      />

      {isOpen && (
        <div className={styles.chatOverlay} onClick={closeChat}>
          <ChatWindow
            isOpen={isOpen}
            messages={messages}
            streamingContent={streamingContent}
            isLoading={isLoading}
            routingPath={routingPath}
            agentStep={agentStep}
            toolCalls={toolCalls}
            suggestions={suggestions}
            onClose={closeChat}
            onSendMessage={sendMessage}
            onFeedback={submitFeedback}
            onReset={resetSession}
            onExport={exportChat}
            onOverlayClick={(e: React.MouseEvent) => {
              // Prevent overlay click from closing when clicking inside the chat window
              e.stopPropagation();
            }}
          />
        </div>
      )}
    </div>
  );
}

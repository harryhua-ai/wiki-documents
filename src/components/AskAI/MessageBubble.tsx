import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import SourceReference from './SourceReference';
import FeedbackModal from './FeedbackModal';
import type { Message } from '../../hooks/useChat';
import styles from '../../css/AskAI.module.css';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onFeedback?: (messageId: string, rating: 'up' | 'down', comment?: string) => void;
}

const FeedbackButtons: React.FC<{
  feedback?: 'up' | 'down' | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
}> = ({ feedback, onThumbsUp, onThumbsDown }) => (
  <div className={styles.feedbackButtons}>
    <button
      className={`${styles.feedbackButton} ${feedback === 'up' ? styles.feedbackActive : ''}`}
      onClick={onThumbsUp}
      aria-label="Helpful"
      title="Helpful"
      type="button"
    >
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
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    </button>
    <button
      className={`${styles.feedbackButton} ${feedback === 'down' ? styles.feedbackActive : ''}`}
      onClick={onThumbsDown}
      aria-label="Not helpful"
      title="Not helpful"
      type="button"
    >
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
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
      </svg>
    </button>
  </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onFeedback,
}) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const isUser = message.role === 'user';

  const handleThumbsUp = () => {
    if (onFeedback) {
      onFeedback(message.id, 'up');
    }
  };

  const handleThumbsDown = () => {
    setShowFeedbackModal(true);
  };

  const handleModalSubmit = (reason: string, comment: string) => {
    if (onFeedback) {
      onFeedback(message.id, 'down', comment);
    }
    setShowFeedbackModal(false);
  };

  return (
    <div
      className={`${styles.messageBubble} ${isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant}`}
    >
      <div className={styles.messageContent}>
        {!isUser && (
          <div className={styles.avatar}>
            <img src="/img/icon.jpeg" alt="CamThink AI" className={styles.avatarImg} />
          </div>
        )}
        <div className={styles.messageText}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className={styles.streamingCursor}>|</span>
              )}
            </>
          )}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourceReference sources={message.sources} />
          )}
        </div>
      </div>
      {!isUser && !isStreaming && onFeedback && (
        <div className={styles.messageActions}>
          <FeedbackButtons
            feedback={message.feedback}
            onThumbsUp={handleThumbsUp}
            onThumbsDown={handleThumbsDown}
          />
        </div>
      )}

      {!isUser && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default MessageBubble;

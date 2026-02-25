import React, { useEffect, useRef } from 'react';
import { translate } from '@docusaurus/Translate';
import MessageBubble from './MessageBubble';
import type { Message, RoutingPath, ToolCall } from '../../hooks/useChat';
import styles from '../../css/AskAI.module.css';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  routingPath: RoutingPath;
  agentStep: string | null;
  toolCalls?: ToolCall[];
  onFeedback?: (messageId: string, rating: 'up' | 'down') => void;
}

const WelcomeMessage: React.FC = () => {
  return (
    <div className={styles.welcomeMessage}>
      <div className={styles.welcomeIcon}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
          <path d="M9 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2z" />
        </svg>
      </div>
      <h3 className={styles.welcomeTitle}>
        {translate({message: 'Welcome to CamThink AI', id: 'askai.welcome.title'})}
      </h3>
      <p className={styles.welcomeText}>
        {translate({message: 'Ask me anything about CamThink products, documentation, or development guides.', id: 'askai.welcome.description'})}
      </p>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className={styles.typingIndicator}>
    <span className={styles.typingDot} />
    <span className={styles.typingDot} />
    <span className={styles.typingDot} />
  </div>
);

const AgentProgress: React.FC<{
  routingPath: RoutingPath;
  agentStep: string | null;
  toolCalls?: ToolCall[];
}> = ({ routingPath, agentStep, toolCalls }) => {
  // Only show progress indicator for agent path or when there are tool calls
  if (routingPath !== 'agent' && routingPath !== 'agent_tools' && !agentStep && !toolCalls?.length) return null;

  const getToolIcon = (toolName: string): React.ReactNode => {
    if (toolName === 'get_product_info' || toolName === 'check_stock') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="3" r="1" />
          <circle cx="15" cy="21" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="3" r="1" />
        </svg>
      );
    }
    if (toolName === 'search_code' || toolName === 'get_repo_info') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 18l6-6-6-6" />
          <path d="M8 6l-6 6 6 6" />
        </svg>
      );
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    );
  };

  const getToolName = (toolName: string): string => {
    const names: Record<string, { en: string; zh: string }> = {
      get_product_info: { en: 'Product Info', zh: '产品信息' },
      check_stock: { en: 'Stock Status', zh: '库存状态' },
      search_code: { en: 'Code Examples', zh: '代码示例' },
      get_repo_info: { en: 'Repository Info', zh: '仓库信息' },
    };
    return names[toolName]?.en || toolName;
  };

  return (
    <div className={styles.agentProgress}>
      <div className={styles.progressIndicator}>
        <span className={styles.progressIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </span>
        <span className={styles.progressText}>
          {agentStep || 'Thinking...'}
        </span>
      </div>
      {toolCalls && toolCalls.length > 0 && (
        <div className={styles.toolCallsList}>
          {toolCalls.map((tool, index) => (
            <div
              key={`${tool.tool}-${index}`}
              className={`${styles.toolCallItem} ${
                tool.status === 'running' ? styles.toolCallRunning :
                tool.status === 'completed' ? styles.toolCallCompleted :
                tool.status === 'failed' ? styles.toolCallFailed : ''
              }`}
            >
              <span className={styles.toolCallIcon}>{getToolIcon(tool.tool)}</span>
              <span className={styles.toolCallName}>{getToolName(tool.tool)}</span>
              <span className={styles.toolCallStatus}>
                {tool.status === 'running' && (
                  <span className={styles.spinner} />
                )}
                {tool.status === 'completed' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {tool.status === 'failed' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  streamingContent,
  routingPath,
  agentStep,
  toolCalls,
  onFeedback,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, agentStep, toolCalls]);

  const hasMessages = messages.length > 0;

  return (
    <div ref={scrollContainerRef} className={styles.messageList}>
      {!hasMessages ? (
        <WelcomeMessage />
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={false}
            onFeedback={onFeedback}
          />
        ))
      )}
      {isLoading && !hasMessages && (
        <div className={styles.messageBubble}>
          <div className={styles.messageContent}>
            <div className={styles.avatar}>
              <img src="/img/icon.jpeg" alt="CamThink AI" className={styles.avatarImg} />
            </div>
            <TypingIndicator />
          </div>
        </div>
      )}
      {/* AgentProgress 已移除 - 不再显示内部处理细节 */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

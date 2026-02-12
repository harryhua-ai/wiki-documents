import React, { useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import type { MessageSource } from '../../hooks/useChat';
import styles from '../../css/AskAI.module.css';

interface SourceReferenceProps {
  sources: MessageSource[];
}

export const SourceReference: React.FC<SourceReferenceProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  const handleClick = (url: string) => {
    // Open in new tab
    if (ExecutionEnvironment.canUseDOM) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSourceClick = (e: React.MouseEvent<HTMLDivElement>, source: MessageSource) => {
    if (source.url) {
      e.preventDefault();
      handleClick(source.url);
    }
  };

  return (
    <details
      className={`${styles.sourceReference} ${isOpen ? styles.sourceReferenceOpen : ''}`}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className={styles.sourceSummary}>
        Sources
        <span className={styles.sourceCount}>({sources.length})</span>
      </summary>
      <div className={styles.sourceList}>
        {sources.map((source, index) => (
          <div
            key={index}
            className={`${styles.sourceItem} ${source.url ? styles.sourceItemClickable : ''}`}
            onClick={(e) => handleSourceClick(e, source)}
            role={source.url ? 'button' : undefined}
            tabIndex={source.url ? 0 : undefined}
            onKeyDown={(e) => {
              if (source.url && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleClick(source.url);
              }
            }}
          >
            <div className={styles.sourceInfo}>
              <span className={styles.sourceIndex}>{index + 1}.</span>
              <div className={styles.sourceDetails}>
                <span className={styles.sourceTitle}>{source.title}</span>
                {source.section && (
                  <span className={styles.sourceSection}>{source.section}</span>
                )}
                {source.url && (
                  <span className={styles.sourceLinkHint}>→</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default SourceReference;

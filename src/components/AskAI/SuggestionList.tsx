import React from 'react';
import styles from '../../css/AskAI.module.css';

interface SuggestionListProps {
  suggestions?: string[];
  onSelectSuggestion: (suggestion: string) => void;
  isLoading: boolean;
}

const DEFAULT_SUGGESTIONS = [
  {
    id: 'askai.suggestion.quickstart',
    defaultMessage: 'How do I get started with NeoEdge?',
  },
  {
    id: 'askai.suggestion.features',
    defaultMessage: 'What are the key features of NeoEyes?',
  },
  {
    id: 'askai.suggestion.deployment',
    defaultMessage: 'How do I deploy AI models to the device?',
  },
  {
    id: 'askai.suggestion.troubleshooting',
    defaultMessage: 'Common issues and troubleshooting tips',
  },
];

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions = DEFAULT_SUGGESTIONS.map((s) => s.defaultMessage),
  onSelectSuggestion,
  isLoading,
}) => {
  if (isLoading) return null;

  return (
    <div className={styles.suggestionList}>
      <div className={styles.suggestionScroll}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={styles.suggestionButton}
            onClick={() => onSelectSuggestion(suggestion)}
            type="button"
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionList;

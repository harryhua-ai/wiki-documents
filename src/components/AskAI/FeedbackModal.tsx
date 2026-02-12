import React, { useState } from 'react';
import { translate } from '@docusaurus/Translate';
import styles from '../../css/AskAI.module.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, comment: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  if (!isOpen) return null;

  const reasons = [
    { id: 'inaccurate', label: translate({ message: 'Inaccurate Information', id: 'feedback.reason.inaccurate' }) },
    { id: 'incomplete', label: translate({ message: 'Incomplete Answer', id: 'feedback.reason.incomplete' }) },
    { id: 'outdated', label: translate({ message: 'Outdated Content', id: 'feedback.reason.outdated' }) },
    { id: 'code_error', label: translate({ message: 'Code Not Working', id: 'feedback.reason.code_error' }) },
    { id: 'other', label: translate({ message: 'Other', id: 'feedback.reason.other' }) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combine reason and comment
    const fullComment = `[Reason: ${selectedReason}] ${comment}`.trim();
    onSubmit(selectedReason, fullComment);
    // Reset state
    setSelectedReason('');
    setComment('');
  };

  return (
    <div className={styles.feedbackModalOverlay} onClick={onClose}>
      <div className={styles.feedbackModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.feedbackModalHeader}>
          <h3>{translate({ message: 'Provide Feedback', id: 'feedback.modal.title' })}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.feedbackReasons}>
            <p className={styles.feedbackLabel}>
              {translate({ message: 'What was the issue?', id: 'feedback.modal.reason_label' })}
            </p>
            <div className={styles.reasonChips}>
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  className={`${styles.reasonChip} ${selectedReason === reason.id ? styles.reasonChipSelected : ''}`}
                  onClick={() => setSelectedReason(reason.id)}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.feedbackComment}>
            <label htmlFor="feedback-comment" className={styles.feedbackLabel}>
              {translate({ message: 'Additional details (optional)', id: 'feedback.modal.comment_label' })}
            </label>
            <textarea
              id="feedback-comment"
              className={styles.feedbackTextarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={translate({ message: 'Please provide more details...', id: 'feedback.modal.placeholder' })}
              rows={4}
            />
          </div>

          <div className={styles.feedbackActions}>
            <button type="button" className={styles.feedbackCancelBtn} onClick={onClose}>
              {translate({ message: 'Cancel', id: 'feedback.modal.cancel' })}
            </button>
            <button
              type="submit"
              className={styles.feedbackSubmitBtn}
              disabled={!selectedReason}
            >
              {translate({ message: 'Submit Feedback', id: 'feedback.modal.submit' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;

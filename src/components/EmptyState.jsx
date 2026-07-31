import React from 'react';
import './EmptyState.css';

export default function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state__icon" />}
      <p className="empty-state__message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

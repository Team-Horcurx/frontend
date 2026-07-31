import React from 'react';
import './Loader.css';

export default function Loader({ size = 'md', label = 'Loading' }) {
  return (
    <span className={`loader loader--${size}`} role="status" aria-label={label}>
      <span className="loader__dot" />
      <span className="loader__dot" />
      <span className="loader__dot" />
    </span>
  );
}

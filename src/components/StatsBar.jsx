import React from 'react';
import { useSelector } from 'react-redux';
import { selectWardStats, selectStatsStatus } from '../Redux/slices/statsSlice.js';
import './StatsBar.css';

const STATS_CONFIG = [
  { key: 'totalDetections', label: 'Total Detections', accent: 'var(--color-primary)' },
  { key: 'newBuilds', label: 'New Builds', accent: 'var(--color-danger)' },
  { key: 'changeOfUse', label: 'Change of Use', accent: 'var(--color-warning)' },
  { key: 'pendingVerification', label: 'Pending Verification', accent: 'var(--color-info)' },
];

export default function StatsBar({ variant = 'card' }) {
  const stats = useSelector(selectWardStats);
  const status = useSelector(selectStatsStatus);

  if (variant === 'badge') {
    return (
      <div className="stats-bar stats-bar--badges">
        {STATS_CONFIG.map(({ key, label, accent }, i) => (
          <div
            key={key}
            className="stats-bar__badge"
            style={{ '--accent': accent, '--row-index': i }}
          >
            <span className="stats-bar__dot" />
            <span className="stats-bar__badge-label">{label}</span>
            <span className="stats-bar__badge-value">
              {status === 'loading' ? (
                <span className="skeleton-bar stats-bar__badge-skeleton" aria-hidden="true" />
              ) : !stats ? '—' : (stats[key] ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-bar">
      {STATS_CONFIG.map(({ key, label, accent }, i) => (
        <div
          key={key}
          className="stats-bar__card"
          style={{ '--accent': accent, '--row-index': i }}
        >
          <div className="stats-bar__value">
            {status === 'loading' ? (
              <span className="skeleton-bar stats-bar__skeleton" aria-hidden="true" />
            ) : !stats ? '—' : (stats[key] ?? 0).toLocaleString()}
          </div>
          <div className="stats-bar__label">
            <span className="stats-bar__dot" />
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

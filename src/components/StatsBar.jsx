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

export default function StatsBar() {
  const stats = useSelector(selectWardStats);
  const status = useSelector(selectStatsStatus);

  return (
    <div className="stats-bar">
      {STATS_CONFIG.map(({ key, label, accent }) => (
        <div key={key} className="stats-bar__card" style={{ borderLeftColor: accent }}>
          <div className="stats-bar__value">
            {status === 'loading' ? (
              <span className="skeleton-bar stats-bar__skeleton" aria-hidden="true" />
            ) : !stats ? '—' : (stats[key] ?? 0).toLocaleString()}
          </div>
          <div className="stats-bar__label">{label}</div>
        </div>
      ))}
    </div>
  );
}

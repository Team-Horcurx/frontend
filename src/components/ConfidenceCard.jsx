import React from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  selectSelectedProperty,
  selectFetchOneStatus,
} from '../Redux/slices/propertiesSlice.js';
import './ConfidenceCard.css';

const SIGNALS = [
  { key: 'ndbi_delta', label: 'NDBI Delta' },
  { key: 'area_delta', label: 'Area Expansion' },
  { key: 'osm_status', label: 'OSM Status' },
  { key: 'ndvi_drop', label: 'Vegetation Drop' },
  { key: 'db_match', label: 'DB Match' },
];

function signalColor(value) {
  if (value >= 0.7) return 'var(--color-success)';
  if (value >= 0.4) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function ConfidenceCard() {
  const property = useSelector(selectSelectedProperty);
  const fetchOneStatus = useSelector(selectFetchOneStatus);

  if (!property) return null;

  const breakdown = property.confidenceBreakdown ?? {};
  const confidence = property.confidence ?? 0;

  return (
    <div className="confidence-card">
      <div className="confidence-card__header">
        <div className="confidence-card__score-wrapper">
          <span className="confidence-card__score-label">Confidence</span>
          <span
            className="confidence-card__score"
            style={{ color: signalColor(confidence) }}
          >
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="confidence-card__meta">
          <span
            className="status-badge"
            style={{
              background: property.detectionType === 'new_build'
                ? 'var(--status-danger-bg)' : 'var(--status-orange-bg)',
              color: property.detectionType === 'new_build'
                ? 'var(--status-danger-text)' : 'var(--status-orange-text)',
            }}
          >
            {property.detectionType === 'new_build' ? 'New Build' : 'Change of Use'}
          </span>
          <span className="confidence-card__area">{property.areaSqm?.toLocaleString()} m²</span>
        </div>
      </div>

      <div className="confidence-card__signals">
        {SIGNALS.map(({ key, label }) => {
          const val = breakdown[key] ?? 0;
          return (
            <div key={key} className="confidence-card__signal">
              <div className="confidence-card__signal-header">
                <span className="confidence-card__signal-label">{label}</span>
                <span className="confidence-card__signal-pct">
                  {Math.round(val * 100)}%
                </span>
              </div>
              <div className="confidence-card__signal-bar-bg">
                <div
                  className="confidence-card__signal-bar"
                  style={{
                    width: `${Math.round(val * 100)}%`,
                    background: signalColor(val),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {fetchOneStatus === 'loading' && (
        <div className="confidence-card__ai-loading">
          <div className="map-view__spinner" style={{ width: 20, height: 20 }} />
          <span>Loading AI explanation…</span>
        </div>
      )}
      {property.aiExplanation && (
        <div className="confidence-card__ai-text">
          <div className="confidence-card__ai-label">AI Analysis</div>
          <div className="confidence-card__ai-markdown">
            <ReactMarkdown>{property.aiExplanation}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

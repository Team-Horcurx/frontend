import React, { useState } from 'react';
import { COMPARISON_PROPERTIES } from '../mockData/comparisonData.js';
import './ComparisonTable.css';

const CHANGE_TYPE_LABELS = { new_build: 'New Build', change_of_use: 'Change of Use' };
const STATUS_CLASSES = {
  pending: 'secondary',
  verified: 'success',
  underassessed: 'warning',
  false_positive: 'danger',
  already_assessed: 'info',
};
const REPORT_STATUS_LABELS = { not_generated: 'Not generated', generated: 'Generated' };

export default function ComparisonTable() {
  const [expandedId, setExpandedId] = useState(null);
  const [reportRequested, setReportRequested] = useState(false);

  function toggleRow(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function handleGenerateReport() {
    // Placeholder only — no backend/PDF integration yet.
    setReportRequested(true);
    setTimeout(() => setReportRequested(false), 2500);
  }

  return (
    <div className="comparison-table">
      <div className="comparison-table__header">
        <span className="comparison-table__heading">Property Comparison</span>
        <span className="property-list__count">{COMPARISON_PROPERTIES.length} properties</span>
      </div>

      <div className="comparison-table__scroll">
        <table className="property-list__table">
          <thead>
            <tr>
              <th className="property-list__th">Property ID</th>
              <th className="property-list__th">Change Type</th>
              <th className="property-list__th property-list__th--right">Area Δ (m²)</th>
              <th className="property-list__th property-list__th--right">NDBI Δ</th>
              <th className="property-list__th property-list__th--right">Estimated Tax (₹)</th>
              <th className="property-list__th property-list__th--right">Confidence</th>
              <th className="property-list__th">Status</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_PROPERTIES.map((p) => (
              <React.Fragment key={p.id}>
                <tr
                  className={`property-list__row ${expandedId === p.id ? 'property-list__row--selected' : ''}`}
                  onClick={() => toggleRow(p.id)}
                >
                  <td className="property-list__td property-list__td--id">{p.id}</td>
                  <td className="property-list__td">
                    <span
                      className="status-badge"
                      style={{
                        background: p.changeType === 'new_build' ? 'var(--status-danger-bg)' : 'var(--status-orange-bg)',
                        color: p.changeType === 'new_build' ? 'var(--status-danger-text)' : 'var(--status-orange-text)',
                      }}
                    >
                      {CHANGE_TYPE_LABELS[p.changeType] ?? p.changeType}
                    </span>
                  </td>
                  <td className="property-list__td property-list__td--right">+{p.areaDeltaSqm.toLocaleString()}</td>
                  <td className="property-list__td property-list__td--right">+{p.ndbiDelta.toFixed(2)}</td>
                  <td className="property-list__td property-list__td--right">₹{p.estimatedTaxInr.toLocaleString()}</td>
                  <td className="property-list__td property-list__td--right">{Math.round(p.confidence * 100)}%</td>
                  <td className="property-list__td">
                    <span
                      className="status-badge"
                      style={{
                        background: `var(--status-${STATUS_CLASSES[p.status] ?? 'secondary'}-bg)`,
                        color: `var(--status-${STATUS_CLASSES[p.status] ?? 'secondary'}-text)`,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr className="comparison-table__detail-row">
                    <td colSpan={7}>
                      <div className="comparison-table__detail">
                        <div className="comparison-table__detail-block">
                          <span className="comparison-table__detail-label">Historical Timeline</span>
                          <div className="comparison-table__timeline">
                            {p.timeline.map((t, i) => (
                              <React.Fragment key={t.year}>
                                <div className="comparison-table__timeline-step">
                                  <span className="comparison-table__timeline-year">{t.year}</span>
                                  <span className="comparison-table__timeline-note">{t.note}</span>
                                </div>
                                {i < p.timeline.length - 1 && (
                                  <span className="comparison-table__timeline-arrow">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="comparison-table__detail-grid">
                          <div>
                            <span className="comparison-table__detail-label">NDBI Change</span>
                            <p className="comparison-table__detail-value">+{p.ndbiDelta.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="comparison-table__detail-label">Area Difference</span>
                            <p className="comparison-table__detail-value">+{p.areaDeltaSqm.toLocaleString()} m²</p>
                          </div>
                          <div>
                            <span className="comparison-table__detail-label">Estimated Tax Impact</span>
                            <p className="comparison-table__detail-value">₹{p.estimatedTaxInr.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="comparison-table__detail-label">Report Status</span>
                            <p className="comparison-table__detail-value">{REPORT_STATUS_LABELS[p.reportStatus]}</p>
                          </div>
                        </div>

                        <div>
                          <span className="comparison-table__detail-label">Officer Notes</span>
                          <p className="comparison-table__detail-value comparison-table__detail-notes">
                            {p.officerNotes || 'No notes yet.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-table__actions">
        <button type="button" className="comparison-table__report-btn" onClick={handleGenerateReport}>
          Generate Comparison Report
        </button>
        {reportRequested && (
          <span className="comparison-table__report-note">Report queued — placeholder action.</span>
        )}
      </div>
    </div>
  );
}

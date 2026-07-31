import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { FiBellOff } from 'react-icons/fi';
import {
  fetchAlerts,
  generateWardAlert,
  resetGenerateStatus,
  selectAlerts,
  selectAlertsStatus,
  selectGenerateStatus,
  selectGenerateError,
  selectLastGenerated,
} from '../Redux/slices/alertsSlice.js';
import { selectSelectedWardId } from '../Redux/slices/wardsSlice.js';
import EmptyState from './EmptyState.jsx';
import './AlertPanel.css';

dayjs.extend(relativeTime);

const SEVERITY_CLASS = {
  info: 'info', warning: 'warning', danger: 'danger',
  LOW: 'info', MEDIUM: 'warning', HIGH: 'danger',
};

export default function AlertPanel() {
  const dispatch = useDispatch();
  const wardId = useSelector(selectSelectedWardId);
  const alerts = useSelector(selectAlerts);
  const status = useSelector(selectAlertsStatus);
  const generateStatus = useSelector(selectGenerateStatus);
  const generateError = useSelector(selectGenerateError);
  const lastGenerated = useSelector(selectLastGenerated);

  useEffect(() => {
    dispatch(resetGenerateStatus());
    if (wardId) dispatch(fetchAlerts(wardId));
  }, [wardId, dispatch]);

  if (!wardId) return null;

  return (
    <div className="alert-panel">
      <div className="alert-panel__header">
        <span className="alert-panel__title">AI Alerts</span>
        <div className="alert-panel__header-right">
          <span className="alert-panel__count">{alerts.length}</span>
          <button
            className="alert-panel__generate-btn"
            onClick={() => dispatch(generateWardAlert(wardId))}
            disabled={generateStatus === 'loading' || !wardId}
          >
            {generateStatus === 'loading' ? 'Generating…' : '+ Generate'}
          </button>
        </div>
      </div>
      {generateStatus === 'succeeded' && lastGenerated && (
        <div
          className="alert-panel__generate-feedback"
          style={{
            background: `var(--status-${SEVERITY_CLASS[lastGenerated.alert.severity] ?? 'info'}-bg)`,
            color: `var(--status-${SEVERITY_CLASS[lastGenerated.alert.severity] ?? 'info'}-text)`,
          }}
        >
          <span className="alert-panel__generate-severity">{lastGenerated.alert.severity}</span>
          <span className="alert-panel__generate-text">{lastGenerated.alert.text}</span>
        </div>
      )}
      {generateStatus === 'failed' && generateError && (
        <div className="alert-panel__generate-error">{generateError}</div>
      )}
      <div className="alert-panel__scroll">
        {status === 'loading' && [0, 1, 2].map((i) => (
          <div key={`skeleton-${i}`} className="alert-panel__card alert-panel__card--skeleton" aria-hidden="true">
            <span className="skeleton-bar alert-panel__skeleton-badge" />
            <span className="skeleton-bar alert-panel__skeleton-line" />
            <span className="skeleton-bar alert-panel__skeleton-line alert-panel__skeleton-line--short" />
          </div>
        ))}
        {status !== 'loading' && alerts.length === 0 && (
          <EmptyState icon={FiBellOff} message="No alerts for this ward." />
        )}
        {alerts.map((alert, i) => {
          const cls = SEVERITY_CLASS[alert.severity] ?? 'info';
          return (
            <div key={alert.id} className="alert-panel__card" style={{ '--row-index': i }}>
              <div className="alert-panel__card-header">
                <span
                  className="status-badge"
                  style={{
                    background: `var(--status-${cls}-bg)`,
                    color: `var(--status-${cls}-text)`,
                  }}
                >
                  {alert.severity}
                </span>
                {alert.createdAt && (
                  <span className="alert-panel__time">
                    {dayjs(alert.createdAt).fromNow()}
                  </span>
                )}
              </div>
              <p className="alert-panel__text">{alert.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

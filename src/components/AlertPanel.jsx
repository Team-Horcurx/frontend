import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { FiBellOff } from 'react-icons/fi';
import {
  fetchAlerts,
  selectAlerts,
  selectAlertsStatus,
} from '../Redux/slices/alertsSlice.js';
import { selectSelectedWardId } from '../Redux/slices/wardsSlice.js';
import EmptyState from './EmptyState.jsx';
import './AlertPanel.css';

dayjs.extend(relativeTime);

const SEVERITY_CLASS = { info: 'info', warning: 'warning', danger: 'danger' };

export default function AlertPanel() {
  const dispatch = useDispatch();
  const wardId = useSelector(selectSelectedWardId);
  const alerts = useSelector(selectAlerts);
  const status = useSelector(selectAlertsStatus);

  useEffect(() => {
    if (wardId) dispatch(fetchAlerts(wardId));
  }, [wardId, dispatch]);

  if (!wardId) return null;

  return (
    <div className="alert-panel">
      <div className="alert-panel__header">
        <span className="alert-panel__title">AI Alerts</span>
        <span className="alert-panel__count">{alerts.length}</span>
      </div>
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
        {alerts.map((alert) => {
          const cls = SEVERITY_CLASS[alert.severity] ?? 'info';
          return (
            <div key={alert.id} className="alert-panel__card">
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

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { FiBarChart2 } from 'react-icons/fi';
import {
  fetchAllWardsStats,
  fetchCommissionerBrief,
  selectAllWardsStats,
  selectAllWardsStatus,
  selectAiBrief,
  selectBriefStatus,
  selectBriefError,
} from '../Redux/slices/statsSlice.js';
import MapView from '../components/MapView.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageMotion from '../components/PageMotion.jsx';
import './CommissionerView.css';

export default function CommissionerView() {
  const dispatch = useDispatch();
  const allWardsStats = useSelector(selectAllWardsStats);
  const allWardsStatus = useSelector(selectAllWardsStatus);
  const aiBrief = useSelector(selectAiBrief);
  const briefStatus = useSelector(selectBriefStatus);
  const briefError = useSelector(selectBriefError);

  useEffect(() => {
    if (allWardsStatus === 'idle') dispatch(fetchAllWardsStats());
    if (briefStatus === 'idle') dispatch(fetchCommissionerBrief());
  }, [allWardsStatus, briefStatus, dispatch]);

  const top10 = allWardsStats
    ? [...allWardsStats].sort((a, b) => b.unassessedCount - a.unassessedCount).slice(0, 10)
    : [];

  return (
    <PageMotion className="commissioner-view">
      <div className="commissioner-view__map">
        <MapView choropleth allWardsData={allWardsStats} />
      </div>

      <div className="commissioner-view__overlay">
        <div className="commissioner-view__toolbar glass-panel">
          <div>
            <span className="view-kicker">City-Wide View</span>
            <h1 className="commissioner-view__title">Commissioner Overview</h1>
          </div>
        </div>

        <div className="commissioner-view__panel glass-panel">
          <div className="commissioner-view__top10">
            <h2 className="commissioner-view__section-title">Top 10 Wards by Unassessed</h2>
            <div className="table-responsive">
              <table className="commissioner-view__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ward</th>
                    <th className="commissioner-view__th--right">Unassessed</th>
                    <th className="commissioner-view__th--right">Detections</th>
                    <th className="commissioner-view__th--right">Open Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {allWardsStatus === 'loading' ? (
                    [0, 1, 2, 3, 4].map((i) => (
                      <tr key={`skeleton-${i}`} aria-hidden="true">
                        <td className="commissioner-view__rank">{i + 1}</td>
                        <td><span className="skeleton-bar commissioner-view__skeleton-cell" /></td>
                        <td className="commissioner-view__td--right">
                          <span className="skeleton-bar commissioner-view__skeleton-cell commissioner-view__skeleton-cell--sm" />
                        </td>
                        <td className="commissioner-view__td--right">
                          <span className="skeleton-bar commissioner-view__skeleton-cell commissioner-view__skeleton-cell--sm" />
                        </td>
                        <td className="commissioner-view__td--right">
                          <span className="skeleton-bar commissioner-view__skeleton-cell commissioner-view__skeleton-cell--sm" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {top10.map((w, i) => (
                        <tr key={w.wardId}>
                          <td className="commissioner-view__rank">{i + 1}</td>
                          <td>{w.wardName ?? `Ward ${w.wardId}`}</td>
                          <td className="commissioner-view__td--right">{w.unassessedCount.toLocaleString()}</td>
                          <td className="commissioner-view__td--right">{w.totalDetections.toLocaleString()}</td>
                          <td className="commissioner-view__td--right">
                            {w.openTickets > 0 ? (
                              <span
                                className="status-badge"
                                style={{
                                  background: 'var(--status-danger-bg)',
                                  color: 'var(--status-danger-text)',
                                }}
                              >
                                {w.openTickets}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {top10.length === 0 && (
                        <tr>
                          <td colSpan={5} className="commissioner-view__empty">
                            <EmptyState
                              icon={FiBarChart2}
                              message="No data. Ward stats will appear after pipeline runs."
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="commissioner-view__brief">
            <h2 className="commissioner-view__section-title">AI Daily Brief</h2>
            {briefStatus === 'loading' ? (
              <div className="commissioner-view__brief-skeleton" aria-hidden="true">
                <span className="skeleton-bar commissioner-view__skeleton-line" />
                <span className="skeleton-bar commissioner-view__skeleton-line" />
                <span className="skeleton-bar commissioner-view__skeleton-line commissioner-view__skeleton-line--short" />
              </div>
            ) : briefStatus === 'failed' ? (
              <p className="commissioner-view__brief-placeholder">
                {briefError || 'AI brief unavailable. Try refreshing.'}
              </p>
            ) : aiBrief ? (
              <div className="commissioner-view__brief-markdown">
                <ReactMarkdown>{aiBrief}</ReactMarkdown>
              </div>
            ) : (
              <p className="commissioner-view__brief-placeholder">
                AI brief will appear here once the pipeline has run.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageMotion>
  );
}

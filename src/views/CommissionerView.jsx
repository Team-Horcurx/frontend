import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  fetchAllWardsStats,
  selectAllWardsStats,
  selectAllWardsStatus,
  selectAiBrief,
} from '../Redux/slices/statsSlice.js';
import MapView from '../components/MapView.jsx';
import DemoModeBadge from '../components/DemoModeBadge.jsx';
import './CommissionerView.css';

export default function CommissionerView() {
  const dispatch = useDispatch();
  const allWardsStats = useSelector(selectAllWardsStats);
  const allWardsStatus = useSelector(selectAllWardsStatus);
  const aiBrief = useSelector(selectAiBrief);

  useEffect(() => {
    if (allWardsStatus === 'idle') dispatch(fetchAllWardsStats());
  }, [allWardsStatus, dispatch]);

  const top10 = allWardsStats
    ? [...allWardsStats].sort((a, b) => b.unassessedCount - a.unassessedCount).slice(0, 10)
    : [];

  return (
    <div className="commissioner-view">
      <DemoModeBadge />
      <div className="commissioner-view__content">
        <div className="commissioner-view__header">
          <h1 className="commissioner-view__title">Commissioner Overview</h1>
        </div>

        <div className="commissioner-view__body">
          <div className="commissioner-view__map">
            <MapView choropleth />
          </div>

          <div className="commissioner-view__sidebar">
            <div className="commissioner-view__top10">
              <h2 className="commissioner-view__section-title">Top 10 Wards by Unassessed</h2>
              {allWardsStatus === 'loading' ? (
                <div className="commissioner-view__loading">Loading ward data…</div>
              ) : (
                <table className="commissioner-view__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ward</th>
                      <th className="commissioner-view__th--right">Unassessed</th>
                      <th className="commissioner-view__th--right">Detections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10.map((w, i) => (
                      <tr key={w.wardId}>
                        <td className="commissioner-view__rank">{i + 1}</td>
                        <td>{w.wardName ?? `Ward ${w.wardId}`}</td>
                        <td className="commissioner-view__td--right">{w.unassessedCount.toLocaleString()}</td>
                        <td className="commissioner-view__td--right">{w.totalDetections.toLocaleString()}</td>
                      </tr>
                    ))}
                    {top10.length === 0 && (
                      <tr>
                        <td colSpan={4} className="commissioner-view__empty">
                          No data. Ward stats will appear after pipeline runs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="commissioner-view__brief">
              <h2 className="commissioner-view__section-title">AI Daily Brief</h2>
              {allWardsStatus === 'loading' ? (
                <p className="commissioner-view__brief-loading">Generating brief…</p>
              ) : aiBrief ? (
                <div className="commissioner-view__brief-markdown">
                  <ReactMarkdown>{aiBrief}</ReactMarkdown>
                </div>
              ) : (
                <p className="commissioner-view__brief-placeholder">
                  Phase 3 will render the AI-generated daily brief here using Bedrock Llama 4 Scout.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

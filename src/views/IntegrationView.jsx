import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUpload, FiPlay, FiCheckCircle, FiAlertTriangle, FiAlertOctagon, FiInfo } from 'react-icons/fi';
import PageMotion from '../components/PageMotion.jsx';
import WardSelector from '../components/WardSelector.jsx';
import Loader from '../components/Loader.jsx';
import { selectSelectedWard } from '../Redux/slices/wardsSlice.js';
import {
  fetchSources, uploadSource,
  selectSources, selectSourcesStatus, selectUploadStatus, selectUploadError,
  resetUploadStatus,
} from '../Redux/slices/sourcesSlice.js';
import {
  fetchMatches, runMatching,
  selectMatches, selectMatchesStatus, selectRunStatus, selectLastRunResult,
} from '../Redux/slices/harmonizationSlice.js';
import {
  fetchConflicts, resolveConflict,
  selectConflicts, selectConflictsStatus,
} from '../Redux/slices/conflictsSlice.js';
import './IntegrationView.css';

const SOURCE_TYPES = [
  'cadastral', 'revenue', 'municipal_gis', 'utility',
  'drone_imagery', 'ori', 'dsm_dtm', 'ground_truth', 'gnss_cors', 'building_footprint',
];

const SEVERITY_META = {
  critical: { icon: FiAlertOctagon, cls: 'danger' },
  high:     { icon: FiAlertTriangle, cls: 'warning' },
  medium:   { icon: FiAlertTriangle, cls: 'orange' },
  low:      { icon: FiInfo,          cls: 'info' },
};

const STATUS_CLS = {
  ready:       'success',
  processing:  'secondary',
  pending_ocr: 'warning',
  failed:      'danger',
};

function MatchScoreBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score ?? 0));
  const cls   = pct >= 90 ? 'success' : pct >= 70 ? 'warning' : pct >= 40 ? 'orange' : 'danger';
  return (
    <div className="integration-view__score-bar">
      <div
        className={`integration-view__score-fill integration-view__score-fill--${cls}`}
        style={{ width: `${pct}%` }}
      />
      <span className="integration-view__score-label">{pct.toFixed(1)}</span>
    </div>
  );
}

export default function IntegrationView() {
  const dispatch     = useDispatch();
  const selectedWard = useSelector(selectSelectedWard);
  const wardId       = selectedWard?.id ?? '';

  const sources        = useSelector(selectSources);
  const sourcesStatus  = useSelector(selectSourcesStatus);
  const uploadStatus   = useSelector(selectUploadStatus);
  const uploadError    = useSelector(selectUploadError);

  const matches        = useSelector(selectMatches);
  const matchesStatus  = useSelector(selectMatchesStatus);
  const runStatus      = useSelector(selectRunStatus);
  const lastRunResult  = useSelector(selectLastRunResult);

  const conflicts      = useSelector(selectConflicts);
  const conflictsStatus = useSelector(selectConflictsStatus);

  const [srcTypeFilter, setSrcTypeFilter] = useState('');
  const [uploadType,    setUploadType]    = useState('cadastral');
  const [minScore,      setMinScore]      = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchSources({ wardId: wardId || undefined }));
    dispatch(fetchMatches({ wardId: wardId || undefined }));
    dispatch(fetchConflicts({ wardId: wardId || undefined }));
  }, [dispatch, wardId]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const b64 = e.target.result.split(',')[1];
      await dispatch(uploadSource({
        fileContent: b64,
        type:    uploadType,
        wardId:  wardId || undefined,
        filename: file.name,
      }));
      dispatch(resetUploadStatus());
      dispatch(fetchSources({ wardId: wardId || undefined }));
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function handleRunMatching() {
    await dispatch(runMatching(wardId || undefined));
    dispatch(fetchMatches({ wardId: wardId || undefined }));
    dispatch(fetchConflicts({ wardId: wardId || undefined }));
  }

  function handleResolve(conflictId) {
    dispatch(resolveConflict({ id: conflictId, status: 'resolved', resolvedBy: 'officer' }));
  }

  const filteredSources = srcTypeFilter
    ? sources.filter((s) => s.type === srcTypeFilter)
    : sources;

  const filteredMatches = matches.filter((m) => m.matchScore >= minScore);

  return (
    <PageMotion className="integration-view">
      <div className="integration-view__content view-container">

        <div className="integration-view__header">
          <div>
            <span className="view-kicker">PS 26013 NAKSHA</span>
            <h1 className="integration-view__title">Multi-Source Integration</h1>
          </div>
          <WardSelector />
        </div>

        <div className="integration-view__grid">

          {/* ── Left: Source Ingestion ───────────────────────────────── */}
          <section className="integration-view__panel glass-panel">
            <h2 className="integration-view__panel-title">Data Sources</h2>

            <div className="integration-view__upload-form">
              <select
                className="integration-view__select"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <label className="integration-view__file-label">
                <FiUpload size={13} />
                Choose file
                <input
                  ref={fileRef}
                  type="file"
                  accept=".geojson,.json,.pdf,.jpg,.jpeg,.png,.tiff,.tif,.csv,.shp"
                  className="integration-view__file-input"
                />
              </label>
              <button
                className="integration-view__btn integration-view__btn--primary"
                onClick={handleUpload}
                disabled={uploadStatus === 'loading'}
              >
                {uploadStatus === 'loading' ? 'Uploading…' : 'Upload'}
              </button>
            </div>
            {uploadError && <p className="integration-view__error">{uploadError}</p>}

            <div className="integration-view__type-chips">
              <button
                className={`integration-view__chip${!srcTypeFilter ? ' integration-view__chip--active' : ''}`}
                onClick={() => setSrcTypeFilter('')}
              >All</button>
              {SOURCE_TYPES.slice(0, 6).map((t) => (
                <button
                  key={t}
                  className={`integration-view__chip${srcTypeFilter === t ? ' integration-view__chip--active' : ''}`}
                  onClick={() => setSrcTypeFilter((v) => v === t ? '' : t)}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {sourcesStatus === 'loading' ? (
              <Loader />
            ) : (
              <ul className="integration-view__source-list">
                {filteredSources.length === 0 && (
                  <li className="integration-view__empty">No sources found</li>
                )}
                {filteredSources.map((src) => (
                  <li key={src.id} className="integration-view__source-item">
                    <div className="integration-view__source-name">
                      {src.filename ?? src.s3Key?.split('/').pop()}
                    </div>
                    <div className="integration-view__source-meta">
                      <span className="integration-view__type-tag">{src.type.replace(/_/g, ' ')}</span>
                      <span
                        className="status-badge"
                        style={{
                          background: `var(--status-${STATUS_CLS[src.status] ?? 'secondary'}-bg)`,
                          color:      `var(--status-${STATUS_CLS[src.status] ?? 'secondary'}-text)`,
                        }}
                      >
                        {src.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Center: Spatial Matches ──────────────────────────────── */}
          <section className="integration-view__panel glass-panel">
            <div className="integration-view__panel-header">
              <h2 className="integration-view__panel-title">Spatial Matches</h2>
              <div className="integration-view__panel-actions">
                <label className="integration-view__score-label-small">
                  Min score
                  <input
                    type="range"
                    min={0} max={100} step={5}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="integration-view__range"
                  />
                  <span>{minScore}</span>
                </label>
                <button
                  className="integration-view__btn integration-view__btn--primary"
                  onClick={handleRunMatching}
                  disabled={runStatus === 'loading'}
                >
                  <FiPlay size={13} />
                  {runStatus === 'loading' ? 'Running…' : 'Run Matching'}
                </button>
              </div>
            </div>

            {lastRunResult && (
              <div className="integration-view__run-result">
                {lastRunResult.matches_created} matches, {lastRunResult.conflicts_created} conflicts from {lastRunResult.sources_evaluated} sources
              </div>
            )}

            {matchesStatus === 'loading' ? (
              <Loader />
            ) : (
              <table className="integration-view__match-table">
                <thead>
                  <tr>
                    <th>Source A</th>
                    <th>Source B</th>
                    <th>IoU</th>
                    <th>Dist (m)</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.length === 0 && (
                    <tr><td colSpan={5} className="integration-view__empty">No matches</td></tr>
                  )}
                  {filteredMatches.map((m) => (
                    <tr key={m.id}>
                      <td><span className="integration-view__type-tag">{m.sourceAType?.replace(/_/g, ' ')}</span></td>
                      <td><span className="integration-view__type-tag">{m.sourceBType?.replace(/_/g, ' ')}</span></td>
                      <td className="integration-view__num">{(m.geometryIou ?? 0).toFixed(2)}</td>
                      <td className="integration-view__num">{(m.centroidDistanceM ?? 0).toFixed(1)}</td>
                      <td><MatchScoreBar score={m.matchScore} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* ── Right: Conflict Resolution ───────────────────────────── */}
          <section className="integration-view__panel glass-panel">
            <h2 className="integration-view__panel-title">
              Conflicts
              {conflicts.length > 0 && (
                <span className="integration-view__count-badge">{conflicts.length}</span>
              )}
            </h2>

            {conflictsStatus === 'loading' ? (
              <Loader />
            ) : (
              <ul className="integration-view__conflict-list">
                {conflicts.length === 0 && (
                  <li className="integration-view__empty">No conflicts</li>
                )}
                {conflicts.map((c) => {
                  const meta = SEVERITY_META[c.severity] ?? SEVERITY_META.low;
                  const Icon = meta.icon;
                  return (
                    <li key={c.id} className={`integration-view__conflict integration-view__conflict--${meta.cls}`}>
                      <div className="integration-view__conflict-header">
                        <Icon size={14} />
                        <span className="integration-view__conflict-type">
                          {c.conflictType?.replace(/_/g, ' ')}
                        </span>
                        <span
                          className="status-badge"
                          style={{
                            background: `var(--status-${meta.cls}-bg)`,
                            color:      `var(--status-${meta.cls}-text)`,
                          }}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <p className="integration-view__conflict-desc">{c.suggestedResolution}</p>
                      <div className="integration-view__conflict-footer">
                        <span
                          className="status-badge"
                          style={{
                            background: `var(--status-${c.status === 'resolved' ? 'success' : 'secondary'}-bg)`,
                            color:      `var(--status-${c.status === 'resolved' ? 'success' : 'secondary'}-text)`,
                          }}
                        >
                          {c.status}
                        </span>
                        {c.status === 'pending' && (
                          <button
                            className="integration-view__btn integration-view__btn--sm"
                            onClick={() => handleResolve(c.id)}
                          >
                            <FiCheckCircle size={12} /> Mark resolved
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageMotion>
  );
}

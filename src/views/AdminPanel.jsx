import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { FiUpload, FiRefreshCw, FiDatabase, FiSliders } from 'react-icons/fi';
import DemoModeBadge from '../components/DemoModeBadge.jsx';
import {
  uploadCSV,
  saveDbConfig,
  triggerRefresh,
  fetchAdminConfig,
  selectDataMode,
  selectPipelineStatus,
  selectLastRefresh,
  selectNdbiThreshold,
  selectUploadStatus,
  selectUploadError,
  selectAdminError,
  resetUploadStatus,
} from '../Redux/slices/adminSlice.js';
import './AdminPanel.css';

const PIPELINE_STATUS_CLASS = {
  idle: 'secondary',
  running: 'info',
  completed: 'success',
  failed: 'danger',
};

export default function AdminPanel() {
  const dispatch = useDispatch();
  const dataMode = useSelector(selectDataMode);
  const pipelineStatus = useSelector(selectPipelineStatus);
  const lastRefresh = useSelector(selectLastRefresh);
  const ndbiThreshold = useSelector(selectNdbiThreshold);
  const uploadStatus = useSelector(selectUploadStatus);
  const uploadError = useSelector(selectUploadError);
  const adminError = useSelector(selectAdminError);

  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const [dbForm, setDbForm] = useState({ host: '', port: '3306', database: '', username: '', password: '' });
  const [dbSaveStatus, setDbSaveStatus] = useState('idle');

  const [threshold, setThreshold] = useState(ndbiThreshold);
  const [thresholdSaveStatus, setThresholdSaveStatus] = useState('idle');

  useEffect(() => { setThreshold(ndbiThreshold); }, [ndbiThreshold]);

  // Poll pipeline status while running
  useEffect(() => {
    if (pipelineStatus !== 'running') return;
    const interval = setInterval(() => dispatch(fetchAdminConfig()), 10000);
    return () => clearInterval(interval);
  }, [pipelineStatus, dispatch]);

  async function handleUpload() {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    const result = await dispatch(uploadCSV(formData));
    if (uploadCSV.fulfilled.match(result)) {
      setUploadResult(result.payload);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDbSave() {
    setDbSaveStatus('loading');
    const result = await dispatch(saveDbConfig(dbForm));
    setDbSaveStatus(saveDbConfig.fulfilled.match(result) ? 'succeeded' : 'failed');
    setTimeout(() => setDbSaveStatus('idle'), 3000);
  }

  async function handleThresholdSave() {
    setThresholdSaveStatus('loading');
    const result = await dispatch(saveDbConfig({ ndbi_threshold: threshold }));
    setThresholdSaveStatus(saveDbConfig.fulfilled.match(result) ? 'succeeded' : 'failed');
    setTimeout(() => setThresholdSaveStatus('idle'), 3000);
  }

  function handleTriggerRefresh() {
    dispatch(triggerRefresh());
  }

  return (
    <div className="admin-panel">
      <DemoModeBadge />
      <div className="admin-panel__content">
        <div className="admin-panel__header">
          <h1 className="admin-panel__title">Admin Panel</h1>
          <span
            className="status-badge"
            style={{
              background: dataMode === 'live' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
              color: dataMode === 'live' ? 'var(--status-success-text)' : 'var(--status-warning-text)',
            }}
          >
            {dataMode === 'live' ? 'Live Data' : 'Demo Mode'}
          </span>
        </div>

        <div className="admin-panel__sections">

          {/* CSV Upload */}
          <section className="admin-section">
            <h2 className="admin-section__title">
              <FiUpload className="admin-section__icon" />
              Upload GVMC Property Data
            </h2>
            <div className="admin-section__row">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="admin-section__file-input"
                onChange={(e) => { setSelectedFile(e.target.files[0] ?? null); setUploadResult(null); dispatch(resetUploadStatus()); }}
              />
              <button
                className="admin-section__btn admin-section__btn--primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'loading'}
              >
                {uploadStatus === 'loading' ? 'Uploading…' : 'Upload CSV'}
              </button>
            </div>
            {uploadStatus === 'succeeded' && (
              <div className="admin-section__success">
                Data loaded successfully.
                {uploadResult?.properties_imported != null && ` ${uploadResult.properties_imported.toLocaleString()} properties imported.`}
              </div>
            )}
            {uploadError && <div className="admin-section__error">{uploadError}</div>}
          </section>

          {/* DB Config */}
          <section className="admin-section">
            <h2 className="admin-section__title">
              <FiDatabase className="admin-section__icon" />
              Database Configuration
            </h2>
            <div className="admin-section__form">
              {[
                { label: 'Host', key: 'host', placeholder: 'rds-endpoint.ap-south-1.rds.amazonaws.com' },
                { label: 'Port', key: 'port', placeholder: '3306' },
                { label: 'Database', key: 'database', placeholder: 'gvmc_sw14' },
                { label: 'Username', key: 'username', placeholder: 'admin' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="admin-section__field">
                  <label className="admin-section__label">{label}</label>
                  <input
                    className="admin-section__input"
                    value={dbForm[key]}
                    placeholder={placeholder}
                    onChange={(e) => setDbForm({ ...dbForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="admin-section__field">
                <label className="admin-section__label">Password</label>
                <input
                  type="password"
                  className="admin-section__input"
                  value={dbForm.password}
                  placeholder="••••••••"
                  onChange={(e) => setDbForm({ ...dbForm, password: e.target.value })}
                />
              </div>
              <button
                className="admin-section__btn admin-section__btn--secondary"
                onClick={handleDbSave}
                disabled={dbSaveStatus === 'loading'}
              >
                {dbSaveStatus === 'loading' ? 'Saving…' : 'Save Config'}
              </button>
              {dbSaveStatus === 'succeeded' && <span className="admin-section__inline-success">Saved.</span>}
              {dbSaveStatus === 'failed' && <span className="admin-section__inline-error">Failed to save.</span>}
            </div>
          </section>

          {/* Pipeline Control */}
          <section className="admin-section">
            <h2 className="admin-section__title">
              <FiRefreshCw className="admin-section__icon" />
              Detection Pipeline
            </h2>
            <div className="admin-section__pipeline-row">
              <div className="admin-section__pipeline-info">
                <span className="admin-section__label">Status</span>
                <span
                  className="status-badge"
                  style={{
                    background: `var(--status-${PIPELINE_STATUS_CLASS[pipelineStatus] ?? 'secondary'}-bg)`,
                    color: `var(--status-${PIPELINE_STATUS_CLASS[pipelineStatus] ?? 'secondary'}-text)`,
                  }}
                >
                  {pipelineStatus}
                </span>
              </div>
              {lastRefresh && (
                <div className="admin-section__pipeline-info">
                  <span className="admin-section__label">Last refresh</span>
                  <span className="admin-section__value">
                    {dayjs(lastRefresh).format('DD MMM YYYY HH:mm')}
                  </span>
                </div>
              )}
            </div>
            <button
              className="admin-section__btn admin-section__btn--primary"
              onClick={handleTriggerRefresh}
              disabled={pipelineStatus === 'running'}
            >
              <FiRefreshCw
                className={pipelineStatus === 'running' ? 'admin-section__spin' : ''}
                size={14}
              />
              {pipelineStatus === 'running' ? 'Running…' : 'Trigger Refresh'}
            </button>
            {adminError && <div className="admin-section__error">{adminError}</div>}
          </section>

          {/* NDBI Threshold */}
          <section className="admin-section">
            <h2 className="admin-section__title">
              <FiSliders className="admin-section__icon" />
              Detection Sensitivity
            </h2>
            <div className="admin-section__threshold">
              <div className="admin-section__threshold-label">
                NDBI Threshold: <strong>{threshold.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="admin-section__slider"
              />
              <div className="admin-section__threshold-hints">
                <span>0.05 (sensitive)</span>
                <span>0.30 (strict)</span>
              </div>
            </div>
            <button
              className="admin-section__btn admin-section__btn--secondary"
              onClick={handleThresholdSave}
              disabled={thresholdSaveStatus === 'loading'}
            >
              {thresholdSaveStatus === 'loading' ? 'Saving…' : 'Save Threshold'}
            </button>
            {thresholdSaveStatus === 'succeeded' && <span className="admin-section__inline-success">Saved.</span>}
            {thresholdSaveStatus === 'failed' && <span className="admin-section__inline-error">Failed to save.</span>}
          </section>

        </div>
      </div>
    </div>
  );
}

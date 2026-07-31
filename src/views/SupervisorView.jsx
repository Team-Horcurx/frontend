import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiDownload } from 'react-icons/fi';
import WardSelector from '../components/WardSelector.jsx';
import StatsBar from '../components/StatsBar.jsx';
import PropertyList from '../components/PropertyList.jsx';
import AlertPanel from '../components/AlertPanel.jsx';
import PageMotion from '../components/PageMotion.jsx';
import { exportAlerts, selectExportStatus } from '../Redux/slices/alertsSlice.js';
import { selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import './SupervisorView.css';

export default function SupervisorView() {
  const dispatch = useDispatch();
  const exportStatus = useSelector(selectExportStatus);
  const error = useSelector(selectPropertiesError);

  async function handleExport() {
    const result = await dispatch(exportAlerts());
    if (exportAlerts.fulfilled.match(result) && result.payload) {
      window.open(result.payload, '_blank');
    }
  }

  return (
    <PageMotion className="supervisor-view">
      <div className="supervisor-view__content">
        <div className="supervisor-view__header">
          <h1 className="supervisor-view__title">Supervisor</h1>
          <div className="supervisor-view__actions">
            <WardSelector />
            <button
              className="supervisor-view__export-btn"
              onClick={handleExport}
              disabled={exportStatus === 'loading'}
            >
              <FiDownload size={14} />
              {exportStatus === 'loading' ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
        {error && <div className="view-error-banner">Failed to load data: {error}</div>}
        <StatsBar />
        <div className="supervisor-view__body">
          <div className="supervisor-view__list">
            <PropertyList />
          </div>
          <div className="supervisor-view__alerts">
            <AlertPanel />
          </div>
        </div>
      </div>
    </PageMotion>
  );
}

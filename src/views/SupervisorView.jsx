import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiDownload } from 'react-icons/fi';
import WardSelector from '../components/WardSelector.jsx';
import StatsBar from '../components/StatsBar.jsx';
import PropertyList from '../components/PropertyList.jsx';
import AlertPanel from '../components/AlertPanel.jsx';
import PageMotion from '../components/PageMotion.jsx';
import PendingAssessmentsTable, { PendingAssessmentsBadge } from '../components/PendingAssessmentsPanel.jsx';
import TicketsList from '../components/TicketsList.jsx';
import { exportAlerts, selectExportStatus } from '../Redux/slices/alertsSlice.js';
import { selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import './SupervisorView.css';

export default function SupervisorView() {
  const dispatch = useDispatch();
  const exportStatus = useSelector(selectExportStatus);
  const error = useSelector(selectPropertiesError);
  const [assessmentsOpen, setAssessmentsOpen] = useState(false);

  async function handleExport() {
    const result = await dispatch(exportAlerts());
    if (exportAlerts.fulfilled.match(result) && result.payload) {
      window.open(result.payload, '_blank');
    }
  }

  return (
    <PageMotion className="supervisor-view">
      <div className="supervisor-view__content view-container">
        <div className="supervisor-view__header">
          <div>
            <span className="view-kicker">Supervisor Workspace</span>
            <div className="supervisor-view__title-row">
              <h1 className="supervisor-view__title">Ward Oversight</h1>
              <PendingAssessmentsBadge
                open={assessmentsOpen}
                onToggle={() => setAssessmentsOpen((v) => !v)}
              />
            </div>
          </div>
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
        {assessmentsOpen && <PendingAssessmentsTable />}
        <div className="supervisor-view__body">
          <div className="supervisor-view__tickets">
            <TicketsList />
          </div>
          <div className="supervisor-view__alerts">
            <AlertPanel />
          </div>
          <StatsBar />
          <div className="supervisor-view__list">
            <PropertyList />
          </div>
        </div>
      </div>
    </PageMotion>
  );
}

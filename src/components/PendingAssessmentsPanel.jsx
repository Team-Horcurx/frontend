import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { FiBell } from 'react-icons/fi';
import {
  selectAssessments,
  selectPendingAssessmentsCount,
  selectLastSubmittedId,
  updateAssessmentStatus,
} from '../Redux/slices/assessmentsSlice.js';
import EmptyState from './EmptyState.jsx';
import './PendingAssessmentsPanel.css';

const STATUS_CLASSES = { pending_review: 'warning', reviewed: 'success' };
const STATUS_LABELS = { pending_review: 'Pending Review', reviewed: 'Reviewed' };

export function PendingAssessmentsBadge({ open, onToggle }) {
  const count = useSelector(selectPendingAssessmentsCount);
  const lastSubmittedId = useSelector(selectLastSubmittedId);
  const [showToast, setShowToast] = useState(false);
  const prevIdRef = useRef(lastSubmittedId);

  useEffect(() => {
    if (lastSubmittedId && lastSubmittedId !== prevIdRef.current) {
      prevIdRef.current = lastSubmittedId;
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [lastSubmittedId]);

  return (
    <div className="pending-assessments-badge-wrap">
      <button
        type="button"
        className={`pending-assessments-badge ${open ? 'pending-assessments-badge--active' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <FiBell size={13} />
        Pending Assessments ({count})
      </button>
      {showToast && <span className="pending-assessments-toast">🔔 New Assessment Submitted</span>}
    </div>
  );
}

export default function PendingAssessmentsTable() {
  const dispatch = useDispatch();
  const assessments = useSelector(selectAssessments);

  return (
    <div className="pending-assessments">
      <div className="pending-assessments__header">
        <span className="pending-assessments__heading">Pending Assessments</span>
        <span className="property-list__count">{assessments.length} submitted</span>
      </div>
      <div className="pending-assessments__scroll">
        <table className="property-list__table">
          <thead>
            <tr>
              <th className="property-list__th">Property</th>
              <th className="property-list__th">Ward</th>
              <th className="property-list__th">Officer</th>
              <th className="property-list__th">Submission Time</th>
              <th className="property-list__th property-list__th--right">Estimated Tax</th>
              <th className="property-list__th">Status</th>
              <th className="property-list__th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 && (
              <tr>
                <td colSpan={7} className="property-list__empty">
                  <EmptyState icon={FiBell} message="No assessments submitted yet." />
                </td>
              </tr>
            )}
            {assessments.map((a) => (
              <tr key={a.id} className="property-list__row">
                <td className="property-list__td property-list__td--id">{a.propertyId}</td>
                <td className="property-list__td">{a.wardName}</td>
                <td className="property-list__td">{a.officerId}</td>
                <td className="property-list__td">{dayjs(a.submittedAt).format('DD MMM, HH:mm')}</td>
                <td className="property-list__td property-list__td--right">
                  ₹{Number(a.estimatedTaxImpactInr || 0).toLocaleString()}
                </td>
                <td className="property-list__td">
                  <span
                    className="status-badge"
                    style={{
                      background: `var(--status-${STATUS_CLASSES[a.status]}-bg)`,
                      color: `var(--status-${STATUS_CLASSES[a.status]}-text)`,
                    }}
                  >
                    {STATUS_LABELS[a.status]}
                  </span>
                </td>
                <td className="property-list__td">
                  {a.status === 'pending_review' ? (
                    <button
                      type="button"
                      className="pending-assessments__action-btn"
                      onClick={() => dispatch(updateAssessmentStatus({ id: a.id, status: 'reviewed' }))}
                    >
                      Mark Reviewed
                    </button>
                  ) : (
                    <span className="pending-assessments__action-done">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

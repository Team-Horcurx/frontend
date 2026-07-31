import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  selectSelectedProperty,
  selectVerifyStatus,
  selectVerifyError,
  resetVerifyStatus,
} from '../Redux/slices/propertiesSlice.js';
import { verifyProperty } from '../Redux/slices/propertiesSlice.js';
import './VerifyPanel.css';

const ACTIONS = [
  { status: 'verified', label: 'Verified', badgeType: 'success' },
  { status: 'underassessed', label: 'Underassessed', badgeType: 'warning' },
  { status: 'false_positive', label: 'False Positive', badgeType: 'danger' },
  { status: 'already_assessed', label: 'Already Assessed', badgeType: 'info' },
];

const STATUS_CLASSES = {
  pending: 'secondary',
  verified: 'success',
  underassessed: 'warning',
  false_positive: 'danger',
  already_assessed: 'info',
};

export default function VerifyPanel() {
  const dispatch = useDispatch();
  const property = useSelector(selectSelectedProperty);
  const verifyStatus = useSelector(selectVerifyStatus);
  const verifyError = useSelector(selectVerifyError);

  if (!property) return null;

  function handleVerify(status) {
    dispatch(verifyProperty({ id: property.id, status, updatedBy: 'officer' }));
  }

  const currentStatusClass = STATUS_CLASSES[property.status] ?? 'secondary';

  return (
    <div className="verify-panel">
      <div className="verify-panel__header">
        <span className="verify-panel__title">Verification</span>
        <span
          className="status-badge"
          style={{
            background: `var(--status-${currentStatusClass}-bg)`,
            color: `var(--status-${currentStatusClass}-text)`,
          }}
        >
          {property.status ?? 'pending'}
        </span>
      </div>

      <div className="verify-panel__actions">
        {ACTIONS.map(({ status, label, badgeType }) => (
          <button
            key={status}
            className={`verify-panel__btn verify-panel__btn--${badgeType} ${property.status === status ? 'verify-panel__btn--active' : ''}`}
            onClick={() => handleVerify(status)}
            disabled={verifyStatus === 'loading' || property.status === status}
          >
            {verifyStatus === 'loading' && property.status !== status ? (
              <span className="verify-panel__spinner" />
            ) : null}
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {verifyStatus === 'succeeded' && (
          <motion.div
            key="verify-success"
            className="verify-panel__success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            Status updated successfully.
          </motion.div>
        )}
        {verifyError && (
          <motion.div
            key="verify-error"
            className="verify-panel__error"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {verifyError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

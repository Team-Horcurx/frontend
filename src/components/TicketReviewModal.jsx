import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import {
  reviewTicket,
  resetReviewStatus,
  selectReviewStatus,
  selectReviewError,
} from '../Redux/slices/ticketsSlice.js';
import './TicketReviewModal.css';

const STATUS_MAP = {
  open: 'danger',
  under_review: 'warning',
  resolved: 'success',
};

export default function TicketReviewModal({ ticket, onClose }) {
  const dispatch = useDispatch();
  const reviewStatus = useSelector(selectReviewStatus);
  const reviewError = useSelector(selectReviewError);

  const [newStatus, setNewStatus] = useState('under_review');
  const [notes, setNotes] = useState(ticket.supervisorNotes ?? '');

  useEffect(() => {
    if (reviewStatus === 'succeeded') {
      const timer = setTimeout(() => {
        dispatch(resetReviewStatus());
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reviewStatus, dispatch, onClose]);

  useEffect(() => {
    return () => { dispatch(resetReviewStatus()); };
  }, [dispatch]);

  function handleSave(e) {
    e.preventDefault();
    dispatch(reviewTicket({
      ticketId: ticket.id,
      status: newStatus,
      supervisorNotes: notes,
    }));
  }

  const currentType = STATUS_MAP[ticket.status] ?? 'secondary';
  const isLoading = reviewStatus === 'loading';
  const succeeded = reviewStatus === 'succeeded';

  return (
    <div className="ticket-modal__overlay" onClick={onClose}>
      <motion.div
        className="ticket-modal__panel glass-panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="ticket-modal__header">
          <span className="ticket-modal__title">Review Ticket</span>
          <button className="ticket-modal__close-btn" onClick={onClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="ticket-modal__detail">
          <div className="ticket-modal__row">
            <span className="ticket-modal__label">Ward</span>
            <span className="ticket-modal__value">{ticket.wardName ?? ticket.wardId}</span>
          </div>
          <div className="ticket-modal__row">
            <span className="ticket-modal__label">House No.</span>
            <span className="ticket-modal__value">{ticket.houseNumber}</span>
          </div>
          <div className="ticket-modal__row">
            <span className="ticket-modal__label">Status</span>
            <span
              className="status-badge"
              style={{
                background: `var(--status-${currentType}-bg)`,
                color: `var(--status-${currentType}-text)`,
              }}
            >
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          {ticket.taxPending != null && (
            <div className="ticket-modal__row">
              <span className="ticket-modal__label">Tax Pending</span>
              <span className="ticket-modal__value">
                ₹{Number(ticket.taxPending).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <div className="ticket-modal__row">
            <span className="ticket-modal__label">Raised on</span>
            <span className="ticket-modal__value">
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleString('en-IN')
                : '—'}
            </span>
          </div>
          <div className="ticket-modal__description">
            <span className="ticket-modal__label">Description</span>
            <p className="ticket-modal__description-text">{ticket.description}</p>
          </div>
          {ticket.photoUrl && (
            <div className="ticket-modal__photo">
              <span className="ticket-modal__label">Photograph</span>
              <img
                src={ticket.photoUrl}
                alt="Site photograph"
                className="ticket-modal__photo-img"
              />
            </div>
          )}
        </div>

        <form className="ticket-modal__form" onSubmit={handleSave}>
          <div className="ticket-modal__field">
            <span className="ticket-modal__label">Update Status</span>
            <div className="ticket-modal__status-btns">
              <button
                type="button"
                className={`ticket-modal__status-btn ticket-modal__status-btn--warning ${newStatus === 'under_review' ? 'ticket-modal__status-btn--active' : ''}`}
                onClick={() => setNewStatus('under_review')}
              >
                Under Review
              </button>
              <button
                type="button"
                className={`ticket-modal__status-btn ticket-modal__status-btn--success ${newStatus === 'resolved' ? 'ticket-modal__status-btn--active' : ''}`}
                onClick={() => setNewStatus('resolved')}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="ticket-modal__field">
            <label className="ticket-modal__label" htmlFor="ticket-modal-notes">
              Supervisor Notes
            </label>
            <textarea
              id="ticket-modal-notes"
              className="ticket-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add review notes…"
            />
          </div>

          <button
            type="submit"
            className="ticket-modal__save-btn"
            disabled={isLoading || succeeded}
          >
            {isLoading ? 'Saving…' : 'Save Review'}
          </button>

          <AnimatePresence>
            {succeeded && (
              <motion.div
                key="review-success"
                className="ticket-modal__success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Review saved.
              </motion.div>
            )}
            {reviewError && (
              <motion.div
                key="review-error"
                className="ticket-modal__error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {reviewError}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}

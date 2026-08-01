import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiFileText } from 'react-icons/fi';
import {
  fetchTickets,
  selectTickets,
  selectTicketsStatus,
} from '../Redux/slices/ticketsSlice.js';
import { selectSelectedWardId } from '../Redux/slices/wardsSlice.js';
import EmptyState from './EmptyState.jsx';
import TicketReviewModal from './TicketReviewModal.jsx';
import './TicketsList.css';

const STATUS_MAP = {
  open: 'danger',
  under_review: 'warning',
  resolved: 'success',
};

const STATUS_LABELS = {
  open: 'Open',
  under_review: 'Under Review',
  resolved: 'Resolved',
};

export default function TicketsList() {
  const dispatch = useDispatch();
  const tickets = useSelector(selectTickets);
  const ticketsStatus = useSelector(selectTicketsStatus);
  const selectedWardId = useSelector(selectSelectedWardId);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingTicket, setReviewingTicket] = useState(null);

  useEffect(() => {
    dispatch(fetchTickets({ wardId: selectedWardId || undefined, status: statusFilter || undefined }));
  }, [selectedWardId, statusFilter, dispatch]);

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="tickets-list">
      <div className="tickets-list__header">
        <div className="tickets-list__title-row">
          <span className="tickets-list__title">Field Tickets</span>
          <div className="tickets-list__counts">
            <span
              className="status-badge"
              style={{
                background: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
              }}
            >
              {openCount} open
            </span>
            <span
              className="status-badge"
              style={{
                background: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
              }}
            >
              {resolvedCount} resolved
            </span>
          </div>
        </div>
        <select
          className="tickets-list__filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {ticketsStatus === 'loading' ? (
        <div className="tickets-list__skeleton">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tickets-list__skeleton-row" aria-hidden="true">
              <span className="skeleton-bar tickets-list__skeleton-cell" />
              <span className="skeleton-bar tickets-list__skeleton-cell tickets-list__skeleton-cell--sm" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={FiFileText} message="No tickets found for this ward." />
      ) : (
        <div className="table-responsive">
          <table className="tickets-list__table">
            <thead>
              <tr>
                <th>Ward</th>
                <th>House No.</th>
                <th>Description</th>
                <th className="tickets-list__th--right">Tax Pending</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const type = STATUS_MAP[ticket.status] ?? 'secondary';
                return (
                  <tr key={ticket.id} className="tickets-list__row">
                    <td>{ticket.wardName ?? ticket.wardId}</td>
                    <td>{ticket.houseNumber}</td>
                    <td className="tickets-list__desc">
                      {ticket.description.length > 60
                        ? ticket.description.slice(0, 60) + '…'
                        : ticket.description}
                    </td>
                    <td className="tickets-list__td--right">
                      {ticket.taxPending != null
                        ? `₹${Number(ticket.taxPending).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          background: `var(--status-${type}-bg)`,
                          color: `var(--status-${type}-text)`,
                        }}
                      >
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </td>
                    <td className="tickets-list__date">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="tickets-list__review-btn"
                        onClick={() => setReviewingTicket(ticket)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewingTicket && (
        <TicketReviewModal
          ticket={reviewingTicket}
          onClose={() => setReviewingTicket(null)}
        />
      )}
    </div>
  );
}

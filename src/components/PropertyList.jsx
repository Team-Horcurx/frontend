import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectProperties,
  selectPropertiesStatus,
  selectSelectedProperty,
  setSelectedProperty,
} from '../Redux/slices/propertiesSlice.js';
import { fetchPropertyById } from '../Redux/slices/propertiesSlice.js';
import './PropertyList.css';

const TYPE_LABELS = { new_build: 'New Build', change_of_use: 'Change of Use' };
const STATUS_CLASSES = {
  pending: 'secondary',
  verified: 'success',
  underassessed: 'warning',
  false_positive: 'danger',
  already_assessed: 'info',
};

const SKELETON_ROWS = Array.from({ length: 6 });

export default function PropertyList() {
  const dispatch = useDispatch();
  const properties = useSelector(selectProperties);
  const status = useSelector(selectPropertiesStatus);
  const selectedProperty = useSelector(selectSelectedProperty);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = properties.filter((p) => {
    const matchType = typeFilter === 'all' || p.detectionType === typeFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchType && matchStatus;
  });

  function handleRowClick(property) {
    dispatch(setSelectedProperty(property.id));
    dispatch(fetchPropertyById(property.id));
  }

  return (
    <div className="property-list">
      <div className="property-list__filters">
        <select
          className="property-list__filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="new_build">New Build</option>
          <option value="change_of_use">Change of Use</option>
        </select>
        <select
          className="property-list__filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="underassessed">Underassessed</option>
          <option value="false_positive">False Positive</option>
          <option value="already_assessed">Already Assessed</option>
        </select>
        <span className="property-list__count">{filtered.length} properties</span>
      </div>

      <div className="property-list__scroll">
        <table className="property-list__table">
          <thead>
            <tr>
              <th className="property-list__th">ID</th>
              <th className="property-list__th">Type</th>
              <th className="property-list__th property-list__th--right">Area (m²)</th>
              <th className="property-list__th property-list__th--right">Confidence</th>
              <th className="property-list__th">Status</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' &&
              SKELETON_ROWS.map((_, i) => (
                <tr key={i} className="property-list__row property-list__row--skeleton">
                  <td colSpan={5}><div className="property-list__skeleton-bar" /></td>
                </tr>
              ))}
            {status !== 'loading' && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="property-list__empty">
                  {properties.length === 0 ? 'Select a ward to load properties.' : 'No matching properties.'}
                </td>
              </tr>
            )}
            {status !== 'loading' &&
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`property-list__row ${selectedProperty?.id === p.id ? 'property-list__row--selected' : ''}`}
                  onClick={() => handleRowClick(p)}
                >
                  <td className="property-list__td property-list__td--id">
                    {p.id.slice(0, 8)}…
                  </td>
                  <td className="property-list__td">
                    <span
                      className="status-badge"
                      style={{
                        background: p.detectionType === 'new_build'
                          ? 'var(--status-danger-bg)' : 'var(--status-orange-bg)',
                        color: p.detectionType === 'new_build'
                          ? 'var(--status-danger-text)' : 'var(--status-orange-text)',
                      }}
                    >
                      {TYPE_LABELS[p.detectionType] ?? p.detectionType}
                    </span>
                  </td>
                  <td className="property-list__td property-list__td--right">
                    {p.areaSqm?.toLocaleString()}
                  </td>
                  <td className="property-list__td property-list__td--right">
                    {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : '—'}
                  </td>
                  <td className="property-list__td">
                    <span
                      className="status-badge"
                      style={{
                        background: `var(--status-${STATUS_CLASSES[p.status] ?? 'secondary'}-bg)`,
                        color: `var(--status-${STATUS_CLASSES[p.status] ?? 'secondary'}-text)`,
                      }}
                    >
                      {p.status ?? 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiChevronDown } from 'react-icons/fi';
import {
  fetchWards,
  fetchWardGeoJSON,
  setSelectedWard,
  selectWards,
  selectSelectedWardId,
  selectWardsStatus,
} from '../Redux/slices/wardsSlice.js';
import { fetchProperties } from '../Redux/slices/propertiesSlice.js';
import { fetchStats } from '../Redux/slices/statsSlice.js';
import './WardSelector.css';

export default function WardSelector({ compareYear }) {
  const dispatch = useDispatch();
  const wards = useSelector(selectWards);
  const selectedWardId = useSelector(selectSelectedWardId);
  const status = useSelector(selectWardsStatus);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchWards());
  }, [status, dispatch]);

  function handleChange(e) {
    const wardId = e.target.value;
    if (!wardId) return;
    dispatch(setSelectedWard(wardId));
    // dispatch(fetchWardGeoJSON(wardId)); // S3 geojson files not uploaded yet
    dispatch(fetchProperties({ wardId, compareYear }));
    dispatch(fetchStats({ wardId }));
  }

  return (
    <div className="ward-selector">
      <label className="ward-selector__label" htmlFor="ward-select">
        Ward
      </label>
      <div className="ward-selector__select-wrap">
        <select
          id="ward-select"
          className="ward-selector__select"
          value={selectedWardId || ''}
          onChange={handleChange}
          disabled={status === 'loading'}
        >
          <option value="">
            {status === 'loading' ? 'Loading wards…' : '— Select a ward —'}
          </option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              Ward {w.id} — {w.name}
              {w.detectionCount > 0 ? ` (${w.detectionCount} detections)` : ''}
            </option>
          ))}
        </select>
        <FiChevronDown className="ward-selector__chevron" aria-hidden="true" />
      </div>
    </div>
  );
}

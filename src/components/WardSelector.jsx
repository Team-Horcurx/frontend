import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

export default function WardSelector() {
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
    dispatch(fetchWardGeoJSON(wardId));
    dispatch(fetchProperties({ wardId }));
    dispatch(fetchStats({ wardId }));
  }

  return (
    <div className="ward-selector">
      <label className="ward-selector__label" htmlFor="ward-select">
        Ward
      </label>
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
    </div>
  );
}

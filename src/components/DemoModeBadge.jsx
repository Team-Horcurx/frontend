import React from 'react';
import { useSelector } from 'react-redux';
import { selectDataMode } from '../Redux/slices/adminSlice.js';

export default function DemoModeBadge() {
  const dataMode = useSelector(selectDataMode);
  if (dataMode === 'live') return null;

  return (
    <span className="status-badge status-badge-warning" role="status">
      Demo Mode
    </span>
  );
}

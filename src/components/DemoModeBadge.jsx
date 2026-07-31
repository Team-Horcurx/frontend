import React from 'react';
import { useSelector } from 'react-redux';
import { FiAlertTriangle } from 'react-icons/fi';
import { selectDataMode } from '../Redux/slices/adminSlice.js';
import './DemoModeBadge.css';

export default function DemoModeBadge() {
  const dataMode = useSelector(selectDataMode);
  if (dataMode === 'live') return null;

  return (
    <div className="demo-badge" role="alert">
      <FiAlertTriangle className="demo-badge__icon" />
      <span>
        <strong>DEMO MODE</strong> — using mock data.
        Upload real CSV via Admin panel to go live.
      </span>
    </div>
  );
}

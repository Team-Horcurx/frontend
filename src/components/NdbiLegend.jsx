import React from 'react';
import { useSelector } from 'react-redux';
import { selectNdbiLegend, selectNdbiGrid } from '../Redux/slices/ndbiSlice.js';
import './NdbiLegend.css';

const BUCKET_ORDER = ['red', 'orange', 'green'];

export default function NdbiLegend() {
  const legend = useSelector(selectNdbiLegend);
  const grid = useSelector(selectNdbiGrid);

  if (!legend || !grid) return null;

  return (
    <div className="ndbi-legend glass-panel">
      <span className="ndbi-legend__heading">NDBI Change</span>
      <span className="ndbi-legend__caption">
        Green = no detected change for this year pair (not a land-use classification)
      </span>
      {BUCKET_ORDER.map((bucket) => {
        const entry = legend[bucket];
        if (!entry) return null;
        return (
          <div key={bucket} className="ndbi-legend__row">
            <span className="ndbi-legend__swatch" style={{ background: entry.color }} />
            <span className="ndbi-legend__label">{entry.label}</span>
          </div>
        );
      })}
    </div>
  );
}

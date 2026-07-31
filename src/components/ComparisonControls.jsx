import React from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { getComparisonStats, COMPARISON_YEARS } from '../mockData/comparisonData.js';
import './ComparisonControls.css';

const STATS_CONFIG = [
  { key: 'newStructures', label: 'New Structures', accent: 'var(--color-danger)' },
  { key: 'changeOfUse', label: 'Change of Use', accent: 'var(--color-warning)' },
  { key: 'builtUpAreaIncreaseSqm', label: 'Built-up Area +', accent: 'var(--color-primary)', suffix: ' m²' },
  { key: 'estimatedAssessableAreaSqm', label: 'Assessable Area', accent: 'var(--color-info)', suffix: ' m²' },
  { key: 'avgNdbiChange', label: 'Avg NDBI Change', accent: 'var(--status-purple-text)', prefix: '+', decimals: 2 },
  { key: 'estimatedTaxImpactInr', label: 'Tax Impact', accent: 'var(--color-success)', prefix: '₹' },
];

export default function ComparisonControls({ baseYear, compareYear, onBaseYearChange, onCompareYearChange }) {
  const stats = getComparisonStats(baseYear, compareYear);

  return (
    <div className="comparison-controls">
      <span className="comparison-controls__heading">Comparison</span>

      <div className="comparison-controls__years">
        <div className="comparison-controls__field">
          <label className="comparison-controls__label" htmlFor="compare-base-year">Base Year</label>
          <div className="comparison-controls__select-wrap">
            <select
              id="compare-base-year"
              className="comparison-controls__select"
              value={baseYear}
              onChange={(e) => onBaseYearChange(Number(e.target.value))}
            >
              {COMPARISON_YEARS.map((y) => (
                <option key={y} value={y} disabled={y >= compareYear}>{y}</option>
              ))}
            </select>
            <FiChevronDown className="comparison-controls__chevron" aria-hidden="true" />
          </div>
        </div>
        <div className="comparison-controls__field">
          <label className="comparison-controls__label" htmlFor="compare-current-year">Compare With</label>
          <div className="comparison-controls__select-wrap">
            <select
              id="compare-current-year"
              className="comparison-controls__select"
              value={compareYear}
              onChange={(e) => onCompareYearChange(Number(e.target.value))}
            >
              {COMPARISON_YEARS.map((y) => (
                <option key={y} value={y} disabled={y <= baseYear}>{y}</option>
              ))}
            </select>
            <FiChevronDown className="comparison-controls__chevron" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="stats-bar comparison-controls__stats">
        {STATS_CONFIG.map(({ key, label, accent, prefix, suffix, decimals }, i) => (
          <div key={key} className="stats-bar__card" style={{ '--accent': accent, '--row-index': i }}>
            <div className="stats-bar__value">
              {prefix ?? ''}{decimals != null ? stats[key].toFixed(decimals) : stats[key].toLocaleString()}{suffix ?? ''}
            </div>
            <div className="stats-bar__label">
              <span className="stats-bar__dot" />
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

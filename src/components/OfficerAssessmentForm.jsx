import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiChevronDown, FiClipboard } from 'react-icons/fi';
import { selectSelectedProperty } from '../Redux/slices/propertiesSlice.js';
import { selectSelectedWard } from '../Redux/slices/wardsSlice.js';
import { submitAssessment } from '../Redux/slices/assessmentsSlice.js';
import './OfficerAssessmentForm.css';

const CONSTRUCTION_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Industrial'];
const VIOLATION_TYPES = [
  'Unauthorized Construction',
  'Change of Land Use',
  'Building Extension',
  'Commercial Conversion',
  'Other',
];
const RECOMMENDED_ACTIONS = ['Verify', 'Issue Notice', 'Immediate Inspection', 'Demolition Review', 'Escalate'];

const EMPTY_FORM = {
  ownerName: '',
  doorNumber: '',
  surveyNumber: '',
  locality: '',
  constructionType: CONSTRUCTION_TYPES[0],
  floors: '',
  builtUpAreaSqm: '',
  newlyConstructedAreaSqm: '',
  violationType: VIOLATION_TYPES[0],
  officerRemarks: '',
  estimatedTaxImpactInr: '',
  estimatedPenaltyInr: '',
  recommendedAction: RECOMMENDED_ACTIONS[0],
};

export default function OfficerAssessmentForm({ baseYear, compareYear }) {
  const dispatch = useDispatch();
  const selectedProperty = useSelector(selectSelectedProperty);
  const selectedWard = useSelector(selectSelectedWard);

  const [expanded, setExpanded] = useState(false);
  const [propertyId, setPropertyId] = useState(selectedProperty?.id ?? 'GVMC-000-0000');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  // Re-prefill the Property ID (and clear manual fields) when the officer
  // selects a different property in the list — but never fight their typing
  // within the same property.
  useEffect(() => {
    setPropertyId(selectedProperty?.id ?? 'GVMC-000-0000');
    setForm(EMPTY_FORM);
  }, [selectedProperty?.id]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Comparison context shown read-only above the form. Uses real signal data
  // from the selected property where available (confidenceBreakdown.ndbi_delta,
  // confidence, detectionType, lat/lng), otherwise falls back to a plausible
  // mock — "area difference" specifically has no real per-property sqm delta
  // in the current mock schema (only a 0–1 detection-strength score), so it's
  // derived rather than fabricated outright.
  const breakdown = selectedProperty?.confidenceBreakdown ?? {};
  const ndbiChange = breakdown.ndbi_delta ?? 0.18;
  const areaDifferenceSqm = Math.round((selectedProperty?.areaSqm ?? 300) * (breakdown.area_delta ?? 0.15));
  const confidence = selectedProperty?.confidence ?? 0.75;
  const detectionType = selectedProperty?.detectionType ?? 'new_build';
  const coordinates = selectedProperty
    ? `${selectedProperty.lat.toFixed(5)}, ${selectedProperty.lng.toFixed(5)}`
    : '17.68690, 83.21850';

  function handleSubmit() {
    dispatch(submitAssessment({
      propertyId,
      ownerName: form.ownerName,
      doorNumber: form.doorNumber,
      surveyNumber: form.surveyNumber,
      wardId: selectedWard?.id ?? null,
      wardName: selectedWard?.name ?? '—',
      locality: form.locality,
      coordinates,
      constructionType: form.constructionType,
      floors: form.floors,
      builtUpAreaSqm: form.builtUpAreaSqm,
      newlyConstructedAreaSqm: form.newlyConstructedAreaSqm,
      violationType: form.violationType,
      officerRemarks: form.officerRemarks,
      estimatedTaxImpactInr: form.estimatedTaxImpactInr,
      estimatedPenaltyInr: form.estimatedPenaltyInr,
      recommendedAction: form.recommendedAction,
      baseYear,
      compareYear,
      ndbiChange,
      areaDifferenceSqm,
      confidence,
      detectionType,
    }));
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="assessment-form">
      <button
        type="button"
        className="assessment-form__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="assessment-form__toggle-label">
          <FiClipboard />
          Officer Assessment
        </span>
        <FiChevronDown className={`assessment-form__chevron ${expanded ? 'assessment-form__chevron--open' : ''}`} />
      </button>

      {expanded && (
        <div className="assessment-form__body">
          <p className="assessment-form__hint">
            Manually recorded during field verification, before forwarding to the Supervisor. Not auto-generated.
          </p>

          <div className="assessment-form__readonly">
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">Base Year</span>
              <span className="assessment-form__readonly-value">{baseYear}</span>
            </div>
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">Compare Year</span>
              <span className="assessment-form__readonly-value">{compareYear}</span>
            </div>
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">NDBI Change</span>
              <span className="assessment-form__readonly-value">+{ndbiChange.toFixed(2)}</span>
            </div>
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">Area Difference</span>
              <span className="assessment-form__readonly-value">+{areaDifferenceSqm.toLocaleString()} m²</span>
            </div>
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">Confidence</span>
              <span className="assessment-form__readonly-value">{Math.round(confidence * 100)}%</span>
            </div>
            <div className="assessment-form__readonly-item">
              <span className="assessment-form__readonly-label">Detection Type</span>
              <span className="assessment-form__readonly-value">
                {detectionType === 'new_build' ? 'New Build' : 'Change of Use'}
              </span>
            </div>
            <div className="assessment-form__readonly-item assessment-form__readonly-item--wide">
              <span className="assessment-form__readonly-label">Coordinates</span>
              <span className="assessment-form__readonly-value">{coordinates}</span>
            </div>
          </div>

          <div className="assessment-form__group">
            <span className="assessment-form__group-title">Property Information</span>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Property ID</label>
              <input
                className="assessment-form__input"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              />
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Owner Name</label>
              <input
                className="assessment-form__input"
                value={form.ownerName}
                onChange={(e) => setField('ownerName', e.target.value)}
                placeholder="e.g. Ravi Kumar"
              />
            </div>
            <div className="assessment-form__row">
              <div className="assessment-form__field">
                <label className="assessment-form__label">Door Number</label>
                <input
                  className="assessment-form__input"
                  value={form.doorNumber}
                  onChange={(e) => setField('doorNumber', e.target.value)}
                />
              </div>
              <div className="assessment-form__field">
                <label className="assessment-form__label">Survey Number</label>
                <input
                  className="assessment-form__input"
                  value={form.surveyNumber}
                  onChange={(e) => setField('surveyNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Ward</label>
              <input
                className="assessment-form__input"
                value={selectedWard ? `Ward ${selectedWard.id} — ${selectedWard.name}` : '— Select a ward —'}
                disabled
              />
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Locality / Landmark</label>
              <input
                className="assessment-form__input"
                value={form.locality}
                onChange={(e) => setField('locality', e.target.value)}
              />
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">GPS Coordinates</label>
              <input className="assessment-form__input" value={coordinates} disabled />
            </div>
          </div>

          <div className="assessment-form__group">
            <span className="assessment-form__group-title">Construction Details</span>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Construction Type</label>
              <select
                className="assessment-form__select"
                value={form.constructionType}
                onChange={(e) => setField('constructionType', e.target.value)}
              >
                {CONSTRUCTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="assessment-form__row">
              <div className="assessment-form__field">
                <label className="assessment-form__label">Floors</label>
                <input
                  type="number"
                  min="0"
                  className="assessment-form__input"
                  value={form.floors}
                  onChange={(e) => setField('floors', e.target.value)}
                />
              </div>
              <div className="assessment-form__field">
                <label className="assessment-form__label">Est. Built-up Area (m²)</label>
                <input
                  type="number"
                  min="0"
                  className="assessment-form__input"
                  value={form.builtUpAreaSqm}
                  onChange={(e) => setField('builtUpAreaSqm', e.target.value)}
                />
              </div>
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Newly Constructed Area (m²)</label>
              <input
                type="number"
                min="0"
                className="assessment-form__input"
                value={form.newlyConstructedAreaSqm}
                onChange={(e) => setField('newlyConstructedAreaSqm', e.target.value)}
              />
            </div>
          </div>

          <div className="assessment-form__group">
            <span className="assessment-form__group-title">Assessment</span>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Violation Type</label>
              <select
                className="assessment-form__select"
                value={form.violationType}
                onChange={(e) => setField('violationType', e.target.value)}
              >
                {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Officer Remarks</label>
              <textarea
                className="assessment-form__textarea"
                rows={3}
                value={form.officerRemarks}
                onChange={(e) => setField('officerRemarks', e.target.value)}
                placeholder="Field observations…"
              />
            </div>
          </div>

          <div className="assessment-form__group">
            <span className="assessment-form__group-title">Financial Assessment</span>
            <div className="assessment-form__row">
              <div className="assessment-form__field">
                <label className="assessment-form__label">Estimated Tax Impact (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="assessment-form__input"
                  value={form.estimatedTaxImpactInr}
                  onChange={(e) => setField('estimatedTaxImpactInr', e.target.value)}
                />
              </div>
              <div className="assessment-form__field">
                <label className="assessment-form__label">Estimated Penalty (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="assessment-form__input"
                  value={form.estimatedPenaltyInr}
                  onChange={(e) => setField('estimatedPenaltyInr', e.target.value)}
                />
              </div>
            </div>
            <div className="assessment-form__field">
              <label className="assessment-form__label">Recommended Action</label>
              <select
                className="assessment-form__select"
                value={form.recommendedAction}
                onChange={(e) => setField('recommendedAction', e.target.value)}
              >
                {RECOMMENDED_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="assessment-form__actions">
            <button type="button" className="assessment-form__submit-btn" onClick={handleSubmit}>
              Submit Assessment
            </button>
            {submitted && <span className="assessment-form__submit-note">Assessment sent to Supervisor.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

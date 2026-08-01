import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import WardSelector from '../components/WardSelector.jsx';
import StatsBar from '../components/StatsBar.jsx';
import MapView from '../components/MapView.jsx';
import PropertyList from '../components/PropertyList.jsx';
import ConfidenceCard from '../components/ConfidenceCard.jsx';
import VerifyPanel from '../components/VerifyPanel.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import PageMotion from '../components/PageMotion.jsx';
import ComparisonControls from '../components/ComparisonControls.jsx';
import OfficerAssessmentForm from '../components/OfficerAssessmentForm.jsx';
import RaiseTicketPanel from '../components/RaiseTicketPanel.jsx';
import { selectSelectedProperty, selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import { selectWardsError, selectSelectedWardId } from '../Redux/slices/wardsSlice.js';
import {
  fetchNdbiGrid,
  fetchComparisonStats,
  clearGrid,
  clearComparisonStats,
  selectWardYearPairs,
  selectNdbiError,
  selectComparisonStats,
  selectComparisonStatus,
  pickDefaultPair,
} from '../Redux/slices/ndbiSlice.js';
import './FieldOfficerView.css';

export default function FieldOfficerView() {
  const dispatch = useDispatch();
  const selectedProperty = useSelector(selectSelectedProperty);
  const propertiesError = useSelector(selectPropertiesError);
  const wardsError = useSelector(selectWardsError);
  const ndbiError = useSelector(selectNdbiError);
  const error = propertiesError || wardsError || ndbiError;

  const selectedWardId = useSelector(selectSelectedWardId);
  const yearPairs = useSelector(selectWardYearPairs);
  const comparisonStats = useSelector(selectComparisonStats);
  const comparisonStatus = useSelector(selectComparisonStatus);

  const baseYearOptions = useMemo(
    () => Array.from(new Set(yearPairs.map((p) => p.baselineYear))).sort((a, b) => a - b),
    [yearPairs]
  );

  const [baseYear, setBaseYear] = useState(null);
  const [compareYear, setCompareYear] = useState(null);
  const [ticketMode, setTicketMode] = useState(false);
  const [ticketRaised, setTicketRaised] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const detailRef = useRef(null);

  const compareYearOptions = useMemo(
    () => Array.from(new Set(yearPairs.filter((p) => p.baselineYear === baseYear).map((p) => p.comparisonYear))).sort((a, b) => a - b),
    [yearPairs, baseYear]
  );

  // Ward switched (or years finished loading) — pick a default that is
  // guaranteed to be a real (baseline, comparison) pair, never a synthesized
  // combination that doesn't exist in the data.
  useEffect(() => {
    const defaultPair = pickDefaultPair(yearPairs);
    setBaseYear(defaultPair?.baselineYear ?? null);
    setCompareYear(defaultPair?.comparisonYear ?? null);
  }, [yearPairs]);

  useEffect(() => {
    if (!selectedWardId || baseYear == null || compareYear == null || baseYear >= compareYear) {
      dispatch(clearGrid());
      dispatch(clearComparisonStats());
      return;
    }
    dispatch(fetchNdbiGrid({ wardId: selectedWardId, baselineYear: baseYear, comparisonYear: compareYear }));
    dispatch(fetchComparisonStats({ wardId: selectedWardId, baselineYear: baseYear, comparisonYear: compareYear }));
  }, [selectedWardId, baseYear, compareYear, dispatch]);

  useEffect(() => {
    setTicketMode(false);
    setTicketRaised(false);
    setShowToast(false);
  }, [selectedProperty?.id]);

  useEffect(() => {
    if (!selectedProperty) return;
    const timer = setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedProperty?.id]);

  function handleTicketSuccess() {
    setTicketRaised(true);
    setTicketMode(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  function handleBaseYearChange(year) {
    setBaseYear(year);
    const validCompareYears = yearPairs.filter((p) => p.baselineYear === year).map((p) => p.comparisonYear);
    if (!validCompareYears.includes(compareYear)) {
      setCompareYear(validCompareYears.length ? Math.max(...validCompareYears) : null);
    }
  }

  function handleCompareYearChange(year) {
    setCompareYear(year);
    const validBaseYears = yearPairs.filter((p) => p.comparisonYear === year).map((p) => p.baselineYear);
    if (!validBaseYears.includes(baseYear)) {
      setBaseYear(validBaseYears.length ? Math.min(...validBaseYears) : null);
    }
  }

  return (
    <PageMotion className="officer-view">
      <div className="officer-view__map">
        <MapView />
      </div>

      <div className="officer-view__overlay">
        <AnimatePresence>
          {showToast && (
            <motion.div
              className="officer-view__toast"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              Ticket submitted successfully.
            </motion.div>
          )}
        </AnimatePresence>
        <div className="officer-view__toolbar glass-panel">
          <div className="officer-view__topbar">
            <h1 className="officer-view__title">Field Officer</h1>
            <WardSelector />
          </div>
          {error && (
            <div className="view-error-banner officer-view__error">
              Failed to load data: {error}
            </div>
          )}
          <ComparisonControls
            baseYearOptions={baseYearOptions}
            compareYearOptions={compareYearOptions}
            baseYear={baseYear}
            compareYear={compareYear}
            onBaseYearChange={handleBaseYearChange}
            onCompareYearChange={handleCompareYearChange}
            stats={comparisonStats}
            isLoading={comparisonStatus === 'loading'}
          />
          <div className="officer-view__section">
            <span className="officer-view__section-heading">Analytics</span>
            <StatsBar variant="badge" />
          </div>
          <div className="officer-view__section">
            <span className="officer-view__section-heading">Properties</span>
            <PropertyList />
            <AnimatePresence mode="wait">
              {selectedProperty && !ticketMode && (
                <motion.div
                  key={selectedProperty.id}
                  ref={detailRef}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="officer-view__detail"
                >
                  <ConfidenceCard />
                  <VerifyPanel />
                  <button
                    className={`officer-view__raise-ticket-btn${ticketRaised ? ' officer-view__raise-ticket-btn--raised' : ''}`}
                    onClick={() => setTicketMode(true)}
                    disabled={ticketRaised}
                    type="button"
                  >
                    {ticketRaised ? 'Ticket Raised' : 'Raise a Ticket'}
                  </button>
                </motion.div>
              )}
              {selectedProperty && ticketMode && (
                <motion.div
                  key={`${selectedProperty.id}-ticket`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="officer-view__detail"
                >
                  <RaiseTicketPanel
                    onBack={() => setTicketMode(false)}
                    onSuccess={handleTicketSuccess}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* <OfficerAssessmentForm baseYear={baseYear} compareYear={compareYear} /> */}
        </div>
      </div>

      <ChatPanel />
    </PageMotion>
  );
}

import React, { useState, useEffect, useRef } from 'react';
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
import { COMPARISON_YEARS } from '../mockData/comparisonData.js';
import { selectSelectedProperty, selectPropertiesError, fetchProperties } from '../Redux/slices/propertiesSlice.js';
import { selectSelectedWardId, selectWardsError } from '../Redux/slices/wardsSlice.js';
import './FieldOfficerView.css';

export default function FieldOfficerView() {
  const dispatch = useDispatch();
  const selectedProperty = useSelector(selectSelectedProperty);
  const selectedWardId = useSelector(selectSelectedWardId);
  const propertiesError = useSelector(selectPropertiesError);
  const wardsError = useSelector(selectWardsError);
  const error = propertiesError || wardsError;

  const [baseYear, setBaseYear] = useState(COMPARISON_YEARS[0]);
  const [compareYear, setCompareYear] = useState(COMPARISON_YEARS[1]);
  const [ticketMode, setTicketMode] = useState(false);
  const [ticketRaised, setTicketRaised] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const detailRef = useRef(null);
  const yearInitRef = useRef(true);

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
    if (compareYear <= year) {
      setCompareYear(COMPARISON_YEARS.find((y) => y > year) ?? year);
    }
  }

  function handleCompareYearChange(year) {
    setCompareYear(year);
    if (year <= baseYear) {
      setBaseYear([...COMPARISON_YEARS].reverse().find((y) => y < year) ?? year);
    }
  }

  // Re-fetch properties filtered by comparison year whenever year changes (skip first render)
  useEffect(() => {
    if (yearInitRef.current) { yearInitRef.current = false; return; }
    if (!selectedWardId) return;
    dispatch(fetchProperties({ wardId: selectedWardId, compareYear }));
  }, [compareYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageMotion className="officer-view">
      <div className="officer-view__map">
        <MapView heatmap={!!selectedWardId} />
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
            <WardSelector compareYear={compareYear} />
          </div>
          {error && (
            <div className="view-error-banner officer-view__error">
              Failed to load data: {error}
            </div>
          )}
          <ComparisonControls
            baseYear={baseYear}
            compareYear={compareYear}
            onBaseYearChange={handleBaseYearChange}
            onCompareYearChange={handleCompareYearChange}
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

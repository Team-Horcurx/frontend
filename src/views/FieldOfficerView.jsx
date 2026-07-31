import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { COMPARISON_YEARS } from '../mockData/comparisonData.js';
import { selectSelectedProperty, selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import { selectWardsError } from '../Redux/slices/wardsSlice.js';
import './FieldOfficerView.css';

export default function FieldOfficerView() {
  const selectedProperty = useSelector(selectSelectedProperty);
  const propertiesError = useSelector(selectPropertiesError);
  const wardsError = useSelector(selectWardsError);
  const error = propertiesError || wardsError;

  const [baseYear, setBaseYear] = useState(COMPARISON_YEARS[0]);
  const [compareYear, setCompareYear] = useState(COMPARISON_YEARS[1]);

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

  return (
    <PageMotion className="officer-view">
      <div className="officer-view__map">
        <MapView />
      </div>

      <div className="officer-view__overlay">
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
              {selectedProperty && (
                <motion.div
                  key={selectedProperty.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="officer-view__detail"
                >
                  <ConfidenceCard />
                  <VerifyPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <OfficerAssessmentForm baseYear={baseYear} compareYear={compareYear} />
        </div>
      </div>

      <ChatPanel />
    </PageMotion>
  );
}
